# 📊 Invoice Management System - Full Stack Application

> A complete, production-ready Invoice Management System built with React, Spring Boot, and MongoDB. Features comprehensive invoice creation, PDF generation, email functionality, and MongoDB data persistence.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Status](https://img.shields.io/badge/status-Production%20Ready-brightgreen.svg)

---

## 📋 Table of Contents

- [Project Overview](#-project-overview)
- [Key Features](#-key-features)
- [Technology Stack](#-technology-stack)
- [Functional Requirements](#-functional-requirements)
- [Non-Functional Requirements](#-non-functional-requirements)
- [Architecture](#-architecture)
- [Installation & Setup](#-installation--setup)
- [Email Configuration](#-email-configuration)
- [API Documentation](#-api-documentation)
- [Usage Guide](#-usage-guide)
- [Deployment](#-deployment)
- [Troubleshooting](#-troubleshooting)

---

## 🎯 Project Overview

The Invoice Management System is a comprehensive full-stack application designed to streamline invoice creation, management, and distribution. It provides a modern, responsive web interface for creating professional invoices, generating PDF documents, sending invoices via email, and maintaining a persistent database of all invoice records.

### Core Capabilities

- **Invoice Management**: Create, read, update, and delete invoices with a user-friendly interface
- **PDF Generation**: Server-side PDF generation with professional formatting
- **Email Service**: Send invoices directly to employees with PDF attachments
- **Data Persistence**: MongoDB integration for reliable data storage
- **Responsive UI**: Modern, mobile-friendly interface built with React and Tailwind CSS

---

## ✨ Key Features

### 💼 Invoice Management

- ✅ **Create Professional Invoices**
  - Dynamic invoice form with employee details
  - Multiple service items per invoice
  - Automatic invoice number generation
  - Real-time tax calculations
  - Subtotal, tax, and grand total computation

- ✅ **Edit Existing Invoices**
  - One-click invoice selection for editing
  - Pre-populated form with existing data
  - Update any invoice field
  - Automatic timestamp updates

- ✅ **Delete Invoices**
  - Confirmation modal to prevent accidental deletions
  - Complete removal from database
  - Immediate UI updates

- ✅ **View All Invoices**
  - List view with sorting by date
  - Invoice count display
  - Employee information display
  - Total amount per invoice

- ✅ **Employee Management**
  - Employee ID, name, email, address, and mobile
  - Employee-based invoice filtering
  - Unique employee identification

### 📄 PDF Generation

- ✅ **Server-Side PDF Generation**
  - Professional invoice formatting
  - iText 7 library integration
  - Automatic layout and styling

- ✅ **PDF Content Includes**
  - Invoice header and number
  - Invoice date
  - Complete employee information
  - Service/work details table
  - Hours, rates, and amounts
  - Subtotal, tax, and grand total
  - Professional typography and formatting

- ✅ **One-Click Download**
  - Download PDF directly from invoice
  - Automatic filename with invoice number
  - Browser-compatible PDF rendering

### 📧 Email Functionality

#### Email Service Architecture

The system includes a comprehensive email service with multiple provider support:

**Three-Tier Email Provider System:**
1. **Primary**: Brevo API (REST-based, recommended)
2. **Secondary**: Gmail SMTP (via JavaMail)
3. **Tertiary**: Console logging (for testing)

#### Email Features

- ✅ **Send Invoice via Email**
  - Automatic PDF attachment generation
  - HTML-formatted email body
  - Professional email templates
  - Employee email pre-population

- ✅ **Email Content**
  - Personalized greeting with employee name
  - Invoice summary table (Invoice #, Date, Grand Total)
  - Professional HTML formatting
  - PDF invoice attachment
  - Customizable sender name

- ✅ **Email Providers**

  **Option 1: Brevo (Recommended)**
  - Free tier available
  - REST API integration
  - High deliverability rate
  - Simple API key authentication
  - No SMTP configuration needed

  **Option 2: Gmail SMTP**
  - Standard Gmail account support
  - App password authentication
  - SMTP/STARTTLS protocol
  - Secure email delivery

  **Option 3: Test Mode**
  - Console logging for development
  - No external service required
  - Perfect for testing

- ✅ **Email Service Endpoints**
  - `POST /api/invoices/{id}/send-email` - Send invoice email
  - Backend email service with JavaMail integration
  - Node.js email microservice (optional, port 5000)

### 💾 Data Persistence

- ✅ **MongoDB Integration**
  - NoSQL document database
  - Automatic ID generation
  - Collection: `invoices`
  - Database: `Invoicesystem`

- ✅ **Data Features**
  - Persistent invoice storage
  - Automatic timestamps (createdAt, updatedAt)
  - Employee data tracking
  - Audit trail capability

- ✅ **Data Operations**
  - Create: Save new invoices
  - Read: Retrieve all or single invoices
  - Update: Modify existing invoices
  - Delete: Remove invoices
  - Query: Filter by employee ID or email

### 🎨 User Interface

- ✅ **Modern Design**
  - Tailwind CSS styling
  - Responsive layout (desktop, tablet, mobile)
  - Smooth animations and transitions
  - Professional color scheme

- ✅ **User Experience**
  - Intuitive form layout
  - Real-time validation
  - Loading indicators
  - Error handling and messages
  - Success notifications
  - Empty state handling

- ✅ **Components**
  - Invoice form with dynamic service items
  - Invoice list with sorting
  - Invoice item cards
  - Modal dialogs
  - Action buttons (Edit, Delete, Download)

---

## 🏗️ Technology Stack

### Frontend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 19.2.0 | UI framework for building user interfaces |
| **TypeScript** | 5.8.2 | Type-safe JavaScript for better code quality |
| **Vite** | 6.2.0 | Fast build tool and development server |
| **Tailwind CSS** | 4.1.17 | Utility-first CSS framework for styling |
| **React DOM** | 19.2.0 | React rendering library |
| **jsPDF** | 3.0.4 | Client-side PDF generation (alternative) |
| **html2canvas** | 1.4.1 | Convert HTML to canvas for PDF |
| **Node.js** | 14+ | JavaScript runtime environment |

### Backend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **Java** | 17 | Programming language |
| **Spring Boot** | 3.2.0 | Enterprise Java framework |
| **Spring Web** | 3.2.0 | RESTful web services |
| **Spring Data MongoDB** | 3.2.0 | MongoDB integration |
| **Spring Mail** | 3.2.0 | Email sending capabilities |
| **Spring Validation** | 3.2.0 | Input validation framework |
| **Maven** | 3.6+ | Build automation and dependency management |
| **iText 7** | 7.2.5 | Server-side PDF generation |
| **Jackson** | - | JSON processing |
| **Lombok** | 1.18.30 | Reduce boilerplate code |
| **Freemarker** | - | Email template engine |

### Database Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **MongoDB** | 4.4+ | NoSQL document database |
| **MongoDB Driver** | - | Java MongoDB driver |
| **MongoDB Atlas** | - | Cloud database option (optional) |

### Email Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **Brevo SDK** | 1.0.0 | Email API integration (primary) |
| **JavaMail (Spring Mail)** | - | SMTP email sending (secondary) |
| **Nodemailer** | 7.0.11 | Node.js email service (optional) |
| **SendGrid** | 8.1.6 | Alternative email provider (optional) |
| **Express.js** | 5.2.1 | Node.js web framework for email microservice |

### Development Tools

| Technology | Purpose |
|------------|---------|
| **Git** | Version control |
| **Postman/curl** | API testing |
| **IDE Support** | IntelliJ IDEA, VS Code, Eclipse |
| **Spring Boot DevTools** | Hot reload and development utilities |

---

## 📋 Functional Requirements

### FR1: Invoice Creation
- **FR1.1**: System shall allow users to create new invoices
- **FR1.2**: System shall auto-generate unique invoice numbers
- **FR1.3**: System shall allow multiple service items per invoice
- **FR1.4**: System shall calculate subtotal, tax, and grand total automatically
- **FR1.5**: System shall validate all required fields before submission
- **FR1.6**: System shall assign unique MongoDB-generated IDs to invoices

### FR2: Invoice Management
- **FR2.1**: System shall display all invoices in a list view
- **FR2.2**: System shall allow editing of existing invoices
- **FR2.3**: System shall allow deletion of invoices with confirmation
- **FR2.4**: System shall sort invoices by date (newest first)
- **FR2.5**: System shall show invoice count in the UI
- **FR2.6**: System shall filter invoices by employee ID

### FR3: Employee Management
- **FR3.1**: System shall capture employee details (name, ID, email, address, mobile)
- **FR3.2**: System shall validate email format
- **FR3.3**: System shall require unique employee ID per invoice
- **FR3.4**: System shall allow searching invoices by employee email

### FR4: PDF Generation
- **FR4.1**: System shall generate PDF documents for invoices
- **FR4.2**: System shall include all invoice details in PDF
- **FR4.3**: System shall format PDF professionally
- **FR4.4**: System shall allow downloading PDF files
- **FR4.5**: System shall name PDF files with invoice number

### FR5: Email Functionality
- **FR5.1**: System shall send invoices via email
- **FR5.2**: System shall attach PDF to email
- **FR5.3**: System shall format email body in HTML
- **FR5.4**: System shall support multiple email providers (Brevo, Gmail)
- **FR5.5**: System shall include invoice summary in email
- **FR5.6**: System shall personalize email with employee name
- **FR5.7**: System shall handle email delivery failures gracefully

### FR6: Data Persistence
- **FR6.1**: System shall store invoices in MongoDB
- **FR6.2**: System shall persist all invoice data
- **FR6.3**: System shall maintain timestamps (createdAt, updatedAt)
- **FR6.4**: System shall retrieve invoices from database
- **FR6.5**: System shall update invoices in database
- **FR6.6**: System shall delete invoices from database

### FR7: User Interface
- **FR7.1**: System shall provide responsive web interface
- **FR7.2**: System shall display loading states
- **FR7.3**: System shall show error messages
- **FR7.4**: System shall provide form validation feedback
- **FR7.5**: System shall support desktop and mobile devices

---

## 🔒 Non-Functional Requirements

### NFR1: Performance
- **NFR1.1**: System shall load invoice list in less than 2 seconds
- **NFR1.2**: System shall generate PDF in less than 3 seconds
- **NFR1.3**: System shall respond to API requests in less than 500ms
- **NFR1.4**: System shall support at least 1000 concurrent invoices

### NFR2: Reliability
- **NFR2.1**: System shall have 99% uptime
- **NFR2.2**: System shall handle database connection failures gracefully
- **NFR2.3**: System shall provide automatic retry for failed email sends
- **NFR2.4**: System shall implement transaction rollback on errors

### NFR3: Security
- **NFR3.1**: System shall validate all user inputs
- **NFR3.2**: System shall use environment variables for sensitive data
- **NFR3.3**: System shall implement CORS policies
- **NFR3.4**: System shall not expose database credentials
- **NFR3.5**: System shall sanitize email inputs

### NFR4: Scalability
- **NFR4.1**: System shall support horizontal scaling
- **NFR4.2**: System shall handle increasing database size
- **NFR4.3**: System shall support multiple email providers
- **NFR4.4**: System shall be deployable on cloud platforms

### NFR5: Usability
- **NFR5.1**: System shall have intuitive user interface
- **NFR5.2**: System shall provide clear error messages
- **NFR5.3**: System shall support keyboard navigation
- **NFR5.4**: System shall be accessible (WCAG 2.1 Level AA)

### NFR6: Maintainability
- **NFR6.1**: System shall follow coding best practices
- **NFR6.2**: System shall have comprehensive documentation
- **NFR6.3**: System shall use version control
- **NFR6.4**: System shall have modular architecture

### NFR7: Compatibility
- **NFR7.1**: System shall support modern browsers (Chrome, Firefox, Edge, Safari)
- **NFR7.2**: System shall support Java 17+
- **NFR7.3**: System shall support MongoDB 4.4+
- **NFR7.4**: System shall support Node.js 14+

### NFR8: Portability
- **NFR8.1**: System shall run on Windows, Linux, and macOS
- **NFR8.2**: System shall be containerizable (Docker)
- **NFR8.3**: System shall support cloud deployment

---

## 🏛️ Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │          React Frontend (Port 3000)                 │   │
│  │  - Invoice Form Component                           │   │
│  │  - Invoice List Component                           │   │
│  │  - PDF Generation (Client-side)                     │   │
│  │  - API Service Layer                                │   │
│  └─────────────────────────────────────────────────────┘   │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTP/REST
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                      APPLICATION LAYER                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │     Spring Boot Backend (Port 8080)                 │   │
│  │  - REST API Controller                              │   │
│  │  - Business Logic Service                           │   │
│  │  - Data Access Layer (Repository)                   │   │
│  │  - PDF Service (iText 7)                            │   │
│  │  - Email Service (JavaMail/Brevo)                   │   │
│  └─────────────────────────────────────────────────────┘   │
└───────────────────────────┬─────────────────────────────────┘
                            │
        ┌───────────────────┴───────────────────┐
        │                                       │
┌───────▼────────┐                    ┌────────▼────────┐
│  DATA LAYER    │                    │  EXTERNAL API   │
│                │                    │                 │
│  MongoDB       │                    │  Brevo Email    │
│  (Port 27017)  │                    │  Gmail SMTP     │
│                │                    │                 │
│  - invoices    │                    │                 │
│    collection  │                    │                 │
└────────────────┘                    └─────────────────┘
```

### Component Architecture

**Frontend Components:**
- `App.tsx` - Main application component
- `InvoiceForm.tsx` - Invoice creation/editing form
- `InvoiceList.tsx` - Invoice listing component
- `InvoiceItem.tsx` - Individual invoice card
- `Modal.tsx` - Confirmation dialogs
- `apiService.ts` - API communication service
- `pdfService.ts` - Client-side PDF generation

**Backend Components:**
- `InvoiceController.java` - REST API endpoints
- `InvoiceService.java` - Business logic
- `InvoiceRepository.java` - Data access interface
- `Invoice.java` - Entity model
- `InvoiceDTO.java` - Data transfer object
- `PdfService.java` - PDF generation service
- `EmailService.java` - Email sending service

---

## 🚀 Installation & Setup

### Prerequisites

- **Node.js** 14 or higher
- **Java** 17 or higher
- **Maven** 3.6 or higher
- **MongoDB** 4.4 or higher
- **Git** (optional, for version control)

### Step 1: Clone Repository

```bash
git clone <repository-url>
cd react-invoice-generator
```

### Step 2: Install Frontend Dependencies

```bash
npm install
```

### Step 3: Configure Backend

Edit `backend/src/main/resources/application.properties`:

```properties
# MongoDB Configuration
spring.data.mongodb.uri=mongodb://localhost:27017/Invoicesystem

# Server Configuration
server.port=8080

# Email Configuration (see Email Configuration section)
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=your-email@gmail.com
spring.mail.password=your-app-password
```

### Step 4: Start MongoDB

**Windows:**
```powershell
mongod
```

**Linux/macOS:**
```bash
mongod --dbpath /path/to/data
```

**Or use MongoDB service:**
```bash
# Linux
sudo systemctl start mongod

# macOS
brew services start mongodb-community
```

### Step 5: Start Backend Server

```bash
cd backend
mvn clean install
mvn spring-boot:run
```

Backend will start on: `http://localhost:8080`

### Step 6: Start Frontend Server

```bash
npm run dev
```

Frontend will start on: `http://localhost:3000`

### Step 7: Access Application

Open your browser and navigate to: `http://localhost:3000`

---

## 📧 Email Configuration

### Option 1: Brevo (Recommended)

**Step 1: Create Brevo Account**
1. Visit: https://brevo.com
2. Sign up for a free account
3. Verify your email address

**Step 2: Get API Key**
1. Login to Brevo dashboard
2. Navigate to: Settings → API Keys
3. Click "Create API Key"
4. Select "v3 API" type
5. Copy the API key (starts with `sk_`)

**Step 3: Configure Backend**
Edit `backend/src/main/resources/application.properties`:
```properties
# Brevo Configuration
spring.mail.host=smtp-relay.brevo.com
spring.mail.port=587
spring.mail.username=your-brevo-username
spring.mail.password=your-brevo-smtp-key
```

### Option 2: Gmail SMTP

**Step 1: Enable 2-Step Verification**
1. Go to: https://myaccount.google.com/security
2. Enable "2-Step Verification"

**Step 2: Generate App Password**
1. Go to: https://myaccount.google.com/apppasswords
2. Select "Mail" and "Windows Computer" (or your device)
3. Click "Generate"
4. Copy the 16-character password

**Step 3: Configure Backend**
Edit `backend/src/main/resources/application.properties`:
```properties
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=your-email@gmail.com
spring.mail.password=your-16-char-app-password
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
```

### Option 3: Test Mode (Development)

For development, emails are logged to console:
```properties
# No email configuration needed
# Emails will be logged to backend console
```

### Testing Email Functionality

1. Create an invoice with employee email
2. Click "Send Email" button on the invoice
3. Check email inbox (or console logs in test mode)

---

## 📡 API Documentation

### Base URL
```
http://localhost:8080/api/invoices
```

### Endpoints

#### 1. Create Invoice
```http
POST /api/invoices
Content-Type: application/json

{
  "invoiceNumber": "INV#OF-123456",
  "date": "2024-12-04",
  "employeeName": "John Doe",
  "employeeId": "EMP001",
  "employeeEmail": "john@example.com",
  "employeeAddress": "123 Main St, City",
  "employeeMobile": "9876543210",
  "services": [
    {
      "id": "svc-1",
      "description": "Web Development",
      "hours": 40,
      "rate": 500.00
    }
  ],
  "taxRate": 10.0
}
```

**Response:**
```json
{
  "success": true,
  "message": "Invoice created successfully",
  "data": {
    "id": "generated-id",
    "invoiceNumber": "INV#OF-123456",
    ...
  }
}
```

#### 2. Get All Invoices
```http
GET /api/invoices
```

**Response:**
```json
{
  "success": true,
  "message": "Invoices retrieved successfully",
  "data": [
    {
      "id": "invoice-id-1",
      "invoiceNumber": "INV#OF-123456",
      ...
    },
    ...
  ]
}
```

#### 3. Get Invoice by ID
```http
GET /api/invoices/{id}
```

#### 4. Update Invoice
```http
PUT /api/invoices/{id}
Content-Type: application/json

{
  "invoiceNumber": "INV#OF-123456",
  ...
}
```

#### 5. Delete Invoice
```http
DELETE /api/invoices/{id}
```

#### 6. Download PDF
```http
GET /api/invoices/{id}/download?invoiceNumber=INV#OF-123456
```

#### 7. Send Email
```http
POST /api/invoices/{id}/send-email
```

#### 8. Get Invoices by Employee
```http
GET /api/invoices/employee/{employeeId}
```

---

## 📖 Usage Guide

### Creating an Invoice

1. **Fill Employee Details**
   - Enter employee name, ID, email, address, and mobile
   - Invoice number is auto-generated

2. **Add Service Items**
   - Click "Add Service" to add work items
   - Enter description, hours, and rate
   - Amount is calculated automatically

3. **Set Tax Rate**
   - Default tax rate is 10%
   - Adjust as needed

4. **Review Totals**
   - Subtotal: Sum of all service items
   - Tax: Subtotal × Tax Rate
   - Grand Total: Subtotal + Tax

5. **Save Invoice**
   - Click "Save Invoice" button
   - Invoice is saved to MongoDB
   - Appears in invoice list

### Editing an Invoice

1. Click on any invoice in the list
2. Form populates with invoice data
3. Make desired changes
4. Click "Update Invoice"
5. Changes are saved to database

### Downloading PDF

1. Find the invoice in the list
2. Click "Download PDF" button
3. PDF file downloads automatically
4. File is named: `Invoice_{invoiceNumber}.pdf`

### Sending Email

1. Ensure email is configured (see Email Configuration)
2. Find the invoice in the list
3. Click "Send Email" button
4. System generates PDF and sends email
5. Email includes invoice details and PDF attachment

### Deleting an Invoice

1. Find the invoice in the list
2. Click "Delete" button
3. Confirm deletion in modal
4. Invoice is removed from database

---

## 🚢 Deployment

### Backend Deployment

**Build JAR:**
```bash
cd backend
mvn clean package -DskipTests
```

**Run JAR:**
```bash
java -jar target/invoice-backend-1.0.0.jar
```

**Docker Deployment:**
```dockerfile
FROM openjdk:17-jdk-slim
WORKDIR /app
COPY target/invoice-backend-1.0.0.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

### Frontend Deployment

**Build Production:**
```bash
npm run build
```

**Deploy `dist/` folder to:**
- Netlify
- Vercel
- AWS S3 + CloudFront
- Any static hosting service

### Environment Variables

**Frontend (.env):**
```
VITE_API_URL=http://your-backend-url/api/invoices
```

**Backend (application.properties):**
```properties
spring.data.mongodb.uri=mongodb+srv://user:pass@cluster.mongodb.net/Invoicesystem
spring.mail.host=smtp-relay.brevo.com
spring.mail.username=your-username
spring.mail.password=your-password
```

---

## 🆘 Troubleshooting

### Backend Won't Start

**Check MongoDB:**
```bash
mongod --version
# Ensure MongoDB is running
```

**Check Port 8080:**
```bash
# Windows
netstat -ano | findstr :8080

# Linux/macOS
lsof -i :8080
```

**Check Java Version:**
```bash
java -version  # Should be 17+
```

### Frontend Can't Connect to Backend

**Check Backend URL:**
```javascript
// services/apiService.ts
const API_BASE_URL = 'http://localhost:8080/api/invoices';
```

**Check CORS:**
- Verify backend CORS configuration includes frontend URL
- Check browser console for CORS errors

### Email Not Sending

**Verify Configuration:**
1. Check `application.properties` email settings
2. Verify credentials are correct
3. For Gmail: Ensure app password is used (not regular password)
4. Check firewall/antivirus blocking SMTP port 587

**Test Email Service:**
```bash
# Check backend logs for email errors
# Verify email provider credentials
```

### MongoDB Connection Issues

**Check Connection String:**
```properties
spring.data.mongodb.uri=mongodb://localhost:27017/Invoicesystem
```

**Verify MongoDB is Running:**
```bash
mongosh
# Or
mongo --eval "db.adminCommand('ping')"
```

### PDF Generation Issues

**Check iText Dependency:**
```xml
<!-- backend/pom.xml -->
<dependency>
    <groupId>com.itextpdf</groupId>
    <artifactId>itext7-core</artifactId>
    <version>7.2.5</version>
</dependency>
```

**Check Logs:**
- Review backend console for PDF generation errors
- Verify invoice data is complete

---

## 📝 License

This project is licensed under the MIT License - see LICENSE file for details.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📞 Support

For issues, questions, or contributions, please open an issue on the repository.

---

## ✅ Project Status

**Complete & Production Ready**

- ✅ Frontend: Fully functional with professional UI
- ✅ Backend: Complete REST API with all features
- ✅ Database: MongoDB integration working
- ✅ Email: Multi-provider email service ready
- ✅ PDF: Server-side generation ready
- ✅ Documentation: Comprehensive

**Ready for immediate use and deployment.**

---

**Built with ❤️ for efficient invoice management**

*Last Updated: December 2024*
