package com.invoiceapp.config;

import com.invoiceapp.entity.User;
import com.invoiceapp.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Data Initializer
 * Creates a default test user on application startup if no users exist
 * 
 * Default credentials:
 * Email: admin@invoiceapp.com
 * Password: admin123
 * 
 * IMPORTANT: Change these credentials in production!
 */
@Component
public class DataInitializer implements CommandLineRunner {
    
    @Autowired
    private UserRepository userRepository;
    
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    
    @Override
    public void run(String... args) throws Exception {
        // Only create test user if no users exist
        if (userRepository.count() == 0) {
            User testUser = new User();
            testUser.setEmail("admin@invoiceapp.com");
            testUser.setPassword(passwordEncoder.encode("admin123")); // bcrypt hashed
            testUser.setName("Admin User");
            
            userRepository.save(testUser);
            System.out.println("=========================================");
            System.out.println("Test user created:");
            System.out.println("Email: admin@invoiceapp.com");
            System.out.println("Password: admin123");
            System.out.println("=========================================");
        }
    }
}

