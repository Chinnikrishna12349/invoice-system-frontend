import React, { useRef } from 'react';
import { useParams } from 'react-router-dom';
import InvoiceLayout from '../components/InvoiceLayout';
import { generateInvoicePDF } from '../../services/pdfService';

const InvoicePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const invoiceRef = useRef<HTMLDivElement>(null);

  // Sample data - replace with actual data from your API
  const invoiceData = {
    invoiceNumber: `OF-INV-${id?.padStart(2, '0') || '01'}`,
    date: new Date().toLocaleDateString('en-US'),
    from: {
      name: 'Ory Folks Pvt Ltd',
      address: [
        'Vedayapalem',
        'Nellore, Andhra Pradesh',
        'PIN: 524004',
        'India'
      ],
      gstin: '29ABCDE1234F1Z5',
      phone: '+91 9876543210',
      email: 'info@oryfolks.com'
    },
    billTo: {
      name: 'kamalhasanPenubala',
      employeeId: '1029',
      email: 'techkamalhasan@gmail.com',
      phone: '999999999999',
      address: 'Tokyo, Japan'
    },
    items: [
      {
        sno: 1,
        description: 'Login page',
        hours: 2,
        unitPrice: 1000,
        amount: 2000
      },
      {
        sno: 2,
        description: 'Dash Board',
        hours: 5,
        unitPrice: 3000,
        amount: 15000
      }
    ],
    subtotal: 17000,
    taxRate: 10,
    taxAmount: 1700,
    grandTotal: 18700,
    bankDetails: {
      accountName: 'Ory Folks Pvt Ltd',
      accountNumber: '123456789012',
      ifsc: 'HDFC0001234',
      branchCode: '01234'
    }
  };

  const handlePrint = async () => {
    try {
      // Create a new window for printing
      const printWindow = window.open('', '_blank');
      if (!printWindow) return;

      // Generate the HTML for printing
      const printContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Invoice ${invoiceData.invoiceNumber}</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              @media print {
                @page { margin: 0; }
                body { margin: 1.6cm; }
                .no-print { display: none !important; }
              }
            </style>
          </head>
          <body>
            <div class="max-w-4xl mx-auto p-8 bg-white">
              ${document.getElementById('invoice-content')?.innerHTML || ''}
            </div>
            <script>
              // Close the window after printing
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                  setTimeout(() => window.close(), 1000);
                }, 500);
              };
            </script>
          </body>
        </html>
      `;

      // Write the content and trigger print
      printWindow.document.write(printContent);
      printWindow.document.close();
    } catch (error) {
      console.error('Print error:', error);
      alert('Failed to open print dialog. Please try again.');
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-end mb-4">
          <button
            onClick={handlePrint}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            Print Invoice
          </button>
        </div>
        
        <div id="invoice-content">
          <InvoiceLayout {...invoiceData} />
        </div>
      </div>
    </div>
  );
};

export default InvoicePage;
