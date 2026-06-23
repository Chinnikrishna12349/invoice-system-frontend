# Email Configuration Guide

This guide explains how to configure real email sending with PDF attachments for the Invoice Management System.

## ✅ Features

- ✅ Send invoices via email with PDF attachments
- ✅ HTML formatted email with invoice details
- ✅ Automatic PDF generation and attachment
- ✅ Gmail SMTP integration
- ✅ Error handling and user feedback

## 📋 Prerequisites

- Gmail account (free)
- Java backend running on port 8080
- Frontend running on port 3000

## 🔧 Setup Instructions

### Step 1: Enable Gmail Security Settings

1. Go to your Gmail account: https://myaccount.google.com/
2. Click on **Security** in the left menu
3. Enable **2-Step Verification** (if not already enabled)
4. After enabling 2-Step Verification, go back to Security
5. Look for **App passwords** option
6. Select **Mail** and **Windows Computer** (or your device)
7. Google will generate a 16-character password - **Copy this password**

### Step 2: Set Environment Variables

Set the following environment variables on your system:

**Windows PowerShell:**

```powershell
$env:MAIL_USERNAME = "your-email@gmail.com"
$env:MAIL_PASSWORD = "your-16-character-app-password"
```

**Windows Command Prompt:**

```cmd
set MAIL_USERNAME=your-email@gmail.com
set MAIL_PASSWORD=your-16-character-app-password
```

**Linux/Mac:**

```bash
export MAIL_USERNAME="your-email@gmail.com"
export MAIL_PASSWORD="your-16-character-app-password"
```

### Step 3: Update application.properties

The file `backend/src/main/resources/application.properties` already has:

```properties
# Mail Configuration
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=${MAIL_USERNAME}
spring.mail.password=${MAIL_PASSWORD}
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
spring.mail.properties.mail.smtp.starttls.required=true

# Sender Email
app.mail.from=your-email@gmail.com
app.mail.from-name=Invoice Management System
```

**Important:** Update `app.mail.from` to match your Gmail address.

### Step 4: Restart Backend

After setting environment variables, restart the backend:

```bash
cd backend
mvn clean spring-boot:run
```

### Step 5: Test Email Sending

1. Go to http://localhost:3000
2. Create an invoice with an email address
3. Click the **Send Email** button (📧)
4. Confirm the email in the modal
5. Check the recipient's inbox for the email with PDF attachment

## 🎯 Using the Feature

### Send Invoice via Email

1. **View Invoice List** - See all created invoices
2. **Click Send Email Button** (📧 icon on each invoice)
3. **Confirm in Modal** - Review invoice details and recipient email
4. **Click "Send"** - Send the email with PDF attached
5. **Success Message** - Confirm email was sent successfully

### What the Email Contains

- **Subject:** Your Invoice #{InvoiceNumber}
- **HTML Formatted Body:**
  - Greeting with employee name
  - Invoice number, date, and total amount
  - Invoice details table
  - Note about PDF attachment
- **PDF Attachment:** Professional invoice PDF file

## 🔍 Troubleshooting

### Email Not Sending

**Issue:** "Failed to send email" error

**Solutions:**

1. **Check Gmail App Password:**

   - Verify you generated a 16-character app password (not your regular password)
   - App passwords only work with 2-Step Verification enabled

2. **Check Environment Variables:**

   ```powershell
   # PowerShell - Verify environment variables are set
   $env:MAIL_USERNAME
   $env:MAIL_PASSWORD
   ```

   Both should display your credentials

3. **Restart Backend:**

   - Stop the backend (Ctrl+C)
   - Restart with: `mvn clean spring-boot:run`

4. **Check Email Format:**

   - Ensure the invoice has a valid email address
   - The email should be in format: `user@domain.com`

5. **Check Backend Logs:**
   - Look for error messages in the backend console
   - Common errors mention missing credentials or authentication failure

### Email Sending but Not Receiving

**Solutions:**

1. Check spam/junk folder
2. Verify the recipient email address is correct
3. Check Gmail "Sent Mail" to confirm it was sent
4. Wait a few minutes - emails may take time to arrive

### "Less secure app access" Error

**Solution:**

- If using older Gmail accounts, you may need to:
  1. Go to https://myaccount.google.com/lesssecureapps
  2. Enable "Allow less secure apps"
  3. Or preferably, use App Passwords as described above

## 📧 SMTP Configuration Details

- **Server:** smtp.gmail.com
- **Port:** 587 (TLS)
- **Authentication:** Required
- **Encryption:** STARTTLS

## 🔐 Security Notes

- **Never commit credentials** - Always use environment variables
- **Use App Passwords** - More secure than storing your Gmail password
- **Keep .env file private** - Add to .gitignore if creating one
- **Regenerate if compromised** - Can always create new app passwords

## 📝 Testing with Development Email

For testing without sending real emails, you can:

1. Create a test Gmail account
2. Use that account for MAIL_USERNAME
3. Send test invoices to it
4. Verify format and content

## ✅ Success Indicators

- ✅ "Email successfully sent" message appears
- ✅ Email arrives in recipient's inbox within 1-2 minutes
- ✅ Email contains invoice details and PDF attachment
- ✅ PDF opens correctly

## 📞 Support

If you encounter issues:

1. Check the backend console for detailed error messages
2. Verify all environment variables are set correctly
3. Ensure 2-Step Verification is enabled on Gmail account
4. Try sending a test email to yourself first
5. Check spam folder in recipient's email

---

**Happy invoicing! 🎉**
