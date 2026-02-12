import React from 'react';
import './InvoiceTemplate.css';

const InvoiceTemplate = () => {
  return (
    <div className="invoice-container">
      {/* Header Section */}
      <header className="invoice-header">
        <div className="company-info">
          <h1>INVOICE SYSTEM</h1>
          <p className="tagline">PROFESSIONAL SERVICES</p>
        </div>
        <div className="invoice-info">
          <h2>INVOICE</h2>
          <div className="invoice-details">
            <p><strong>Invoice #:</strong> ---</p>
            <p><strong>Date:</strong> ---</p>
          </div>
        </div>
      </header>

      {/* From and Bill To Section */}
      <div className="address-section">
        <div className="from-address">
          <h3>From:</h3>
          <p>Your Company Name</p>
          <p>Company Address</p>
          <p>City, State</p>
          <p>PIN: ---</p>
          <p>Country</p>
          <p>GSTIN: ---</p>
          <p>Phone: ---</p>
          <p>Email: ---</p>
        </div>

        <div className="bill-to">
          <h3>Bill To:</h3>
          <p>kamalhasanPenubala</p>
          <p>Employee ID: 1029</p>
          <p>Email: techkamalhasan@gmail.com</p>
          <p>Phone: 999999999999</p>
          <p>Address: Tokyo, Japan</p>
        </div>
      </div>

      {/* Invoice Items Table */}
      <table className="invoice-table">
        <thead>
          <tr>
            <th>SNO</th>
            <th>Description</th>
            <th>Hours</th>
            <th>Unit Price</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="text-center">1</td>
            <td>Login page</td>
            <td className="text-center">2</td>
            <td className="text-right">1000</td>
            <td className="text-right">2000</td>
          </tr>
          <tr>
            <td className="text-center">2</td>
            <td>Dash Board</td>
            <td className="text-center">5</td>
            <td className="text-right">3000</td>
            <td className="text-right">15000</td>
          </tr>
          <tr className="subtotal">
            <td colSpan={3}></td>
            <td className="text-right"><strong>SubTotal</strong></td>
            <td className="text-right">17000</td>
          </tr>
          <tr className="tax">
            <td colSpan={3}></td>
            <td className="text-right">Consumption Tax (10%)</td>
            <td className="text-right">1700</td>
          </tr>
          <tr className="total">
            <td colSpan={3}></td>
            <td className="text-right"><strong>Grand Total</strong></td>
            <td className="text-right"><strong>18700</strong></td>
          </tr>
        </tbody>
      </table>

      {/* Bank Details and Signature */}
      <div className="bank-signature">
        <div className="bank-details">
          <h3>Bank Details:</h3>
          <p>Account Name: Your Account Name</p>
          <p>Account No: ---</p>
          <p>IFSC: ---</p>
          <p>Branch Code: ---</p>
        </div>
        <div className="signature">
          <div className="signature-line"></div>
          <p>Signature</p>
        </div>
      </div>

      {/* Footer */}
      <footer className="footer">
        <p>Thank you for your business!</p>
      </footer>
    </div>
  );
};

export default InvoiceTemplate;
