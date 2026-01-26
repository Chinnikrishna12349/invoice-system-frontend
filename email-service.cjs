const nodemailer = require('nodemailer');
const express = require('express');
const cors = require('cors');
const app = express();

app.use(express.json({ limit: '50mb' }));
app.use(cors());

// Gmail SMTP configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'chinnikrishnamaddana@gmail.com',
    pass: 'fzpxcqotIkcuosqb'
  },
  secure: false, // Use TLS
  port: 587,
  tls: {
    rejectUnauthorized: false
  }
});

// Test connection
transporter.verify(function(error, success) {
  if (error) {
    console.log('Email service error:', error);
  } else {
    console.log('✓ Email service is ready to send messages');
  }
});

// Email endpoint
app.post('/send-email', async (req, res) => {
  try {
    const { to, subject, html, attachments } = req.body;

    if (!to || !subject || !html) {
      return res.status(400).json({ error: 'Missing required fields: to, subject, html' });
    }

    const mailOptions = {
      from: 'chinnikrishnamaddana@gmail.com',
      to: to,
      subject: subject,
      html: html
    };

    // Add attachments if provided
    if (attachments && Array.isArray(attachments)) {
      mailOptions.attachments = attachments;
    }

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    
    res.json({
      success: true,
      message: 'Email sent successfully',
      messageId: info.messageId
    });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'Email service is running' });
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Email service running on port ${PORT}`);
});
