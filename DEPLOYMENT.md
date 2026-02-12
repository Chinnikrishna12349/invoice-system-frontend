# Production Deployment Guide

## Pre-Deployment Checklist

- [ ] All tests passing
- [ ] No console errors in browser
- [ ] No errors in backend logs
- [ ] Database backup created
- [ ] Environment variables configured
- [ ] SSL certificates ready (if HTTPS)
- [ ] Email credentials verified
- [ ] CORS origins updated for production

## Part 1: Backend Deployment

### Option 1: Deploy as JAR (Recommended)

#### Step 1: Build Production JAR

```bash
cd backend
mvn clean package -DskipTests
```

Creates: `target/invoice-backend-1.0.0.jar`

#### Step 2: Configure for Production

Create `application-prod.properties` in the same directory as JAR:

```properties
spring.application.name=invoice-management-backend
server.port=8080

# Production MongoDB
spring.data.mongodb.uri=mongodb+srv://username:password@cluster.mongodb.net/invoice_db

# Production Email
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=${MAIL_USERNAME}
spring.mail.password=${MAIL_PASSWORD}

# Production CORS
app.cors.allowed-origins=https://yourdomain.com,https://www.yourdomain.com

# Logging
logging.level.root=WARN
logging.level.com.invoiceapp=INFO
```

#### Step 3: Run JAR

```bash
# With environment variables
export MAIL_USERNAME="your-email@gmail.com"
export MAIL_PASSWORD="your-app-password"
export SPRING_PROFILES_ACTIVE=prod

java -jar invoice-backend-1.0.0.jar
```

### Option 2: Docker Deployment

#### Step 1: Create Dockerfile

```dockerfile
FROM openjdk:17-jdk-slim

WORKDIR /app

COPY target/invoice-backend-1.0.0.jar app.jar

# Set environment variables
ENV MAIL_USERNAME=${MAIL_USERNAME}
ENV MAIL_PASSWORD=${MAIL_PASSWORD}
ENV SPRING_PROFILES_ACTIVE=prod

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
```

#### Step 2: Build Docker Image

```bash
docker build -t invoice-backend:1.0.0 .
```

#### Step 3: Run Docker Container

```bash
docker run -d \
  -p 8080:8080 \
  -e MAIL_USERNAME="your-email@gmail.com" \
  -e MAIL_PASSWORD="your-app-password" \
  -e SPRING_PROFILES_ACTIVE=prod \
  --name invoice-backend \
  invoice-backend:1.0.0
```

### Option 3: Cloud Deployment (Heroku)

#### Step 1: Install Heroku CLI

```bash
# Windows
choco install heroku-cli

# Verify
heroku --version
```

#### Step 2: Login to Heroku

```bash
heroku login
```

#### Step 3: Create Heroku App

```bash
heroku create invoice-management-api
```

#### Step 4: Add MongoDB

```bash
heroku addons:create mongolab:sandbox -a invoice-management-api
```

#### Step 5: Set Config Variables

```bash
heroku config:set MAIL_USERNAME=your-email@gmail.com -a invoice-management-api
heroku config:set MAIL_PASSWORD=your-app-password -a invoice-management-api
heroku config:set SPRING_PROFILES_ACTIVE=prod -a invoice-management-api
```

#### Step 6: Deploy

```bash
git push heroku main
```

## Part 2: Frontend Deployment

### Build Production Version

```bash
npm run build
```

Creates: `dist/` folder with optimized files

### Deployment Options

#### Option 1: Render (Backend) + Netlify (Frontend) [Recommended]

**Step 1: Deploy Backend to Render**
1. Create a new **Web Service** on Render.
2. Connect your repository.
3. Set the **Environment** to `Docker`.
4. Render will automatically detect the `backend/Dockerfile`.
5. Add the following **Environment Variables**:
   - `SPRING_DATA_MONGODB_URI`: Your MongoDB Atlas connection string.
   - `MAIL_USERNAME`: Your email address for sending invoices.
   - `MAIL_PASSWORD`: Your email app password.
   - `JWT_SECRET`: A strong random string for security.
6. Once deployed, copy your Render Service URL (e.g., `https://invoice-backend.onrender.com`).

**Step 2: Deploy Frontend to Netlify**
1. Create a new site on Netlify and connect your repository.
2. Set the **Build Command** to `npm run build`.
3. Set the **Publish Directory** to `dist`.
4. Add the following **Environment Variables**:
   - `VITE_API_URL`: Your Render backend URL + `/api/invoices` (e.g., `https://invoice-backend.onrender.com/api/invoices`).
   - `VITE_UPLOAD_URL`: Your Render backend URL + `/uploads` (e.g., `https://invoice-backend.onrender.com/uploads`).
5. Netlify will build the project and deploy it. The `public/_redirects` file we added will handle routing automatically.

#### Option 2: Netlify (Easiest)

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod --dir dist
```

#### Option 2: Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

#### Option 3: GitHub Pages

1. Update `vite.config.ts`:

```typescript
export default {
  base: '/repo-name/',
  ...
}
```

2. Deploy:

```bash
npm run build
npm run deploy
```

#### Option 4: Traditional Web Server

1. **Nginx**:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    root /var/www/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://backend-server:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

2. **Apache**:

```apache
<VirtualHost *:80>
    ServerName yourdomain.com

    DocumentRoot /var/www/html

    <Directory /var/www/html>
        Options -MultiViews
        RewriteEngine On
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteRule ^ index.html [QSA,L]
    </Directory>

    ProxyPass /api http://backend-server:8080
    ProxyPassReverse /api http://backend-server:8080
</VirtualHost>
```

## Part 3: Environment Setup

### Update Configuration Files

#### Frontend (.env.production)

```
REACT_APP_API_URL=https://api.yourdomain.com/api/invoices
```

#### Backend (application-prod.properties)

```properties
# Update all URLs to production domains
app.cors.allowed-origins=https://yourdomain.com

# Increase timeout values
server.servlet.session.timeout=1800

# Configure for HTTPS
server.ssl.key-store=classpath:keystore.p12
server.ssl.key-store-password=${SSL_PASSWORD}
```

## Part 4: Database Migration

### MongoDB Atlas Setup

1. Create account: mongodb.com/cloud/atlas
2. Create cluster
3. Add IP whitelist
4. Create database user
5. Get connection string
6. Update application.properties

### Data Migration

```bash
# Export from local
mongoexport --db invoice_db --collection invoices --out invoices.json

# Import to cloud
mongoimport --uri "mongodb+srv://user:pass@cluster.mongodb.net/invoice_db" \
  --collection invoices --file invoices.json
```

## Part 5: SSL/HTTPS Setup

### Let's Encrypt (Free)

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Generate certificate
sudo certbot certonly --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renew
sudo certbot renew --dry-run
```

### Update Backend for HTTPS

```properties
server.ssl.key-store-type=PKCS12
server.ssl.key-store=file:/path/to/keystore.p12
server.ssl.key-store-password=${SSL_PASSWORD}
server.port=8443
```

## Part 6: Monitoring & Logging

### Application Monitoring

```properties
# application-prod.properties
logging.file.name=logs/invoice-app.log
logging.file.max-size=10MB
logging.file.max-history=10
logging.level.root=WARN
logging.level.com.invoiceapp=INFO
```

### View Logs

```bash
# Tail logs
tail -f logs/invoice-app.log

# With filtering
grep ERROR logs/invoice-app.log
```

### Enable Metrics

```properties
management.endpoints.web.exposure.include=health,metrics,info
management.endpoint.health.show-details=always
```

Access metrics: `/actuator/metrics`

## Part 7: Backup & Recovery

### Database Backup

```bash
# Manual backup
mongodump --uri="mongodb+srv://user:pass@cluster.mongodb.net/invoice_db" \
  --out=backup/

# Scheduled backup (cron)
0 2 * * * /path/to/backup-script.sh
```

### Application Backup

```bash
# Backup JAR
cp invoice-backend-1.0.0.jar invoice-backend-1.0.0.jar.backup

# Backup configuration
cp application.properties application.properties.backup
```

## Part 8: Performance Optimization

### Backend Optimization

```properties
# Connection pooling
spring.data.mongodb.connection-string.pool-size=50

# Cache settings
server.tomcat.threads.max=200
server.tomcat.threads.min-spare=10

# Compression
server.compression.enabled=true
server.compression.min-response-size=1024
```

### Frontend Optimization

```bash
# Already configured in vite.config.ts
# - Code splitting
# - Asset compression
# - Tree shaking
# - Minification
```

## Part 9: Security Checklist

- [ ] Enable HTTPS/SSL
- [ ] Set strong database passwords
- [ ] Use environment variables (never hardcode secrets)
- [ ] Enable CORS for specific domains only
- [ ] Implement rate limiting
- [ ] Add request validation
- [ ] Keep dependencies updated
- [ ] Use API keys for sensitive endpoints
- [ ] Enable security headers
- [ ] Regular security audits

### Add Security Headers (Nginx)

```nginx
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
```

## Part 10: Troubleshooting

### Backend Issues

```bash
# Check port
netstat -tlnp | grep 8080

# Check logs
tail -f logs/invoice-app.log

# Restart service
sudo systemctl restart invoice-backend
```

### Database Issues

```bash
# Check connection
mongo "mongodb+srv://user:pass@cluster.mongodb.net/admin"

# Check database
db.adminCommand("ping")

# Check collections
show collections
```

### Frontend Issues

```bash
# Clear cache
rm -rf dist/ node_modules/

# Rebuild
npm install
npm run build

# Check build output
ls -la dist/
```

## Deployment Checklist Template

```markdown
## Pre-Production Checklist

- [ ] Code reviewed and tested
- [ ] Dependencies updated
- [ ] Environment variables set
- [ ] Database backup created
- [ ] SSL certificate installed
- [ ] Domains configured
- [ ] Email service tested

## Deployment Steps

- [ ] Build backend JAR
- [ ] Build frontend dist
- [ ] Deploy backend
- [ ] Deploy frontend
- [ ] Run smoke tests
- [ ] Monitor logs
- [ ] Verify email service

## Post-Deployment

- [ ] All endpoints accessible
- [ ] No error logs
- [ ] Database connection working
- [ ] Email notifications working
- [ ] PDF generation working
- [ ] Performance acceptable
```

---

## Quick Deployment Commands

```bash
# Build and deploy backend
cd backend
mvn clean package -DskipTests
java -jar target/invoice-backend-1.0.0.jar &

# Build and deploy frontend
npm run build
netlify deploy --prod --dir dist

# Check backend health
curl https://yourdomain.com/api/invoices
```

## Support & Monitoring

### Set Up Monitoring

- Use DataDog, New Relic, or similar
- Monitor API response times
- Track database queries
- Monitor email delivery

### Get Alerts For

- High error rates
- Database connection issues
- Email delivery failures
- Performance degradation

---

**Always test in staging before deploying to production!**
