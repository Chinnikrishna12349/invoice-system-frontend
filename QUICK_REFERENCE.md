# Quick Reference Commands

## 🚀 Starting Services

### Start Backend (Spring Boot)

```powershell
cd c:\Users\Lenovo\Downloads\react-invoice-generator\backend
mvn clean package -DskipTests -q
java -jar target/invoice-backend-1.0.0.jar
```

### Start Frontend (React Vite)

```powershell
cd c:\Users\Lenovo\Downloads\react-invoice-generator
npm install  # if needed
npm run dev
```

### Start Email Service (Node.js)

```powershell
cd c:\Users\Lenovo\Downloads\react-invoice-generator
npm install  # if needed
node email-service-node.mjs
```

### Start All Three Services (Parallel)

```powershell
# Terminal 1
cd c:\Users\Lenovo\Downloads\react-invoice-generator\backend ; java -jar target/invoice-backend-1.0.0.jar

# Terminal 2 (New PowerShell window)
cd c:\Users\Lenovo\Downloads\react-invoice-generator ; npm run dev

# Terminal 3 (New PowerShell window)
cd c:\Users\Lenovo\Downloads\react-invoice-generator ; node email-service-node.mjs
```

---

## 🛑 Stopping Services

### Kill All Java Processes

```powershell
Get-Process -Name java -ErrorAction SilentlyContinue | Stop-Process -Force
```

### Kill All Node Processes

```powershell
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
```

### Kill Specific Port

```powershell
# Port 8080 (Backend)
Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }

# Port 3000 (Frontend)
Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }

# Port 5000 (Email Service)
Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
```

---

## 🔍 Checking Service Status

### Check if Services are Running

```powershell
# Check Backend (8080)
Invoke-WebRequest -Uri http://localhost:8080/api/invoices -ErrorAction SilentlyContinue | Select-Object StatusCode

# Check Frontend (3000)
Invoke-WebRequest -Uri http://localhost:3000 -ErrorAction SilentlyContinue | Select-Object StatusCode

# Check Email Service (5000)
Invoke-WebRequest -Uri http://localhost:5000/health -ErrorAction SilentlyContinue | Select-Object Content
```

### Check Port Usage

```powershell
# Check all invoice system ports
netstat -ano | findstr ":8080"
netstat -ano | findstr ":3000"
netstat -ano | findstr ":5000"

# Or with more details
Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue | Select-Object -Property Local*, Foreign*, State, @{Name="ProcessID";Expression={$_.OwningProcess}} | Format-Table
```

---

## 📧 Email Service Commands

### Switch to PRODUCTION Mode

```powershell
# Set environment variables
$env:EMAIL_MODE = "PRODUCTION"
$env:MAILTRAP_USER = "your_mailtrap_username"
$env:MAILTRAP_PASS = "your_mailtrap_password"

# Restart email service
Get-Job -Name EmailService | Stop-Job | Remove-Job -Force
Start-Job -ScriptBlock {
  cd c:\Users\Lenovo\Downloads\react-invoice-generator
  node email-service-node.mjs
} -Name EmailService
```

### Check Email Service Status

```powershell
# Get service mode
Invoke-WebRequest -Uri http://localhost:5000/health -ErrorAction SilentlyContinue | Select-Object Content

# Get detailed status
Invoke-WebRequest -Uri http://localhost:5000/status -ErrorAction SilentlyContinue | Select-Object Content
```

---

## 🗄️ Database Commands

### Check MongoDB Connection

```powershell
# Test MongoDB connection (requires mongo client installed)
mongo mongodb://localhost:27017/InvoiceSystem

# Or check if MongoDB is running
Get-Process -Name mongod -ErrorAction SilentlyContinue
```

### View Collections

```
# In MongoDB shell
use InvoiceSystem
db.invoices.find()
db.invoices.count()
```

---

## 🔨 Build Commands

### Frontend Build

```powershell
cd c:\Users\Lenovo\Downloads\react-invoice-generator

# Development
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

### Backend Build

```powershell
cd c:\Users\Lenovo\Downloads\react-invoice-generator\backend

# Clean and package
mvn clean package -DskipTests

# Compile only
mvn compile

# Run with Maven
mvn spring-boot:run
```

---

## 📊 Application URLs

| Service      | URL                                | Purpose                     |
| ------------ | ---------------------------------- | --------------------------- |
| Frontend     | http://localhost:3000              | React invoice app           |
| Backend      | http://localhost:8080/api/invoices | REST API                    |
| Email Health | http://localhost:5000/health       | Check email service status  |
| Email Status | http://localhost:5000/status       | Email service configuration |

---

## 🧪 Testing Commands

### Test Backend API

```powershell
# Get all invoices
Invoke-WebRequest -Uri "http://localhost:8080/api/invoices" -Method GET

# Create invoice (example)
$body = @{
    invoiceNumber = "INV-001"
    date = "2023-12-01"
    employeeName = "John Doe"
    employeeEmail = "john@example.com"
    services = @(@{description="Service"; hours=10; rate=50})
    taxRate = 10
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:8080/api/invoices" -Method POST -Body $body -ContentType "application/json"
```

### Test Email Service

```powershell
# Send test email
$emailBody = @{
    to = "test@example.com"
    subject = "Test Invoice"
    html = "<h1>Test Email</h1>"
    attachments = @()
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:5000/api/send-email" `
    -Method POST `
    -Body $emailBody `
    -ContentType "application/json"
```

---

## 🧹 Cleanup Commands

### Clear Frontend Cache

```powershell
cd c:\Users\Lenovo\Downloads\react-invoice-generator
Remove-Item -Path ".vite", "dist", "node_modules" -Recurse -Force -ErrorAction SilentlyContinue
npm install
npm run dev
```

### Clear Backend Build

```powershell
cd c:\Users\Lenovo\Downloads\react-invoice-generator\backend
Remove-Item -Path "target" -Recurse -Force -ErrorAction SilentlyContinue
mvn clean package -DskipTests -q
java -jar target/invoice-backend-1.0.0.jar
```

### Clear Everything & Fresh Start

```powershell
# Kill all processes
Get-Process -Name java, node -ErrorAction SilentlyContinue | Stop-Process -Force

# Clean frontend
cd c:\Users\Lenovo\Downloads\react-invoice-generator
Remove-Item -Path ".vite", "dist", "node_modules" -Recurse -Force -ErrorAction SilentlyContinue

# Clean backend
cd backend
Remove-Item -Path "target" -Recurse -Force -ErrorAction SilentlyContinue

# Reinstall and rebuild
cd ..
npm install
cd backend
mvn clean package -DskipTests -q
cd ..

# Start fresh
# Terminal 1: Backend
# Terminal 2: Frontend
# Terminal 3: Email Service
```

---

## 📝 Useful File Locations

```powershell
# Root directory
C:\Users\Lenovo\Downloads\react-invoice-generator\

# Frontend
C:\Users\Lenovo\Downloads\react-invoice-generator\src\
C:\Users\Lenovo\Downloads\react-invoice-generator\services\
C:\Users\Lenovo\Downloads\react-invoice-generator\components\

# Backend
C:\Users\Lenovo\Downloads\react-invoice-generator\backend\src\
C:\Users\Lenovo\Downloads\react-invoice-generator\backend\target\

# Configuration
C:\Users\Lenovo\Downloads\react-invoice-generator\backend\src\main\resources\application.properties
C:\Users\Lenovo\Downloads\react-invoice-generator\vite.config.ts
C:\Users\Lenovo\Downloads\react-invoice-generator\package.json

# Documentation
C:\Users\Lenovo\Downloads\react-invoice-generator\EMAIL_SERVICE_GUIDE.md
C:\Users\Lenovo\Downloads\react-invoice-generator\SYSTEM_OVERVIEW.md
C:\Users\Lenovo\Downloads\react-invoice-generator\QUICKSTART.md
```

---

## 🔧 Troubleshooting Quick Fixes

### Port Already in Use

```powershell
# Find and kill process on specific port
$port = 8080
$pid = (Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue).OwningProcess | Select-Object -First 1
Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
Write-Host "Port $port is now available"
```

### Node Modules Issues

```powershell
cd c:\Users\Lenovo\Downloads\react-invoice-generator
npm cache clean --force
Remove-Item -Path "node_modules" -Recurse -Force
npm install
```

### MongoDB Connection Issues

```powershell
# Restart MongoDB (if running as service)
Restart-Service MongoDB -Force -ErrorAction SilentlyContinue

# Or start standalone
cd "C:\Program Files\MongoDB\Server\7.0\bin"
mongod --dbpath "C:\data\db"
```

### Maven Build Fails

```powershell
cd c:\Users\Lenovo\Downloads\react-invoice-generator\backend

# Clear Maven cache
Remove-Item -Path "$env:USERPROFILE\.m2\repository" -Recurse -Force -ErrorAction SilentlyContinue

# Rebuild
mvn clean package -DskipTests -q
```

---

## 📖 Documentation Files

- **EMAIL_SERVICE_GUIDE.md** - Detailed email configuration
- **SYSTEM_OVERVIEW.md** - Complete system architecture
- **QUICKSTART.md** - Quick start guide
- **ARCHITECTURE.md** - System design details
- **README.md** - General information

---

**Last Updated**: December 4, 2025
**Status**: Production Ready ✅
