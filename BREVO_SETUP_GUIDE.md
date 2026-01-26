# Brevo Email Service Setup Guide

## Overview

The email service now supports **Brevo API** as the primary email provider with **Gmail SMTP** as an automatic fallback. This provides robust, reliable email delivery.

## Email Provider Architecture

### Three-Tier Fallback System

```
Tier 1: Brevo API (Recommended - Most Reliable)
   ↓ (If unavailable)
Tier 2: Gmail SMTP (Proven Backup)
   ↓ (If unavailable)
Tier 3: Console Logger (Test/Development)
```

## Option 1: Set Up Brevo API (Recommended) ⭐

### Step 1: Create Free Brevo Account

1. Visit https://brevo.com (formerly Sendinblue)
2. Click "Create account" and sign up
3. Verify your email address
4. Complete your profile

### Step 2: Get Your API Key

1. Log in to Brevo dashboard
2. Click **Settings** → **Account**
3. Click **API Keys** in the left sidebar
4. Click **Create API Key** (v3 keys)
5. Name it: "Invoice App Email Service"
6. Copy the full API key (starts with `sk_` or similar)

### Step 3: Set Environment Variables (Windows PowerShell)

```powershell
# Set Brevo configuration
$env:EMAIL_MODE = "PRODUCTION"
$env:BREVO_API_KEY = "<paste_your_api_key_here>"

# (Optional) Set Gmail as fallback
$env:GMAIL_USER = "chinnikrishnamaddana@gmail.com"
$env:GMAIL_PASS = "Chinni@100@100"

# Verify they're set
Write-Host "EMAIL_MODE: $env:EMAIL_MODE"
Write-Host "BREVO_API_KEY: $($env:BREVO_API_KEY.Substring(0, 8))...***"
```

### Step 4: Restart Email Service

```powershell
# Stop the running email service
Get-Job -Name EmailService | Stop-Job | Remove-Job -Force

# Start with new configuration
Start-Job -ScriptBlock {
  cd "c:\Users\Lenovo\Downloads\react-invoice-generator"
  node email-service-node.mjs
} -Name EmailService

# View startup logs
Get-Job -Name EmailService | Receive-Job -Keep
```

### Step 5: Verify Setup

Check the email service status:

```powershell
curl http://localhost:5000/status | ConvertFrom-Json | Format-Table -AutoSize
```

Expected output shows:

```
current_mode      current_provider    available_providers
-----------       ----------------    -------------------
PRODUCTION        Brevo API           {Brevo API, Gmail SMTP, Console Logger}
```

## Option 2: Use Gmail SMTP Fallback

If you don't want to set up Brevo, Gmail will be used as the fallback provider.

### Step 1: Generate Gmail App Password

1. Go to https://myaccount.google.com/security
2. Enable **2-Step Verification** if not already enabled
3. Go back to Security settings
4. Scroll down and click **App passwords**
5. Select: App = Mail, Device = Windows Computer
6. Copy the 16-character password

### Step 2: Set Environment Variables

```powershell
$env:EMAIL_MODE = "PRODUCTION"
$env:GMAIL_USER = "chinnikrishnamaddana@gmail.com"
$env:GMAIL_PASS = "<your_16_char_app_password>"

# Verify
Write-Host "GMAIL_USER: $env:GMAIL_USER"
Write-Host "GMAIL_PASS: $($env:GMAIL_PASS.Substring(0, 8))...***"
```

### Step 3: Restart Email Service

Same as Option 1, Step 4

## Option 3: Test Mode (Development)

To test without setting up email providers:

```powershell
# Just set mode to TEST
$env:EMAIL_MODE = "TEST"

# Restart service
Get-Job -Name EmailService | Stop-Job | Remove-Job -Force
Start-Job -ScriptBlock {
  cd "c:\Users\Lenovo\Downloads\react-invoice-generator"
  node email-service-node.mjs
} -Name EmailService
```

**All emails will be logged to console** - useful for development/testing.

---

## Testing Email Sending

### Step 1: Access the Application

- Frontend: http://localhost:3000
- Backend: http://localhost:8080

### Step 2: Send Test Email

1. In the invoice list, click **Send Email** button
2. Enter recipient email address
3. Click **Send** button
4. Check email service logs:

```powershell
Get-Job -Name EmailService | Receive-Job -Keep
```

### Step 3: Verify Delivery

**For Brevo:**

- Check your Brevo dashboard → Messages → Sent
- Email arrives in recipient inbox in ~1-2 seconds

**For Gmail SMTP:**

- Check Gmail Sent folder
- Email arrives in ~5-10 seconds

**For Test Mode:**

- Check PowerShell job output
- Email details logged to console

---

## Troubleshooting

### Email Service Status

Check the health endpoint:

```powershell
curl http://localhost:5000/health
```

Response should show:

```json
{
  "status": "running",
  "port": 5000,
  "mode": "PRODUCTION",
  "provider": "Brevo API"
}
```

### Common Issues

**Issue: "BREVO_API_KEY not set"**

- Solution: Make sure you ran `$env:BREVO_API_KEY = "sk_..."` in same PowerShell window
- Note: Environment variables are session-specific

**Issue: "Email not being sent in PRODUCTION mode"**

- Check service logs: `Get-Job -Name EmailService | Receive-Job -Keep`
- Verify API key is correct
- Try fallback (Gmail) by checking logs for which provider was used

**Issue: "Connection refused on localhost:5000"**

- Email service isn't running
- Start it: `Start-Job -ScriptBlock { cd "c:\Users\Lenovo\Downloads\react-invoice-generator" ; node email-service-node.mjs } -Name EmailService`

**Issue: Gmail fallback authentication failed**

- Verify you're using 16-character App Password, not regular Gmail password
- Generate new one at https://myaccount.google.com/apppasswords

---

## Architecture Details

### Email Service Flow

```
Frontend (React)
    ↓ POST to /api/send-email
    ↓ (with invoice PDF as base64)
Node.js Email Service
    ↓
Check EMAIL_MODE environment variable
    ↓
If PRODUCTION:
  - Try Brevo API (REST API call)
  - If fails → Try Gmail SMTP (Nodemailer)
  - If fails → Use Console Logger
    ↓
If TEST:
  - Log email details to console
    ↓
Return status to Frontend
    ↓
Frontend displays success/error message
```

### Files Involved

- **Frontend**: `services/apiService.ts` - Calls email endpoint
- **Frontend**: `services/pdfService.ts` - Generates PDF as attachment
- **Backend**: `backend/src/main/java/com/invoiceapp/service/EmailService.java` - Database lookup
- **Email Service**: `email-service-node.mjs` - Primary email handler (Brevo/Gmail)

---

## Next Steps

1. ✅ Email service code updated with Brevo support
2. ⏳ **Choose:** Brevo (recommended) OR Gmail fallback
3. ⏳ Set environment variables with your credentials
4. ⏳ Restart email service
5. ⏳ Test email sending from invoice application
6. ✅ System ready for production use

---

## Support Resources

- **Brevo Help**: https://app.brevo.com/contact-support
- **Gmail App Passwords**: https://support.google.com/accounts/answer/185833
- **Nodemailer (Gmail)**: https://nodemailer.com/smtp/gmail/
- **Email Service API**: `http://localhost:5000/status` (when running)

---

**Last Updated**: Invoice System v1.0 with Brevo + Gmail Fallback
