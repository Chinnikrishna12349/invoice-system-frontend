package com.invoiceapp.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class FileStorageService {
    
    @Value("${file.upload-dir:uploads}")
    private String uploadDir;
    
    private static final Logger logger = LoggerFactory.getLogger(FileStorageService.class);
    
    public String storePdf(byte[] pdfContent, String filename, String userId) throws IOException {
        if (pdfContent == null || pdfContent.length == 0) {
            throw new IllegalArgumentException("PDF content cannot be null or empty");
        }
        
        // Create upload directory if it doesn't exist
        Path uploadPath = Paths.get(uploadDir);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }
        
        // Generate unique filename if not provided
        String uniqueFilename = "pdf_" + userId + "_" + 
            (filename != null ? filename : UUID.randomUUID().toString() + ".pdf");
        
        // Save file
        Path filePath = uploadPath.resolve(uniqueFilename);
        Files.write(filePath, pdfContent);
        
        // Return relative URL path
        return "/uploads/" + uniqueFilename;
    }
    
    public String storeFile(MultipartFile file, String userId) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File cannot be null or empty");
        }

        // Create upload directory if it doesn't exist
        Path uploadPath = Paths.get(uploadDir);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        // Get original filename and extension
        String originalFilename = file.getOriginalFilename();
        String fileExtension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }

        // Generate unique filename
        String uniqueFilename = "logo_" + userId + "_" + UUID.randomUUID().toString() + fileExtension;

        // Save file
        Path filePath = uploadPath.resolve(uniqueFilename);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        // Return relative URL path
        return "/uploads/" + uniqueFilename;
    }
    
    /**
     * Stores a file from a byte array
     * @param fileBytes The file content as a byte array
     * @param filename The name to give to the file (can include extension)
     * @return The relative URL path to the stored file
     * @throws IOException If an I/O error occurs
     */
    public String storeFile(byte[] fileBytes, String filename) throws IOException {
        if (fileBytes == null || fileBytes.length == 0) {
            throw new IllegalArgumentException("File bytes cannot be null or empty");
        }
        if (filename == null || filename.trim().isEmpty()) {
            throw new IllegalArgumentException("Filename cannot be null or empty");
        }

        // Create upload directory if it doesn't exist
        Path uploadPath = Paths.get(uploadDir);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        // Generate unique filename
        String uniqueFilename = "file_" + UUID.randomUUID().toString() + "_" + filename;

        // Save file
        Path filePath = uploadPath.resolve(uniqueFilename);
        Files.write(filePath, fileBytes);
        
        // Log the file storage details
        logger.info("File stored successfully at: {}", filePath.toAbsolutePath());
        logger.info("File size: {} bytes", fileBytes.length);
        logger.info("File will be accessible at: /uploads/{}", uniqueFilename);
        
        // Return the relative URL path that matches the WebConfig mapping
        return "/uploads/" + uniqueFilename;
    }
    
    public static class FileMetadata {
        private String fileId;
        private String filename;
        private String filePath;
        private String contentType;
        private long size;
        
        // Getters and setters
        public String getFileId() { return fileId; }
        public void setFileId(String fileId) { this.fileId = fileId; }
        public String getFilename() { return filename; }
        public void setFilename(String filename) { this.filename = filename; }
        public String getFilePath() { return filePath; }
        public void setFilePath(String filePath) { this.filePath = filePath; }
        public String getContentType() { return contentType; }
        public void setContentType(String contentType) { this.contentType = contentType; }
        public long getSize() { return size; }
        public void setSize(long size) { this.size = size; }
    }
    
    public FileMetadata getFileMetadata(String fileId) {
        // Remove the /uploads/ prefix if present
        String cleanFileId = fileId;
        if (fileId.startsWith("/uploads/")) {
            cleanFileId = fileId.substring("/uploads/".length());
        }
        
        Path filePath = Paths.get(uploadDir, cleanFileId);
        if (!Files.exists(filePath)) {
            return null;
        }
        
        try {
            FileMetadata metadata = new FileMetadata();
            metadata.setFileId(cleanFileId);
            metadata.setFilename(filePath.getFileName().toString());
            metadata.setFilePath(filePath.toString());
            metadata.setContentType(Files.probeContentType(filePath));
            metadata.setSize(Files.size(filePath));
            return metadata;
        } catch (IOException e) {
            logger.error("Error getting file metadata: {}", e.getMessage(), e);
            return null;
        }
    }
}

