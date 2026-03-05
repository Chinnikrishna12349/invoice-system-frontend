import urllib.request
import json
import ssl

url = "http://localhost:8081/api/invoices"
data = {
    "invoiceNumber": "TEST-001",
    "date": "2026-02-11",
    "employeeName": "Test Employee",
    "employeeEmail": "test@example.com",
    "employeeAddress": "123 Test St",
    "employeeMobile": "1234567890",
    "services": [],
    "taxRate": 10.0,
    "country": "japan",
    "userId": "test-user-id"
}

try:
    req = urllib.request.Request(url, json.dumps(data).encode('utf-8'))
    req.add_header('Content-Type', 'application/json')
    with urllib.request.urlopen(req) as f:
        print("Success: " + f.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print("Error Code: " + str(e.code))
    error_body = e.read().decode('utf-8')
    print("Error Body: " + error_body)
except Exception as e:
    print("Exception: " + str(e))
