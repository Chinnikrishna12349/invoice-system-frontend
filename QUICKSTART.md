# Quick Start Guide - Invoice Management System

## What You Have

A complete Full-Stack Invoice Management System with:

- ✅ React Frontend (Vite + Tailwind CSS)
- ✅ Spring Boot Backend (Java 17)
- ✅ MongoDB Database
- ✅ Email Service (Gmail SMTP)
- ✅ PDF Generation
- ✅ Professional UI

## Prerequisites (Install if Missing)

```powershell
# Check versions
java -version          # Should be 17 or higher
mvn -version          # Should be 3.6 or higher
npm -version          # Should be 14 or higher

# If missing, download:
# Java: https://www.oracle.com/java/technologies/downloads/
# Maven: https://maven.apache.org/
# Node.js: https://nodejs.org/
# MongoDB: https://www.mongodb.com/try/download/community
```

## Step 1: Start MongoDB (Terminal 1)

```powershell
# Windows - if installed via installer
net start MongoDB

# OR if installed via chocolatey/manual
mongod

# Verify connection
mongo --eval "db.adminCommand('ping')"
```

Expected output: `{ ok: 1 }`

## Step 2: Start Backend (Terminal 2)

```powershell
# Navigate to backend
cd backend

# Build (first time only)
mvn clean install

# Run
mvn spring-boot:run

# Wait for: "Started InvoiceManagementApplication in X seconds"
```

Backend is ready at: **http://localhost:8080**

### (Optional) Configure Email

If you want to test email feature:

1. Get Gmail App Password:

   - Go to myaccount.google.com
   - Security → 2-Step Verification (enable if needed)
   - App passwords → Select Mail and Windows
   - Copy 16-character password

2. Set environment variable (before running backend):

```powershell
$env:MAIL_USERNAME="your-email@gmail.com"
$env:MAIL_PASSWORD="your-16-char-password"

# Then start backend as above
mvn spring-boot:run
```

## Step 3: Start Frontend (Terminal 3)

```powershell
# From project root
npm install

# Start dev server
npm run dev

# Vite will output something like:
# ➜  Local:   http://localhost:3002/
```

Open browser to: **http://localhost:3002**

## Step 4: Test the Application

### Create Invoice

1. Click "Create Invoice" form
2. Fill in all fields:
   - Employee Name, ID, Email, Mobile, Address
   - Add Work Details (click "Add Service")
   - Enter Hours and Unit Price
3. Click "✅ Save Invoice"
4. Should appear in Invoices list

### Edit Invoice

1. Click on any invoice card
2. Form updates with invoice data
3. Modify any field
4. Click "💾 Update Invoice"

### Download PDF

1. Click 📥 icon on invoice
2. PDF downloads automatically

### Send Email

1. Click ✉️ icon on invoice
2. Email sent to employee (if configured)
3. Includes PDF attachment

### Delete Invoice

1. Click 🗑️ icon on invoice
2. Confirm deletion
3. Invoice removed

## Project Structure

```
react-invoice-generator/
├── src/                          # React Frontend
│   ├── components/               # React components
│   ├── services/
│   │   ├── apiService.ts        # Backend API calls
│   │   └── pdfService.ts        # PDF generation
│   └── main.tsx
│
├── backend/                       # Spring Boot Backend
│   ├── src/main/java/
│   │   └── com/invoiceapp/
│   │       ├── controller/       # API endpoints
│   │       ├── service/          # Business logic
│   │       ├── entity/           # Data models
│   │       └── repository/       # Database access
│   │
│   ├── pom.xml                  # Maven dependencies
│   ├── README.md                # Backend documentation
│   └── SETUP.md                 # Setup instructions
│
├── .env                          # Configuration
└── INTEGRATION_GUIDE.md         # Full integration details
```

## Common Commands

### Backend

```bash
cd backend

# Build
mvn clean install

# Run
mvn spring-boot:run

# Run tests
mvn test

# Create JAR for production
mvn clean package
```

### Frontend

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## API Endpoints

All endpoints available at: `http://localhost:8080/api/invoices`

| Action       | Endpoint           | Method |
| ------------ | ------------------ | ------ |
| Create       | `/`                | POST   |
| List All     | `/`                | GET    |
| Get One      | `/{id}`            | GET    |
| Update       | `/{id}`            | PUT    |
| Delete       | `/{id}`            | DELETE |
| Download PDF | `/{id}/download`   | GET    |
| Send Email   | `/{id}/send-email` | POST   |

## Database

MongoDB stores all invoices in collection: `invoices`

View data:

```bash
mongo
use invoice_db
db.invoices.find().pretty()
db.invoices.count()
```

## Troubleshooting

### "Port 8080 already in use"

```bash
# Kill the process
netstat -ano | findstr :8080
taskkill /PID <PID> /F

# Or change port in backend/src/main/resources/application.properties
server.port=8081
```

### "Cannot connect to MongoDB"

```bash
# Start MongoDB
mongod

# Verify it's running
mongo --eval "db.adminCommand('ping')"
```

### "Frontend can't reach backend"

- Check backend is running: http://localhost:8080/api/invoices
- Check .env file has correct URL: `REACT_APP_API_URL=http://localhost:8080/api/invoices`
- Restart frontend: `npm run dev`

### "Email not sending"

- Verify credentials set before backend starts
- Use App Password (16 chars), not Gmail password
- Check 2-FA is enabled on Gmail
- Verify firewall allows SMTP 587

## Features Summary

| Feature          | Status      | Location                |
| ---------------- | ----------- | ----------------------- |
| Create Invoice   | ✅ Complete | App.tsx, apiService.ts  |
| Edit Invoice     | ✅ Complete | App.tsx, apiService.ts  |
| Delete Invoice   | ✅ Complete | App.tsx, apiService.ts  |
| Download PDF     | ✅ Complete | apiService.ts (backend) |
| Send Email       | ✅ Complete | apiService.ts (backend) |
| Data Persistence | ✅ Complete | MongoDB                 |
| Professional UI  | ✅ Complete | Tailwind CSS            |
| Validation       | ✅ Complete | Frontend + Backend      |
| Error Handling   | ✅ Complete | Both layers             |

## Next Steps

1. **Test Everything**: Create, edit, delete, download, email
2. **Customize**: Modify colors, add fields, change layout
3. **Deploy**: Move to production when ready
4. **Monitor**: Add logging and error tracking

## Support

If stuck:

1. Check browser console for errors (F12)
2. Check backend logs in terminal
3. Verify all prerequisites installed
4. Check .env and application.properties files
5. See INTEGRATION_GUIDE.md for detailed info

---

## 🎉 You're All Set!

Everything is configured and ready to use. Just start the three terminals:

1. MongoDB: `mongod`
2. Backend: `mvn spring-boot:run` (in backend folder)
3. Frontend: `npm run dev` (in project root)

Then open http://localhost:3002 and start creating invoices!
