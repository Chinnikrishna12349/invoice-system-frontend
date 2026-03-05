package com.invoiceapp.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${file.upload-dir:uploads}")
    private String uploadDir;

    // Resource handling is now fully managed by UploadController to ensure
    // consistent behavior across environments (local vs Render) and better logging.
    // The previously existing addResourceHandlers method has been removed to
    // prevent conflicts.
}
