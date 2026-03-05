# Backend Setup Guide

## Quick Start (Windows PowerShell)

```powershell
# 1. Navigate to backend folder
cd backend

# 2. Set environment variables (Gmail SMTP)
$env:MAIL_USERNAME="your-email@gmail.com"
$env:MAIL_PASSWORD="your-app-password"

# 3. Start MongoDB (if running locally)
# Open new PowerShell window and run:
mongod

# 4. Build and run backend (in main PowerShell window)
mvn clean install
mvn spring-boot:run

# Backend will start at http://localhost:8080
```

## Prerequisites

### 1. Java Installation
- Download Java 17: https://www.oracle.com/java/technologies/downloads/#java17
- Verify: `java -version`

### 2. Maven Installation
- Download Maven: https://maven.apache.org/download.cgi
- Add to PATH
- Verify: `mvn -version`

### 3. MongoDB Installation
- Download: https://www.mongodb.com/try/download/community
- Install and run MongoDB service
- Verify connection: `mongo --eval "db.adminCommand('ping')"`

### 4. Gmail App Password
1. Go to myaccount.google.com
2. Select "Security" from left panel
3. Enable 2-Step Verification
4. Go back to Security
5. Find "App passwords"
6. Select "Mail" and "Windows Computer"
7. Copy the generated 16-character password

## Configuration

### application.properties locations
- Default: `src/main/resources/application.properties`
- Override: `application.properties` in the same folder as JAR

### Key Configuration Properties

```properties
# Server
server.port=8080

# MongoDB
spring.data.mongodb.uri=mongodb://localhost:27017/invoice_db

# Gmail SMTP
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=your-email@gmail.com
spring.mail.password=your-app-password

# Sender Details
app.mail.from=noreply@invoiceapp.com
app.mail.from-name=Invoice Management System
```

## Build Options

### Development Build
```bash
mvn clean install
mvn spring-boot:run
```

### Production Build (JAR)
```bash
mvn clean package
java -jar target/invoice-backend-1.0.0.jar
```

### IDE Setup (IntelliJ IDEA)
1. Open project
2. Right-click pom.xml → "Add as Maven Project"
3. Run → Edit Configurations
4. Add new "Application"
5. Main class: `com.invoiceapp.InvoiceManagementApplication`
6. Run

## Testing API

### Using Postman/Curl

**Get All Invoices:**
```bash
curl http://localhost:8080/api/invoices
```

**Create Invoice:**
```bash
curl -X POST http://localhost:8080/api/invoices \
  -H "Content-Type: application/json" \
  -d '{
    "invoiceNumber": "INV#001",
    "date": "2024-12-04",
    "employeeName": "John Doe",
    "employeeId": "EMP001",
    "employeeEmail": "john@example.com",
    "employeeAddress": "123 Main St",
    "employeeMobile": "9876543210",
    "services": [{
      "id": "svc-1",
      "description": "Web Dev",
      "hours": 40,
      "rate": 500
    }],
    "taxRate": 10
  }'
```

## Troubleshooting

### Port 8080 Already in Use
```powershell
# Find process
netstat -ano | findstr :8080

# Change port in application.properties
server.port=8081
```

### MongoDB Connection Failed
```powershell
# Start MongoDB manually
mongod --dbpath "C:\Program Files\MongoDB\Server\version\data"

# Or add to PATH and use default:
mongod
```

### Maven Build Fails
```bash
# Clear cache
mvn clean

# Update dependencies
mvn clean install -U

# Skip tests
mvn clean install -DskipTests
```

### Email Not Sending
1. Verify Gmail credentials
2. Check if 2-FA is enabled
3. Use App Password (16 chars), not regular password
4. Check firewall/antivirus blocking SMTP 587

## Next Steps

1. **Start MongoDB**: `mongod` (in separate terminal)
2. **Start Backend**: `mvn spring-boot:run` (runs on port 8080)
3. **Update Frontend**: Add API base URL to React app
4. **Test API**: Use Postman or curl commands above
5. **Configure Email**: Set up Gmail credentials