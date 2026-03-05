package com.invoiceapp.dto;

public class EmailRequest {
    private String to;
    private String subject;
    private String body;
    private boolean sendInvoiceAttachment;
    
    public EmailRequest() {}
    
    public EmailRequest(String to, String subject, String body, boolean sendInvoiceAttachment) {
        this.to = to;
        this.subject = subject;
        this.body = body;
        this.sendInvoiceAttachment = sendInvoiceAttachment;
    }
    
    public String getTo() { return to; }
    public void setTo(String to) { this.to = to; }
    
    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }
    
    public String getBody() { return body; }
    public void setBody(String body) { this.body = body; }
    
    public boolean isSendInvoiceAttachment() { return sendInvoiceAttachment; }
    public void setSendInvoiceAttachment(boolean sendInvoiceAttachment) { this.sendInvoiceAttachment = sendInvoiceAttachment; }
}
