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
      name: 'Your Company Name',
      address: [
        'Company Address',
        'City, State',
        'PIN: ---',
        'Country'
      ],
      gstin: 'GSTIN: ---',
      phone: 'Phone: ---',
      email: 'Email: ---'
    },
    billTo: {
      name: 'Customer Name',
      employeeId: '---',
      email: 'customer@example.com',
      phone: '---',
      address: '---'
    },
    items: [
      {
        sno: 1,
        description: 'Service A',
        hours: 0,
        unitPrice: 0,
        amount: 0
      }
    ],
    subtotal: 0,
    taxRate: 0,
    taxAmount: 0,
    grandTotal: 0,
    bankDetails: {
      accountName: 'Your Account Name',
      accountNumber: '---',
      ifsc: '---',
      branchCode: '---'
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
