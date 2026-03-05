package com.invoiceapp.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * Controller to serve uploaded files directly from the /uploads/** path.
 * This ensures files are accessible even when static resource handling fails.
 */
@RestController
@RequestMapping("/uploads")
public class UploadController {

    private static final Logger logger = LoggerFactory.getLogger(UploadController.class);

    @Value("${file.upload-dir:uploads}")
    private String uploadDir;

    /**
     * Serves files from the uploads directory.
     * Handles requests like: GET /uploads/logo_123_uuid.jpg
     */
    @GetMapping("/{filename:.+}")
    public ResponseEntity<Resource> serveFile(@PathVariable String filename) {
        try {
            // Standardize path resolution
            Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
            Path filePath = uploadPath.resolve(filename).normalize();

            logger.info("Serving file request: '{}'", filename);
            logger.info("  - Upload Base Dir: '{}'", uploadPath);
            logger.info("  - Target File Path: '{}'", filePath);

            // Security check: ensure the file is within the upload directory
            if (!filePath.startsWith(uploadPath)) {
                logger.warn("SECURITY ALERT: Attempted path traversal! Request: '{}', Resolved: '{}'", filename,
                        filePath);
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }

            // Check if file exists
            if (!Files.exists(filePath)) {
                logger.error("File NOT FOUND at path: '{}'", filePath);
                // List files in directory to help debugging (be careful with this in prod, but
                // essential here)
                try (var stream = Files.list(uploadPath)) {
                    String availableFiles = stream.map(p -> p.getFileName().toString())
                            .reduce((a, b) -> a + ", " + b)
                            .orElse("EMPTY DIRECTORY");
                    logger.info("  - Available files in upload dir: [{}]", availableFiles);
                } catch (Exception e) {
                    logger.warn("  - Could not list directory contents: {}", e.getMessage());
                }
                return ResponseEntity.notFound().build();
            }

            // Check for file vs folder
            if (!Files.isRegularFile(filePath)) {
                logger.warn("Path exists but is NOT a regular file: '{}'", filePath);
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
            }

            // Load file as Resource
            Resource resource = new UrlResource(filePath.toUri());

            if (!resource.exists() || !resource.isReadable()) {
                logger.error("File exists but CANNOT BE READ (permissions?): '{}'", filePath);
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
            }

            // Determine content type
            String contentType = determineContentType(filePath);

            logger.info("Successfully serving '{}' (Content-Type: {}, Size: {} bytes)",
                    filename, contentType, Files.size(filePath));

            // Return the file with appropriate headers
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CACHE_CONTROL, "public, max-age=31536000") // Cache for 1 year
                    .header(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, "*") // Allow CORS
                    .body(resource);

        } catch (MalformedURLException e) {
            logger.error("Malformed URL for file: {}", filename, e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        } catch (IOException e) {
            logger.error("IO error serving file: {}", filename, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        } catch (Exception e) {
            logger.error("Unexpected error serving file: {}", filename, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Determines the content type of a file based on its extension.
     */
    private String determineContentType(Path filePath) {
        try {
            String contentType = Files.probeContentType(filePath);
            if (contentType != null) {
                return contentType;
            }
        } catch (IOException e) {
            logger.warn("Could not determine content type for: {}", filePath);
        }

        // Fallback based on file extension
        String filename = filePath.getFileName().toString().toLowerCase();
        if (filename.endsWith(".jpg") || filename.endsWith(".jpeg")) {
            return "image/jpeg";
        } else if (filename.endsWith(".png")) {
            return "image/png";
        } else if (filename.endsWith(".gif")) {
            return "image/gif";
        } else if (filename.endsWith(".pdf")) {
            return "application/pdf";
        } else if (filename.endsWith(".svg")) {
            return "image/svg+xml";
        }

        // Default to octet-stream
        return "application/octet-stream";
    }
}
