package com.invoiceapp.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class FileStorageConfig {

    private static final Logger logger = LoggerFactory.getLogger(FileStorageConfig.class);
    
    @Value("${file.upload-dir:uploads}")
    private String uploadDir;

    @PostConstruct
    public void init() {
        try {
            Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
            Files.createDirectories(uploadPath);
            logger.info("Created upload directory: {}", uploadPath);
        } catch (IOException e) {
            logger.error("Could not create upload directory: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to create upload directory", e);
        } catch (Exception e) {
            logger.error("Unexpected error while initializing upload directory: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to initialize upload directory", e);
        }
    }

    @Bean
    public Path uploadDirectory() {
        return Paths.get(uploadDir).toAbsolutePath().normalize();
    }
}