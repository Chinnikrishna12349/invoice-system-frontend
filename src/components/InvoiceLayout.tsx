import React from 'react';
import { formatCurrency, Country } from '../../services/countryPreferenceService';

interface InvoiceItem {
  sno: number;
  description: string;
  hours: number;
  unitPrice: number;
  amount: number;
}

interface InvoiceLayoutProps {
  invoiceNumber: string;
  date: string;
  from: {
    name: string;
    address: string[];
    gstin: string;
    phone: string;
    email: string;
  };
  billTo: {
    name: string;
    employeeId: string;
    email: string;
    phone: string;
    address: string;
  };
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  grandTotal: number;
  bankDetails: {
    accountName: string;
    accountNumber: string;
    ifsc: string;
    branchCode: string;
  };
  country?: Country;
}

const InvoiceLayout: React.FC<InvoiceLayoutProps> = ({
  invoiceNumber,
  date,
  from,
  billTo,
  items,
  subtotal,
  taxRate,
  taxAmount,
  grandTotal,
  bankDetails,
  country = 'india',
}) => {
  return (
    <div className="bg-white p-8 rounded-lg shadow-sm">

      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div className="text-left">
          <h1 className="text-2xl font-bold text-gray-800">ORY FOLKS</h1>
          <p className="text-gray-600">ASPIRING INTELLIGENCE</p>
        </div>
        <div className="text-right">
          <h2 className="text-xl font-bold text-gray-800">Invoice</h2>
          <p className="text-gray-600">#{invoiceNumber}</p>
          <p className="text-gray-600">Date: {date}</p>
        </div>
      </div>

      {/* From and Bill To */}
      <div className="flex justify-between mb-8">
        <div className="w-1/2 pr-4">
          <h3 className="font-semibold text-gray-700">From:</h3>
          <p className="font-semibold">{from.name}</p>
          {from.address.map((line, index) => (
            <p key={index} className="text-gray-600">
              {line}
            </p>
          ))}
          <p className="text-gray-600">GSTIN: {from.gstin}</p>
          <p className="text-gray-600">Phone: {from.phone}</p>
          <p className="text-gray-600">Email: {from.email}</p>
        </div>
        <div className="w-1/2 pl-4 text-right">
          <h3 className="font-semibold text-gray-700">Bill To:</h3>
          <p className="font-semibold">{billTo.name}</p>
          <p className="text-gray-600">Employee ID: {billTo.employeeId}</p>
          <p className="text-gray-600">Email: {billTo.email}</p>
          <p className="text-gray-600">Phone: {billTo.phone}</p>
          <p className="text-gray-600">{billTo.address}</p>
        </div>
      </div>

      {/* Invoice Items Table */}
      <div className="mb-8">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 p-2 text-left">SNO</th>
              <th className="border border-gray-300 p-2 text-left">Description</th>
              <th className="border border-gray-300 p-2 text-right">Hours</th>
              <th className="border border-gray-300 p-2 text-right">Unit Price</th>
              <th className="border border-gray-300 p-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.sno}>
                <td className="border border-gray-300 p-2">{item.sno}</td>
                <td className="border border-gray-300 p-2">{item.description}</td>
                <td className="border border-gray-300 p-2 text-right">{item.hours}</td>
                <td className="border border-gray-300 p-2 text-right">
                  {formatCurrency(item.unitPrice, country)}
                </td>
                <td className="border border-gray-300 p-2 text-right">
                  {formatCurrency(item.amount, country)}
                </td>
              </tr>
            ))}
            <tr>
              <td colSpan={4} className="border border-gray-300 p-2 text-right font-semibold">
                SubTotal
              </td>
              <td className="border border-gray-300 p-2 text-right">
                {formatCurrency(subtotal, country)}
              </td>
            </tr>
            <tr>
              <td colSpan={4} className="border border-gray-300 p-2 text-right">
                Consumption Tax ({taxRate}%)
              </td>
              <td className="border border-gray-300 p-2 text-right">
                {formatCurrency(taxAmount, country)}
              </td>
            </tr>
            <tr className="bg-gray-50">
              <td colSpan={4} className="border border-gray-300 p-2 text-right font-bold">
                Grand Total
              </td>
              <td className="border border-gray-300 p-2 text-right font-bold">
                {formatCurrency(grandTotal, country)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Bank Details and Signature */}
      <div className="flex justify-between mb-8">
        <div className="w-1/2 pr-4">
          <h3 className="font-semibold text-gray-700">Bank Details:</h3>
          <p className="text-gray-600">Account Name: {bankDetails.accountName}</p>
          <p className="text-gray-600">Account No: {bankDetails.accountNumber}</p>
          <p className="text-gray-600">IFSC: {bankDetails.ifsc}</p>
          <p className="text-gray-600">Branch Code: {bankDetails.branchCode}</p>
        </div>
        <div className="w-1/2 pl-4 flex flex-col items-end">
          <div className="mt-8">
            <p className="text-gray-600 border-t-2 border-gray-300 pt-2 inline-block">
              Signature: __________
            </p>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="text-center py-4 border-t border-gray-300">
        <p className="text-gray-600 italic">Thank you for your business!</p>
      </div>
    </div>
  );
};

export default InvoiceLayout;
