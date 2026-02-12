# 📊 Invoice Management System - Complete Backend Setup

## ✅ What Has Been Created

### 1. **Spring Boot Backend** (`backend/` folder)

- REST API with 8+ endpoints
- MongoDB integration for data persistence
- Email service with Gmail SMTP
- PDF generation with iText
- Comprehensive error handling
- CORS configuration for frontend

### 2. **Frontend API Integration** (`services/apiService.ts`)

- Ready-to-use API client functions
- Automatic error handling
- Type-safe TypeScript interfaces
- Support for all backend operations

### 3. **Complete Documentation**

- `QUICKSTART.md` - Get running in 5 minutes
- `INTEGRATION_GUIDE.md` - Full integration details
- `backend/README.md` - Backend documentation
- `backend/SETUP.md` - Setup instructions

---

## 🚀 To Get Started (3 Simple Steps)

### Step 1: Start MongoDB

```powershell
mongod
```

### Step 2: Start Backend

```powershell
cd backend
mvn spring-boot:run
```

### Step 3: Start Frontend

```powershell
npm run dev
```

That's it! Open http://localhost:3002

---

## 📁 Backend Project Structure

```
backend/
├── pom.xml                          # Maven dependencies
├── SETUP.md                         # Setup guide
├── README.md                        # API documentation
└── src/main/
    ├── java/com/invoiceapp/
    │   ├── InvoiceManagementApplication.java    # Main entry point
    │   ├── controller/
    │   │   └── InvoiceController.java          # REST endpoints
    │   ├── service/
    │   │   ├── InvoiceService.java             # Business logic
    │   │   ├── PdfService.java                 # PDF generation
    │   │   └── EmailService.java               # Email sending
    │   ├── entity/
    │   │   ├── Invoice.java                    # Invoice entity
    │   │   └── ServiceItem.java                # Service item
    │   ├── dto/
    │   │   ├── InvoiceDTO.java                 # Data transfer object
    │   │   ├── EmailRequest.java               # Email request DTO
    │   │   └── ApiResponse.java                # Standard response format
    │   └── repository/
    │       └── InvoiceRepository.java          # MongoDB queries
    └── resources/
        └── application.properties              # Configuration
```

---

## 🔑 Key Features

### ✅ Invoice Management

- **Create**: Save new invoices to MongoDB
- **Read**: Fetch all invoices or specific ones
- **Update**: Modify existing invoices
- **Delete**: Remove invoices from database

### ✅ PDF Generation

- Professional invoice PDFs
- Server-side generation using iText
- Automatic formatting
- Download functionality

### ✅ Email Notifications

- Send invoices to employees
- Automatic PDF attachment
- HTML formatted emails
- Gmail SMTP integration

### ✅ Data Persistence

- MongoDB database
- Automatic timestamps
- Audit trail (createdAt, updatedAt)
- Employee tracking

---

## 🔗 API Endpoints

**Base URL:** `http://localhost:8080/api/invoices`

| Method | Endpoint           | Description        |
| ------ | ------------------ | ------------------ |
| POST   | `/`                | Create invoice     |
| GET    | `/`                | Get all invoices   |
| GET    | `/{id}`            | Get invoice by ID  |
| PUT    | `/{id}`            | Update invoice     |
| DELETE | `/{id}`            | Delete invoice     |
| GET    | `/{id}/download`   | Download PDF       |
| POST   | `/{id}/send-email` | Send email         |
| GET    | `/employee/{id}`   | Get by employee ID |

---

## 🔧 Technologies Used

### Backend

- **Framework**: Spring Boot 3.2.0
- **Language**: Java 17
- **Database**: MongoDB
- **PDF**: iText 7
- **Email**: JavaMail + Freemarker
- **Build**: Maven
- **Validation**: Jakarta Validation

### Frontend Integration

- **HTTP Client**: Fetch API
- **TypeScript**: Type safety
- **Async/Await**: Modern async handling
- **Error Handling**: Comprehensive error management

---

## ⚙️ Configuration

### Backend (`application.properties`)

```properties
server.port=8080
spring.data.mongodb.uri=mongodb://localhost:27017/invoice_db
spring.mail.host=smtp.gmail.com
spring.mail.username=${MAIL_USERNAME}
spring.mail.password=${MAIL_PASSWORD}
```

### Frontend (`.env`)

```
REACT_APP_API_URL=http://localhost:8080/api/invoices
```

---

## 📧 Email Configuration (Optional)

To enable email feature:

1. **Get Gmail App Password:**

   - Go to myaccount.google.com
   - Security → 2-Step Verification
   - App passwords → Generate

2. **Set Environment Variables (PowerShell):**

```powershell
$env:MAIL_USERNAME="your-email@gmail.com"
$env:MAIL_PASSWORD="your-app-password"
```

3. **Start Backend:**

```powershell
mvn spring-boot:run
```

---

## 🗄️ Database Schema

### Invoices Collection

```json
{
  "_id": ObjectId,
  "invoiceNumber": "INV#OF-123456",
  "date": "2024-12-04",
  "employeeName": "John Doe",
  "employeeId": "EMP001",
  "employeeEmail": "john@example.com",
  "employeeAddress": "123 Main St",
  "employeeMobile": "9876543210",
  "services": [
    {
      "id": "svc-1",
      "description": "Web Development",
      "hours": 40,
      "rate": 500
    }
  ],
  "taxRate": 10,
  "createdAt": ISODate("2024-12-04T10:00:00Z"),
  "updatedAt": ISODate("2024-12-04T10:00:00Z")
}
```

---

## 🧪 Testing

### Test Backend is Running

```bash
curl http://localhost:8080/api/invoices
# Should return: []
```

### Create Invoice

```bash
curl -X POST http://localhost:8080/api/invoices \
  -H "Content-Type: application/json" \
  -d '{
    "invoiceNumber": "INV#001",
    "date": "2024-12-04",
    "employeeName": "John",
    "employeeId": "EMP001",
    "employeeEmail": "john@example.com",
    "employeeAddress": "123 St",
    "employeeMobile": "9876543210",
    "services": [{
      "id": "1",
      "description": "Work",
      "hours": 10,
      "rate": 100
    }],
    "taxRate": 10
  }'
```

---

## 📊 Frontend Integration

The frontend (`apiService.ts`) provides these functions:

```typescript
createInvoice(invoice); // Create new
updateInvoice(id, invoice); // Update existing
getAllInvoices(); // Fetch all
getInvoiceById(id); // Fetch one
deleteInvoice(id); // Delete
downloadInvoicePdf(id, name); // Download PDF
sendInvoiceEmail(id); // Send email
```

All functions handle errors automatically and update the UI.

---

## 🚨 Troubleshooting

### Backend Won't Start

```
1. Check Java: java -version (should be 17+)
2. Check MongoDB: mongod is running
3. Check port: netstat -ano | findstr :8080
4. Clear Maven cache: mvn clean
```

### MongoDB Not Found

```
1. Install: https://www.mongodb.com/try/download/community
2. Start: mongod
3. Verify: mongo --eval "db.adminCommand('ping')"
```

### Email Not Working

```
1. Verify credentials set before starting backend
2. Use 16-char App Password (not Gmail password)
3. Check SMTP enabled in Gmail settings
4. Verify port 587 not blocked by firewall
```

### CORS Errors

```
Backend is configured for:
- http://localhost:3002 (default)
- http://localhost:3000 (alternative)

If different port, edit:
backend/src/main/java/.../InvoiceManagementApplication.java
```

---

## 📈 Next Steps

1. **Start the three services** (MongoDB, Backend, Frontend)
2. **Test all features** in the UI
3. **Configure email** if needed
4. **Customize** as per requirements
5. **Deploy** to production

---

## 📚 Documentation Files

1. **QUICKSTART.md** - 5-minute setup guide
2. **INTEGRATION_GUIDE.md** - Complete integration details
3. **backend/README.md** - API documentation
4. **backend/SETUP.md** - Detailed backend setup

---

## ✨ Summary

You now have a **production-ready** Invoice Management System with:

- ✅ Modern React frontend with beautiful UI
- ✅ Powerful Spring Boot backend with REST API
- ✅ MongoDB database for persistence
- ✅ Email service for notifications
- ✅ PDF generation for invoices
- ✅ Complete documentation
- ✅ Error handling and validation
- ✅ Type-safe code (TypeScript + Java)

**Ready to use. Ready to customize. Ready for production.**

Start with `QUICKSTART.md` to get up and running in minutes! 🚀
