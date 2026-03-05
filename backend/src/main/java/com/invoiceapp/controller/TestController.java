package com.invoiceapp.controller;

import com.invoiceapp.dto.InvoiceDTO;
import com.invoiceapp.service.EmailService;
import com.invoiceapp.service.PdfService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

/**
 * Test controller for email and PDF generation
 */
@RestController
@RequestMapping("/api/test")
public class TestController {

    private static final Logger logger = LoggerFactory.getLogger(TestController.class);

    private final EmailService emailService;
    private final PdfService pdfService;

    public TestController(EmailService emailService, PdfService pdfService) {
        this.emailService = emailService;
        this.pdfService = pdfService;
    }

    /**
     * Sends an email with a client-generated PDF attachment
     */
    @PostMapping("/send-email")
    public ResponseEntity<Map<String, Object>> sendEmailWithClientPdf(@RequestBody InvoiceDTO invoice) {
        try {
            // Log the request
            if (invoice.getPdfContent() != null) {
                double sizeMB = invoice.getPdfContent().length / (1024.0 * 1024.0);
                logger.info("Sending email with client-generated PDF attachment ({} MB)",
                        String.format("%.2f", sizeMB));

                // Check PDF size before attempting to send
                if (invoice.getPdfContent().length > 9 * 1024 * 1024) {
                    return createSizeErrorResponse(sizeMB);
                }
            }

            emailService.sendInvoiceEmail(invoice, invoice.getEmployeeEmail());
            return createSuccessResponse("Email with client PDF sent successfully");

        } catch (IllegalArgumentException e) {
            logger.error("Invalid request: {}", e.getMessage());
            return createErrorResponse(e.getMessage(), 400);

        } catch (Exception e) {
            logger.error("Failed to send email: {}", e.getMessage(), e);
            return createErrorResponse("Failed to send email: " + e.getMessage(), 500);
        }
    }

    /**
     * Generates PDF on the server and sends it via email
     */
    @PostMapping("/send-email/server-pdf")
    public ResponseEntity<Map<String, Object>> sendEmailWithServerPdf(@RequestBody InvoiceDTO invoice) {
        try {
            logger.info("Generating PDF on server and sending email");

            // Generate PDF on server
            byte[] pdfContent = pdfService.generateInvoicePdf(invoice);
            double sizeMB = pdfContent.length / (1024.0 * 1024.0);

            // Set the generated PDF content
            invoice.setPdfContent(pdfContent);

            logger.info("Generated server PDF size: {} MB", String.format("%.2f", sizeMB));

            // Send email with the generated PDF
            emailService.sendInvoiceEmail(invoice, invoice.getEmployeeEmail());

            return createSuccessResponse("Email with server-generated PDF sent successfully");

        } catch (IOException e) {
            logger.error("Failed to generate PDF: {}", e.getMessage(), e);
            return createErrorResponse("Failed to generate PDF: " + e.getMessage(), 500);

        } catch (Exception e) {
            logger.error("Failed to send email: {}", e.getMessage(), e);
            return createErrorResponse("Failed to send email: " + e.getMessage(), 500);
        }
    }

    private ResponseEntity<Map<String, Object>> createSizeErrorResponse(double sizeMB) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", false);
        response.put("error", "PDF size too large");
        response.put("sizeMB", String.format("%.2f MB", sizeMB));
        response.put("maxSizeMB", "9 MB");
        response.put("suggestion",
                "Please use the server-side PDF generation endpoint: POST /api/test/send-email/server-pdf");
        return ResponseEntity.badRequest().body(response);
    }

    private ResponseEntity<Map<String, Object>> createSuccessResponse(String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", message);
        return ResponseEntity.ok(response);
    }

    private ResponseEntity<Map<String, Object>> createErrorResponse(String error, int status) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", false);
        response.put("error", error);
        return ResponseEntity.status(status).body(response);
    }
}