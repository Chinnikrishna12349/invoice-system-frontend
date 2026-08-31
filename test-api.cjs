const fetch = require('node-fetch');
const FormData = require('form-data');

async function run() {
  const loginRes = await fetch('https://invoice-system-backend-owhd.onrender.com/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'test_live_1@example.com', password: 'password123' })
  });
  
  if (loginRes.status !== 200) {
    console.log("Login failed, attempting signup...");
    const form = new FormData();
    form.append('email', 'test_live_1@example.com');
    form.append('password', 'password123');
    form.append('name', 'Test Live User');
    form.append('companyName', 'Test Corp');
    
    const signupRes = await fetch('https://invoice-system-backend-owhd.onrender.com/api/auth/signup', {
      method: 'POST',
      body: form
    });
    console.log("Signup status:", signupRes.status);
    console.log("Signup response:", await signupRes.text());
  }

  const loginRes2 = await fetch('https://invoice-system-backend-owhd.onrender.com/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'test_live_1@example.com', password: 'password123' })
  });
  
  const loginJson = await loginRes2.json();
  const token = loginJson.token;
  
  if (!token) {
    console.error("Still no token:", loginJson);
    return;
  }
  
  console.log("Got token successfully!");
  
  const idealFolksData = {
    invoiceNumber: 'INV-IF-0002',
    date: '2026-08-30',
    dueDate: '2026-10-14',
    company: 'Ideal Folks LLC',
    employeeName: 'KK Blue Arbarao',
    employeeEmail: 'soumu@blue-arbaro.tokyo',
    employeeAddress: 'Tokyo',
    employeeMobile: '0365552183',
    fromEmail: 'hr@visionai.jp',
    clientType: 'company',
    country: 'japan',
    services: [{ id: '1', description: 'Consulting', hours: 10, rate: 100, shift: '9am' }],
    taxRate: 10,
    showConsumptionTax: true,
    roundOff: 0,
    finalAmount: 1100,
    companyInfo: {
      id: 'comp_ideal_folks',
      companyName: 'Ideal Folks LLC',
      companyAddress: '106-0044, Tokyo, Minato-Ku, Highashiazabu 3-4-17, Higashi Azabu K Building 3F',
      companyLogoUrl: '',
      invoiceFormat: 'INV-IF-',
      bankDetails: {
        bankName: 'Sumitomo Mitsui Banking Corporation',
        accountNumber: '1234567',
        accountHolderName: 'IDEAL FOLKS',
        ifscCode: '',
        swiftCode: 'SMBCJPJT',
        bankCode: '0009',
        branchName: 'Azabu Branch',
        branchCode: '123',
        accountType: 'Savings'
      }
    }
  };

  const invoiceRes1 = await fetch('https://invoice-system-backend-owhd.onrender.com/api/invoices', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(idealFolksData)
  });
  console.log("Status IF live:", invoiceRes1.status);
  console.log("Response IF live:", await invoiceRes1.text());
}

run();
