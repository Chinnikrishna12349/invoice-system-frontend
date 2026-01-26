import nodemailer from 'nodemailer';
import express from 'express';
import cors from 'cors';

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(cors());

// Configuration
const EMAIL_MODE = process.env.EMAIL_MODE || 'TEST';
const BREVO_API_KEY = process.env.BREVO_API_KEY || '';
const GMAIL_USER = 'chinnikrishnamaddana@gmail.com';
const GMAIL_PASS = process.env.GMAIL_PASS || process.env.MAILTRAP_PASS || 'Chinni@100@100';

console.log('\n🔑 Loading email configuration...');
console.log(`   EMAIL_MODE: ${EMAIL_MODE}`);
console.log(`   BREVO_API_KEY: ${BREVO_API_KEY ? '✓ Set' : '✗ Not set'}`);
console.log(`   GMAIL_USER: ${GMAIL_USER ? '✓ Set' : '✗ Not set'}\n`);

let transporter = null;
let emailMode = EMAIL_MODE;
let emailProvider = 'None';

// Configure email transporter based on mode
if (EMAIL_MODE === 'PRODUCTION') {
  // Try Brevo first (most reliable)
  if (BREVO_API_KEY) {
    console.log('📧 Attempting to connect to Brevo API...\n');
    // Brevo REST API is ready - we'll use it directly with fetch
    emailProvider = 'Brevo API';
    emailMode = 'PRODUCTION';
    console.log('✅ Brevo API configured successfully!\n');
  }
  
  // Fallback to Gmail SMTP if no Brevo
  if (!emailProvider && GMAIL_USER && GMAIL_PASS) {
    console.log('📧 Attempting to connect to Gmail SMTP...\n');
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: GMAIL_USER,
        pass: GMAIL_PASS
      }
    });
    
    transporter.verify((error) => {
      if (error) {
        console.log('⚠️  Gmail connection failed:', error.message);
        console.log('   Falling back to TEST mode for logging\n');
        emailMode = 'TEST';
        transporter = null;
        emailProvider = 'Console Logger';
      } else {
        console.log('✅ Connected to Gmail SMTP successfully!\n');
        emailProvider = 'Gmail SMTP';
      }
    });
  }
  
  // If neither Brevo nor Gmail, use test mode
  if (!emailProvider) {
    console.log('📧 No email provider fully configured, using TEST mode\n');
    emailMode = 'TEST';
    emailProvider = 'Console Logger';
  }
} else {
  // Test mode - mock transporter (logs emails)
  emailMode = 'TEST';
  emailProvider = 'Console Logger';
  console.log('🧪 Email service in TEST mode (emails will be logged)\n');
}


app.post('/api/send-email', async (req, res) => {
  try {
    const { to, subject, html, attachments } = req.body;

    if (!to || !subject || !html) {
      return res.status(400).json({ error: 'Missing required fields: to, subject, html' });
    }

    if (emailMode === 'TEST') {
      // TEST MODE: Just log the email
      console.log('\n📧 ====== EMAIL LOGGED (TEST MODE) ======');
      console.log(`📝 To: ${to}`);
      console.log(`📧 Subject: ${subject}`);
      console.log(`📄 HTML Body: ${html.substring(0, 100)}...`);
      if (attachments && attachments.length > 0) {
        console.log(`📎 Attachments: ${attachments.length}`);
        attachments.forEach((att, i) => {
          console.log(`   ${i+1}. ${att.filename || 'unnamed'}`);
        });
      }
      console.log('==========================================\n');
      
      res.json({ 
        success: true, 
        message: 'Email logged (TEST MODE)',
        mode: 'TEST',
        status: 'logged'
      });
    } else if (emailProvider === 'Brevo API' && BREVO_API_KEY) {
      // PRODUCTION MODE: Send via Brevo REST API
      try {
        // Prepare attachment data for Brevo
        const brevoAttachments = [];
        if (attachments && Array.isArray(attachments) && attachments.length > 0) {
          attachments.forEach(att => {
            brevoAttachments.push({
              name: att.filename || 'attachment',
              content: att.content
            });
          });
        }

        // Make request to Brevo API
        const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'api-key': BREVO_API_KEY,
            'content-type': 'application/json'
          },
          body: JSON.stringify({
            sender: {
              name: 'Invoice System',
              email: GMAIL_USER
            },
            to: [{ email: to }],
            subject: subject,
            htmlContent: html,
            attachment: brevoAttachments.length > 0 ? brevoAttachments : undefined,
            replyTo: {
              email: GMAIL_USER
            }
          })
        });

        const brevoResult = await brevoResponse.json();

        if (brevoResponse.ok) {
          console.log('\n📧 ====== EMAIL SENT (BREVO API) ======');
          console.log(`✅ To: ${to}`);
          console.log(`📧 Subject: ${subject}`);
          console.log(`📨 Message ID: ${brevoResult.messageId}`);
          if (brevoAttachments.length > 0) {
            console.log(`📎 Attachments: ${brevoAttachments.length}`);
            brevoAttachments.forEach((att, i) => {
              console.log(`   ${i+1}. ${att.name}`);
            });
          }
          console.log('=====================================\n');

          res.json({ 
            success: true, 
            message: 'Email sent successfully via Brevo',
            mode: 'PRODUCTION',
            provider: 'Brevo API',
            messageId: brevoResult.messageId,
            status: 'sent'
          });
        } else {
          throw new Error(brevoResult.message || 'Brevo API error');
        }
      } catch (brevoError) {
        console.error('❌ Brevo API error:', brevoError.message);
        res.status(500).json({ 
          success: false, 
          error: brevoError.message,
          provider: 'Brevo API'
        });
      }
    } else if (emailProvider === 'Gmail SMTP' && transporter) {
      // PRODUCTION MODE: Send via Gmail SMTP
      const mailOptions = {
        from: GMAIL_USER,
        to: to,
        subject: subject,
        html: html
      };

      // Add attachments if provided
      if (attachments && Array.isArray(attachments)) {
        mailOptions.attachments = attachments.map(att => ({
          filename: att.filename || 'attachment',
          content: att.content,
          encoding: att.encoding || 'base64'
        }));
      }

      try {
        const info = await transporter.sendMail(mailOptions);
        
        console.log('\n📧 ====== EMAIL SENT (GMAIL SMTP) ======');
        console.log(`✅ To: ${to}`);
        console.log(`📧 Subject: ${subject}`);
        console.log(`📨 Message ID: ${info.messageId}`);
        if (attachments && attachments.length > 0) {
          console.log(`📎 Attachments: ${attachments.length}`);
          attachments.forEach((att, i) => {
            console.log(`   ${i+1}. ${att.filename || 'unnamed'}`);
          });
        }
        console.log('=======================================\n');

        res.json({ 
          success: true, 
          message: 'Email sent successfully via Gmail',
          mode: 'PRODUCTION',
          provider: 'Gmail SMTP',
          messageId: info.messageId,
          status: 'sent'
        });
      } catch (gmailError) {
        console.error('❌ Gmail SMTP error:', gmailError.message);
        res.status(500).json({ 
          success: false, 
          error: gmailError.message,
          provider: 'Gmail SMTP'
        });
      }
    } else {
      res.status(500).json({
        success: false,
        error: 'Email service not properly configured',
        mode: emailMode,
        provider: emailProvider
      });
    }
  } catch (error) {
    console.error('❌ Error processing email:', error.message);
    res.status(500).json({ 
      success: false, 
      error: error.message
    });
  }
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'running',
    port: 5000,
    mode: emailMode,
    provider: emailProvider
  });
});

app.get('/status', (req, res) => {
  res.json({
    email_service: 'Invoice Email System',
    current_mode: emailMode,
    current_provider: emailProvider,
    available_providers: ['Brevo API', 'Gmail SMTP', 'Console Logger'],
    configuration: {
      brevo: {
        api_key: BREVO_API_KEY ? '✓ Set' : '✗ Not set',
        instruction: 'Get free API key at https://brevo.com'
      },
      gmail: {
        user: GMAIL_USER,
        password: '✓ Configured',
        instruction: 'Using Gmail SMTP with App Password'
      }
    }
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n📧 ============================================`);
  console.log(`📧 Email Service Running on Port ${PORT}`);
  console.log(`📧 Mode: ${emailMode}`);
  console.log(`📧 Provider: ${emailProvider}`);
  console.log(`📧 ============================================`);
  
  if (emailMode === 'PRODUCTION') {
    console.log(`\n✅ PRODUCTION MODE ACTIVE`);
    console.log(`   Using: ${emailProvider}`);
  } else {
    console.log(`\n🧪 TEST MODE ACTIVE`);
    console.log(`   Emails will be logged to console`);
    console.log(`\nℹ️  To enable real email sending:`);
    console.log(`   1. Option A: Use Brevo (Recommended)`);
    console.log(`      - Sign up free at https://brevo.com`);
    console.log(`      - Get your API key`);
    console.log(`      - Set: BREVO_API_KEY=<your_api_key>`);
    console.log(`      - Set: EMAIL_MODE=PRODUCTION`);
    console.log(`   2. Option B: Use Gmail`);
    console.log(`      - Enable 2-Factor Authentication on Gmail`);
    console.log(`      - Create App Password at https://myaccount.google.com/apppasswords`);
    console.log(`      - Set: GMAIL_PASS=<your_16_char_password>`);
    console.log(`      - Set: EMAIL_MODE=PRODUCTION`);
    console.log(`   3. Restart this service\n`);
  }
});
