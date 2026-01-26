# System Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER BROWSER                             │
│                   http://localhost:3002                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   REACT FRONTEND (Vite)                         │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              React Components                            │  │
│  │  ├─ App.tsx (Main app)                                  │  │
│  │  ├─ InvoiceForm.tsx (Create/Edit)                       │  │
│  │  ├─ InvoiceList.tsx (Display invoices)                  │  │
│  │  ├─ InvoiceItem.tsx (Individual invoice)                │  │
│  │  └─ Modal.tsx (Dialogs)                                 │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Frontend Services                           │  │
│  │  ├─ apiService.ts  (API calls to backend)               │  │
│  │  └─ pdfService.ts  (Client-side PDF fallback)           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                  │
│            Tailwind CSS      │      TypeScript                  │
│            Modern UI         │      Type Safety                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                 HTTP/REST    │
              ┌───────────────┴───────────────┐
              │                               │
              ▼                               ▼
┌──────────────────────────┐   ┌──────────────────────────┐
│  JSON over HTTPS/HTTP    │   │  (Future expansion)      │
│  CORS Enabled            │   │  ├─ Third-party APIs     │
│  Request/Response        │   │  └─ Webhooks             │
└──────────────────────────┘   └──────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 SPRING BOOT BACKEND                             │
│              http://localhost:8080/api/invoices                 │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │            InvoiceController (REST API)                  │  │
│  │  ├─ POST   /  → createInvoice()                         │  │
│  │  ├─ GET    /  → getAllInvoices()                        │  │
│  │  ├─ GET    /{id}  → getInvoiceById()                    │  │
│  │  ├─ PUT    /{id}  → updateInvoice()                     │  │
│  │  ├─ DELETE /{id}  → deleteInvoice()                     │  │
│  │  ├─ GET    /{id}/download  → downloadPdf()             │  │
│  │  └─ POST   /{id}/send-email  → sendEmail()             │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │            InvoiceService (Business Logic)              │  │
│  │  ├─ createInvoice()                                     │  │
│  │  ├─ updateInvoice()                                     │  │
│  │  ├─ deleteInvoice()                                     │  │
│  │  ├─ getInvoiceById()                                    │  │
│  │  └─ getAllInvoices()                                    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                  │
│        ┌───────────────────┬─┼─────────────────┬───────┐        │
│        │                   │                   │       │        │
│        ▼                   ▼                   ▼       ▼        │
│  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐      │
│  │ PdfService    │ │ EmailService   │ │ InvoiceRepo    │      │
│  │               │ │                │ │ (MongoRepo)    │      │
│  │ • Generate    │ │ • Send Email   │ │                │      │
│  │   PDF with    │ │ • HTML Format  │ │ • find()       │      │
│  │   iText       │ │ • Attach PDF   │ │ • save()       │      │
│  │ • Professional│ │ • SMTP Client  │ │ • delete()     │      │
│  │   Formatting  │ │                │ │                │      │
│  └────────────────┘ └────────────────┘ └────────────────┘      │
│                              │                                  │
└──────────────────────────────┼──────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
              ▼               ▼               ▼
     ┌──────────────┐  ┌────────────────┐  ┌──────────┐
     │   MongoDB    │  │  Gmail SMTP    │  │ PDF File │
     │              │  │                │  │          │
     │ • invoices   │  │ • Send emails  │  │ • Sent   │
     │   collection │  │ • SMTP server  │  │   to     │
     │ • Store data │  │ • Auth & certs │  │ clients  │
     │ • Persist    │  │                │  │          │
     └──────────────┘  └────────────────┘  └──────────┘
```

## Data Flow Diagrams

### 1. Create Invoice Flow

```
┌─────────┐
│ User    │
│ Fills   │
│ Form    │
└────┬────┘
     │
     ▼
┌──────────────────────┐
│ Frontend Form        │
│ Validation           │
└────┬────────────────┘
     │
     ▼
┌──────────────────────────────┐
│ apiService.createInvoice()   │
│ POST /api/invoices           │
└────┬─────────────────────────┘
     │
     ▼
┌──────────────────────┐
│ InvoiceController    │
│ createInvoice()      │
└────┬────────────────┘
     │
     ▼
┌──────────────────────┐
│ InvoiceService       │
│ Validation           │
│ createInvoice()      │
└────┬────────────────┘
     │
     ▼
┌──────────────────────┐
│ InvoiceRepository    │
│ save(invoice)        │
└────┬────────────────┘
     │
     ▼
┌──────────────────────┐
│ MongoDB              │
│ Save document        │
└────┬────────────────┘
     │
     ▼
┌──────────────────────┐
│ Return saved invoice │
│ with ID              │
└────┬────────────────┘
     │
     ▼
┌──────────────────────┐
│ Frontend             │
│ Update UI            │
│ Show in list         │
└──────────────────────┘
```

### 2. Send Email with PDF Flow

```
┌──────────────┐
│ User clicks  │
│ Email icon   │
└────┬─────────┘
     │
     ▼
┌──────────────────────┐
│ handleSendEmail()    │
│ (App.tsx)            │
└────┬────────────────┘
     │
     ▼
┌────────────────────────────┐
│ apiService.sendEmail()     │
│ POST /{id}/send-email      │
└────┬──────────────────────┘
     │
     ▼
┌──────────────────────┐
│ InvoiceController    │
│ sendInvoiceEmail()   │
└────┬────────────────┘
     │
     ▼
┌──────────────────────┐
│ InvoiceService       │
│ getInvoiceById()     │
└────┬────────────────┘
     │
     ▼
┌──────────────────────┐
│ PdfService           │
│ generateInvoicePdf() │
└────┬────────────────┘
     │
     ▼
┌──────────────────────┐
│ EmailService         │
│ buildEmailBody()     │
└────┬────────────────┘
     │
     ▼
┌──────────────────────┐
│ JavaMailSender       │
│ send() via SMTP      │
└────┬────────────────┘
     │
     ▼
┌──────────────────────┐
│ Gmail SMTP Server    │
│ (smtp.gmail.com)     │
└────┬────────────────┘
     │
     ▼
┌──────────────────────┐
│ Employee Email       │
│ Inbox                │
└──────────────────────┘
```

### 3. Download PDF Flow

```
┌──────────────┐
│ User clicks  │
│ Download icon│
└────┬─────────┘
     │
     ▼
┌──────────────────────┐
│ handleDownload()     │
│ (App.tsx)            │
└────┬────────────────┘
     │
     ▼
┌────────────────────────────┐
│ apiService.downloadPdf()   │
│ GET /{id}/download         │
└────┬──────────────────────┘
     │
     ▼
┌──────────────────────┐
│ InvoiceController    │
│ downloadPdf()        │
└────┬────────────────┘
     │
     ▼
┌──────────────────────┐
│ InvoiceService       │
│ getInvoiceById()     │
└────┬────────────────┘
     │
     ▼
┌──────────────────────┐
│ PdfService           │
│ generateInvoicePdf() │
│ (iText library)      │
└────┬────────────────┘
     │
     ▼
┌──────────────────────┐
│ byte[] PDF content   │
│ with headers         │
└────┬────────────────┘
     │
     ▼
┌──────────────────────┐
│ Browser              │
│ File Download        │
│ Dialog               │
└────┬────────────────┘
     │
     ▼
┌──────────────────────┐
│ File saved to        │
│ Downloads folder     │
└──────────────────────┘
```

## Technology Stack

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND                             │
├─────────────────────────────────────────────────────────┤
│ • React 18          - UI Framework                     │
│ • TypeScript        - Type Safety                      │
│ • Vite              - Build Tool                       │
│ • Tailwind CSS      - Styling                          │
│ • Fetch API         - HTTP Client                      │
│ • LocalStorage Hook - Data Persistence (optional)      │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                    BACKEND                              │
├─────────────────────────────────────────────────────────┤
│ • Spring Boot 3.2   - Framework                        │
│ • Java 17           - Language                         │
│ • Spring Data MongoDB - Database Access                │
│ • Spring Mail       - Email Sending                    │
│ • iText 7           - PDF Generation                   │
│ • Maven             - Build Tool                       │
│ • Lombok            - Code Generation                  │
│ • Validation        - Data Validation                  │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                    DATABASE                             │
├─────────────────────────────────────────────────────────┤
│ • MongoDB           - NoSQL Database                   │
│ • Collections       - Flexible Schema                  │
│ • Indexes           - Fast Queries                     │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                  EXTERNAL SERVICES                      │
├─────────────────────────────────────────────────────────┤
│ • Gmail SMTP        - Email Delivery                   │
│ • iText             - PDF Rendering                    │
└─────────────────────────────────────────────────────────┘
```

## API Response Structure

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    "id": "507f1f77bcf86cd799439011",
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
    "createdAt": "2024-12-04 10:30:45",
    "updatedAt": "2024-12-04 10:30:45"
  }
}
```

## Database Schema Visualization

```
MongoDB: invoice_db
└── Collection: invoices
    ├── _id: ObjectId
    ├── invoiceNumber: String
    ├── date: String (YYYY-MM-DD)
    ├── employeeName: String
    ├── employeeId: String
    ├── employeeEmail: String
    ├── employeeAddress: String
    ├── employeeMobile: String
    ├── services: Array
    │   ├── [0]
    │   │   ├── id: String
    │   │   ├── description: String
    │   │   ├── hours: Number
    │   │   └── rate: Number
    │   └── [1] ... more items
    ├── taxRate: Number
    ├── createdAt: ISODate
    ├── updatedAt: ISODate
    └── createdBy: String (optional)
```

This visualization helps understand the complete flow of the application from user interaction through backend processing to data storage and external service calls.
