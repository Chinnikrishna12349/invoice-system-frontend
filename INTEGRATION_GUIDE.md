# Full Stack Invoice Management System - Integration Guide

## Project Structure

```
react-invoice-generator/
├── src/
│   ├── index.tsx          # Frontend entry point
│   ├── App.tsx            # Main React app
│   ├── components/        # React components
│   ├── services/          # Frontend services
│   │   ├── pdfService.ts  # Local PDF generation
│   │   └── apiService.ts  # Backend API integration
│   └── types.ts           # TypeScript types
├── backend/               # Spring Boot backend
│   ├── src/
│   │   ├── main/java/com/invoiceapp/
│   │   │   ├── controller/
│   │   │   ├── service/
│   │   │   ├── entity/
│   │   │   ├── dto/
│   │   │   ├── repository/
│   │   │   └── InvoiceManagementApplication.java
│   │   └── resources/
│   │       └── application.properties
│   ├── pom.xml
│   ├── README.md
│   └── SETUP.md
├── .env                   # Environment variables
├── package.json           # Frontend dependencies
└── vite.config.ts         # Vite configuration
```

## Getting Started

### Part 1: Start the Backend

**Prerequisites:**

- Java 17+
- Maven 3.6+
- MongoDB 4.4+
- Gmail App Password (optional, for email feature)

**Steps:**

```bash
# 1. Install MongoDB
# Download from https://www.mongodb.com/try/download/community
# Start MongoDB service

# 2. Navigate to backend folder
cd backend

# 3. (Optional) Set Gmail credentials for email feature
# Windows PowerShell:
$env:MAIL_USERNAME="your-email@gmail.com"
$env:MAIL_PASSWORD="your-16-char-app-password"

# 4. Build and run
mvn clean install
mvn spring-boot:run

# Backend will start at http://localhost:8080
```

### Part 2: Update Frontend Configuration

```bash
# 1. Make sure .env file has correct backend URL
# File: .env
REACT_APP_API_URL=http://localhost:8080/api/invoices

# 2. Install frontend dependencies
npm install

# 3. Start frontend
npm run dev

# Frontend will start at http://localhost:3002
```

### Part 3: Connect Frontend to Backend

The frontend is already configured to use the backend API through `services/apiService.ts`.

**Key Integration Points:**

1. **Create Invoice** - Uses backend API

```typescript
// In App.tsx handleSaveInvoice()
const invoice = await createInvoice(invoiceData);
```

2. **Update Invoice** - Uses backend API

```typescript
// In App.tsx handleSaveInvoice()
const invoice = await updateInvoice(id, invoiceData);
```

3. **Delete Invoice** - Uses backend API

```typescript
// In App.tsx confirmDelete()
await deleteInvoice(invoiceToDelete);
```

4. **Download PDF** - Calls backend PDF generation

```typescript
// In App.tsx handleDownload()
await downloadInvoicePdf(invoice.id, invoice.invoiceNumber);
```

5. **Send Email** - Uses backend email service

```typescript
// In App.tsx handleSendEmail()
await sendInvoiceEmail(invoiceId);
```

## API Integration

### Available Functions in apiService.ts

```typescript
// Create invoice
createInvoice(invoice: Invoice): Promise<Invoice>

// Update invoice
updateInvoice(id: string, invoice: Invoice): Promise<Invoice>

// Get all invoices
getAllInvoices(): Promise<Invoice[]>

// Get single invoice
getInvoiceById(id: string): Promise<Invoice>

// Delete invoice
deleteInvoice(id: string): Promise<void>

// Download PDF
downloadInvoicePdf(id: string, invoiceNumber: string): Promise<void>

// Send email
sendInvoiceEmail(id: string): Promise<void>

// Get invoices by employee
getInvoicesByEmployeeId(employeeId: string): Promise<Invoice[]>

// Send custom email
sendCustomEmail(to: string, subject: string, body: string): Promise<void>
```

## Features Enabled by Backend

✅ **Data Persistence**

- All invoices stored in MongoDB
- Survives application restarts
- Employee invoice tracking

✅ **PDF Generation**

- Server-side PDF generation via iText
- Professional invoice formatting
- Consistent output

✅ **Email Notifications**

- Send invoices to employees
- Automatic PDF attachment
- HTML email formatting

✅ **Edit Functionality**

- Update invoice details
- Persisted changes
- Audit trail (createdAt, updatedAt)

✅ **Download PDF**

- Download generated PDFs
- File saved with proper naming

## Data Flow

### Creating an Invoice

```
React Form
   ↓
App.tsx (handleSaveInvoice)
   ↓
apiService.ts (createInvoice)
   ↓
Spring Boot Controller
   ↓
InvoiceService
   ↓
MongoDB (Invoice saved)
   ↓
Response with ID
   ↓
Frontend UI Updated
```

### Sending Email

```
Click Send Email Button
   ↓
App.tsx (handleSendEmail)
   ↓
apiService.ts (sendInvoiceEmail)
   ↓
Spring Boot Controller
   ↓
InvoiceService (fetch invoice)
   ↓
PdfService (generate PDF)
   ↓
EmailService (send email)
   ↓
SMTP Server (Gmail)
   ↓
Employee Email
```

## Configuration

### Frontend (.env)

```
REACT_APP_API_URL=http://localhost:8080/api/invoices
```

### Backend (application.properties)

```properties
server.port=8080
spring.data.mongodb.uri=mongodb://localhost:27017/invoice_db
spring.mail.username=your-email@gmail.com
spring.mail.password=your-app-password
```

## Testing the Integration

### 1. Test Backend is Running

```bash
curl http://localhost:8080/api/invoices
# Should return empty array: []
```

### 2. Create Invoice via UI

- Open http://localhost:3002
- Fill form and click "Save Invoice"
- Check MongoDB to verify data saved

### 3. Test Download PDF

- Click download icon
- PDF should be generated and downloaded

### 4. Test Send Email

- Click email icon
- Check employee email inbox
- Should receive email with PDF attachment

### 5. Test Edit

- Click edit on existing invoice
- Update details
- Click "Update Invoice"
- Verify changes in database

## Troubleshooting

### Backend not responding

```bash
# Check if running
curl http://localhost:8080/api/invoices

# If error, check:
1. Backend is started: mvn spring-boot:run
2. MongoDB is running
3. No port conflicts: netstat -ano | findstr :8080
```

### Email not sending

```
1. Verify Gmail credentials in application.properties
2. Check 2-FA is enabled
3. Use 16-character App Password, not regular password
4. Check firewall doesn't block SMTP 587
```

### CORS errors

```
Backend is configured with CORS for:
- http://localhost:3002
- http://localhost:3000

If frontend is on different port, add to:
backend/src/main/java/com/invoiceapp/InvoiceManagementApplication.java
```

### MongoDB not connecting

```bash
# Start MongoDB manually
mongod

# Verify connection
mongo --eval "db.adminCommand('ping')"
```

## Production Deployment

### Backend

1. Build JAR: `mvn clean package`
2. Deploy to server with Java 17
3. Set environment variables for email
4. Use cloud MongoDB (Atlas)
5. Update CORS origins

### Frontend

1. Build: `npm run build`
2. Deploy to web server
3. Update REACT_APP_API_URL to production backend
4. Configure CORS on backend for production domain

## Next Steps

1. **Configure Email**: Set up Gmail App Password
2. **Test Workflows**: Try creating, editing, deleting invoices
3. **Customize**: Modify email templates, PDF design, UI colors
4. **Scale**: Move to cloud MongoDB, deploy backend
5. **Monitor**: Add logging and error tracking

## Support

For issues:

1. Check logs in both frontend (browser console) and backend
2. Review error messages in response
3. Verify MongoDB and SMTP credentials
4. Check firewall/port conflicts

## Key Files to Modify

### Frontend API Integration

- `services/apiService.ts` - API calls
- `.env` - Backend URL configuration
- `App.tsx` - Integrate API calls in handlers

### Backend Configuration

- `backend/src/main/resources/application.properties` - Server config
- `backend/SETUP.md` - Setup instructions
- `backend/src/main/java/com/invoiceapp/...` - Code customization
