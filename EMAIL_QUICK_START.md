# Email Service Quick Start

## 🚀 Get Email Working in 3 Steps

### Step 1️⃣: Choose Your Email Provider

**Option A: Brevo API (Recommended) ⭐**

```
Pros: Most reliable, free API key, no SMTP issues
Cons: Requires account signup
Setup Time: 5 minutes
```

**Option B: Gmail SMTP**

```
Pros: Already have Gmail account
Cons: Can have auth issues, slower delivery
Setup Time: 5 minutes
```

**Option C: Test Mode**

```
Pros: Works immediately, no setup
Cons: Only logs to console, no real sending
Setup Time: 1 minute
```

---

### Step 2️⃣: Run Setup Commands

**For Brevo:**

```powershell
# Create free account at https://brevo.com
# Get API key from Settings → API Keys

$env:EMAIL_MODE = "PRODUCTION"
$env:BREVO_API_KEY = "sk_test_1234567890abcdef"  # Your actual key
```

**For Gmail:**

```powershell
# Get 16-char password from https://myaccount.google.com/apppasswords

$env:EMAIL_MODE = "PRODUCTION"
$env:GMAIL_USER = "chinnikrishnamaddana@gmail.com"
$env:GMAIL_PASS = "abcd efgh ijkl mnop"  # 16-char app password
```

**For Test Mode:**

```powershell
$env:EMAIL_MODE = "TEST"
```

---

### Step 3️⃣: Restart Email Service

```powershell
# Stop current service
Get-Job -Name EmailService | Stop-Job | Remove-Job -Force

# Start with new config
Start-Job -ScriptBlock {
  cd "c:\Users\Lenovo\Downloads\react-invoice-generator"
  node email-service-node.mjs
} -Name EmailService

# Wait 2 seconds and check
Start-Sleep -Seconds 2
Get-Job -Name EmailService | Receive-Job -Keep | Select-Object -Last 5
```

---

## ✅ Verification

```powershell
# Check service is running
curl http://localhost:5000/health

# Check configuration
curl http://localhost:5000/status
```

---

## 📧 Send Test Email

1. Open http://localhost:3000
2. Click on an invoice
3. Click "Send Email" button
4. Enter recipient email
5. Click "Send"
6. Check logs:
   ```powershell
   Get-Job -Name EmailService | Receive-Job -Keep
   ```

---

## 🔧 Common Issues

| Issue                      | Solution                                                     |
| -------------------------- | ------------------------------------------------------------ |
| "Port 5000 already in use" | Stop other Node process: `Get-Process node \| Stop-Process`  |
| "BREVO_API_KEY not set"    | Set in same PowerShell window, don't close it before restart |
| "Gmail auth failed"        | Use 16-char App Password, not regular password               |
| "Can't find email service" | Start it again: `Start-Job -ScriptBlock { ... }`             |

---

## 📞 Need Help?

- Full guide: See `BREVO_SETUP_GUIDE.md`
- Email service logs: `Get-Job -Name EmailService | Receive-Job -Keep`
- Test without email: Set `EMAIL_MODE=TEST` and restart

---

**Pro Tip:** Start with **Test Mode** to verify everything works, then switch to **Brevo** for real emails.
