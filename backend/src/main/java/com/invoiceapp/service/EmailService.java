package com.invoiceapp.service;

import com.invoiceapp.dto.InvoiceDTO;
import java.util.List;

public interface EmailService {
    void sendInvoiceEmail(InvoiceDTO invoice);

    void sendInvoiceEmail(InvoiceDTO invoice, List<String> additionalEmails);

    void sendInvoiceEmail(InvoiceDTO invoice, String recipientEmail);

    void sendInvoiceEmailWithPdf(InvoiceDTO invoice, byte[] pdfBytes);

    void sendInvoiceEmailWithPdf(InvoiceDTO invoice, byte[] pdfBytes, List<String> additionalEmails);
}
