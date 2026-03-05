package com.invoiceapp;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.boot.CommandLineRunner;
import org.springframework.beans.factory.annotation.Value;

import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;

@SpringBootApplication(exclude = { UserDetailsServiceAutoConfiguration.class })
public class InvoiceManagementApplication {

    @Value("${spring.mail.host:NOT SET}")
    private String mailHost;

    @Value("${spring.mail.port:NOT SET}")
    private String mailPort;

    @Value("${spring.mail.username:NOT SET}")
    private String mailUsername;

    public static void main(String[] args) {
        SpringApplication.run(InvoiceManagementApplication.class, args);
    }

    @Bean
    public CommandLineRunner init() {
        return args -> {
            System.out.println("\n======= EMAIL CONFIGURATION =======");
            System.out.println("Mail Host: " + mailHost);
            System.out.println("Mail Port: " + mailPort);
            System.out.println("Mail Username: " + (mailUsername.contains("NOT SET") ? "NOT SET"
                    : mailUsername.substring(0, Math.min(10, mailUsername.length())) + "..."));
            System.out.println("===================================\n");
        };
    }

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new CorsConfigurer();
    }

    private static class CorsConfigurer implements WebMvcConfigurer {
        @Override
        public void addCorsMappings(CorsRegistry registry) {
            registry.addMapping("/api/**")
                    .allowedOrigins(
                            "http://localhost:5173",
                            "http://localhost:5174",
                            "http://localhost:3005", // preview/dev alt port
                            "http://localhost:3002",
                            "http://localhost:3001",
                            "http://localhost:3000")
                    .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                    .allowedHeaders("*")
                    .allowCredentials(true)
                    .maxAge(3600);
        }
    }
}
