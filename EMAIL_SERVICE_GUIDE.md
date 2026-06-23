# Email Service Configuration Guide

## Current Status

✅ **Email Service Running on Port 5000**

- **Mode**: TEST (default) - Emails are logged to console
- **Provider**: Mailtrap (ready for production)

## Email Sending Modes

### TEST MODE (Currently Active)

- Emails are logged to the service console
- No actual SMTP connection required
- Perfect for development and testing
- All email data (to, subject, attachments) is logged

### PRODUCTION MODE

To send real emails through Mailtrap SMTP:

1. **Sign up for Mailtrap** (FREE):

   - Visit: https://mailtrap.io
   - Create a free account
   - No credit card required

2. **Get Your SMTP Credentials**:

   - Log in to Mailtrap dashboard
   - Go to Integrations > SMTP
   - Copy your username and password

3. **Set Environment Variables**:

   ```powershell
   # Windows PowerShell
   $env:EMAIL_MODE = "PRODUCTION"
   $env:MAILTRAP_USER = "your_mailtrap_username"
   $env:MAILTRAP_PASS = "your_mailtrap_password"
   ```

4. **Restart Email Service**:

   ```powershell
   # Stop current service
   Get-Job -Name EmailService | Stop-Job | Remove-Job

   # Start with new environment variables
   Start-Job -ScriptBlock {
     cd "c:\Users\Lenovo\Downloads\react-invoice-generator"
     node email-service-node.mjs
   } -Name EmailService
   ```

## How Email Sending Works

### Frontend (React)

1. User clicks "Send Email" button on an invoice
2. Frontend generates PDF client-side using jsPDF
3. Calls Node.js email service at `http://localhost:5000/api/send-email`

### Email Service (Node.js on Port 5000)

1. Receives email request with:

   - **to**: Recipient email
   - **subject**: Email subject
   - **html**: HTML email body
   - **attachments**: Array of file attachments (PDF invoice)

2. **In TEST MODE**: Logs email details to console
3. **In PRODUCTION MODE**: Sends through Mailtrap SMTP

## Architecture Overview

```
┌─────────────┐
│   React     │
│  Frontend   │ (localhost:3000)
│  (Port 3000)│
└─────────────┘
       │
       │ HTTP POST /api/send-email
       │ (to, subject, html, attachments)
       ▼
┌─────────────┐         ┌──────────────┐
│  Node.js    │        │   Mailtrap   │
│   Email     │───────▶│    SMTP      │
│  Service    │        │  (Optional)  │
│ (Port 5000) │        └──────────────┘
└─────────────┘

MongoDB ◀── Spring Boot ◀── React Frontend
(Invoice (Port 8080)
Data)
```

## Testing Email Functionality

1. **Go to Application**: http://localhost:3000
2. **Create or Select Invoice**: Create a new invoice with employee email
3. **Click "Send Email" Button**:
   - Modal opens with recipient email pre-filled
   - Click "Send"
4. **Check Email Service Logs**:
   - Watch the console running `node email-service-node.mjs`
   - You'll see the email logged in TEST MODE
   - Or received in Mailtrap inbox in PRODUCTION MODE

## Troubleshooting

### Email Service Not Responding

- Ensure port 5000 is not in use
- Check: `netstat -ano | findstr ":5000"`
- Restart the service

### Mailtrap Connection Failed

- Verify MAILTRAP_USER and MAILTRAP_PASS are correct
- Check internet connection
- Service will automatically fall back to TEST mode

### PDF Not Attached

- Ensure PDF generation is successful on frontend
- Check browser console for errors
- Verify PDF bytes are being generated

## File Locations

- **Email Service**: `email-service-node.mjs`
- **Frontend API**: `services/apiService.ts`
- **PDF Service**: `services/pdfService.ts`
- **Backend Config**: `backend/src/main/resources/application.properties`

## Next Steps

1. Test email sending in TEST mode (current)
2. Sign up for Mailtrap free account
3. Update environment variables with Mailtrap credentials
4. Switch to PRODUCTION mode to send real emails
5. Emails will be received in your Mailtrap inbox

---

**Created**: December 4, 2025
**Last Updated**: Production-Ready Email Service
