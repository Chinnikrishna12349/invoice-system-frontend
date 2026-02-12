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
  poNumber?: string;
  date: string;
  dueDate?: string; // Added
  from: {
    name: string;
    address: string[];
    gstin?: string;
    phone?: string;
    email?: string;
  };
  billTo: {
    name: string;
    email?: string;
    phone?: string;
    address: string;
  };
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  grandTotal: number;
  roundOff?: number; // Added
  bankDetails: {
    bankName: string; // Added
    accountName: string;
    accountNumber: string;
    ifsc: string;
    swiftCode?: string;
    branchName?: string;
    branchCode: string;
    accountType?: string;
  };
  country?: Country;
  cgstRate?: number;
  sgstRate?: number;
  logoUrl?: string; // Added
  stampUrl?: string; // Added
  isVisionAI?: boolean; // Added
}

const InvoiceLayout: React.FC<InvoiceLayoutProps> = ({
  invoiceNumber,
  poNumber,
  date,
  dueDate,
  from,
  billTo,
  items,
  subtotal,
  taxRate,
  taxAmount,
  grandTotal,
  roundOff,
  bankDetails,
  country = 'india',
  cgstRate,
  sgstRate,
  logoUrl,
  stampUrl,
  isVisionAI,
}) => {
  // Format date as DD/MM/YYYY to match PDF
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const currencyCode = country === 'japan' ? 'JPY' : 'INR';

  return (
    <div className="bg-white mx-auto shadow-2xl overflow-hidden" style={{ width: '210mm', minHeight: '297mm', padding: '18mm 14mm' }}>

      {/* Header Area */}
      <div className="flex justify-between items-start mb-10">
        <div className="w-1/2">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="max-w-[50mm] max-h-[25mm] object-contain" />
          ) : (
            <div>
              <h1 className="text-2xl font-bold text-gray-800">ORY FOLKS</h1>
              <p className="text-gray-600">ASPIRING INTELLIGENCE</p>
            </div>
          )}
        </div>
        <div className="w-1/2 text-left pl-[26mm] relative">
          {/* Stamp moved to bottom right */}
          <div className="space-y-1">
            <h2 className="text-[10pt] font-bold text-gray-900 leading-tight uppercase tracking-tight">INVOICE # {invoiceNumber}</h2>
            <p className="text-[10pt] font-bold text-gray-900">Date: {formatDate(date)}</p>
          </div>
        </div>
      </div>

      {/* From and Bill To Row */}
      <div className="flex justify-between mb-8 text-[10pt]">
        <div className="w-1/2 pr-4">
          <h3 className="font-bold text-gray-900 mb-1">From:</h3>
          <p className="font-bold text-gray-900 mb-1">{from.name}</p>
          <div className="text-gray-700 leading-relaxed">
            {from.address.map((line, index) => (
              <p key={index}>{line}</p>
            ))}
            {from.email && <p>{from.email}</p>}
          </div>
        </div>
        <div className="w-1/2 pl-[26mm] text-left">
          <h3 className="font-bold text-gray-900 mb-1">Bill To:</h3>
          <p className="font-bold text-gray-900 mb-1">{billTo.name}</p>
          <div className="text-gray-700 leading-relaxed space-y-1">
            {billTo.email && (
              <div className="flex">
                <span className="min-w-[65px] font-normal">Email:</span>
                <span>{billTo.email}</span>
              </div>
            )}
            {billTo.phone && (
              <div className="flex">
                <span className="min-w-[65px] font-normal">Phone:</span>
                <span>{billTo.phone}</span>
              </div>
            )}
            <div className="flex">
              <span className="min-w-[65px] font-normal">Address:</span>
              <span className="flex-1">{billTo.address.replace(/\n/g, ', ')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* PO and Due Date Row */}
      <div className="flex justify-between mb-10 text-[10pt]">
        <div className="w-1/2">
          {poNumber && (
            <p className="font-bold text-gray-900">PO Number: {poNumber}</p>
          )}
        </div>
        <div className="w-1/2 pl-[26mm]">
          {dueDate && (
            <p className="font-bold text-gray-900">Due Date: {formatDate(dueDate)}</p>
          )}
        </div>
      </div>

      {/* Items Table */}
      <div className="mb-8">
        <table className="w-full border-collapse border border-gray-900">
          <thead>
            <tr className="border-b border-gray-900">
              <th className="border-r border-gray-900 p-2 text-center w-[16mm] font-bold text-[10pt]">SNO</th>
              <th className="border-r border-gray-900 p-2 text-center font-bold text-[10pt]">Description</th>
              <th className="border-r border-gray-900 p-2 text-right w-[25mm] font-bold text-[10pt] pr-4">Hours</th>
              <th className="border-r border-gray-900 p-2 text-right w-[30mm] font-bold text-[10pt] pr-4">Unit Price</th>
              <th className="p-2 text-right w-[31mm] font-bold text-[10pt] pr-4">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx} className="border-b border-gray-900 min-h-[12mm]">
                <td className="border-r border-gray-900 p-2 text-center text-[10pt]">{idx + 1}</td>
                <td className="border-r border-gray-900 p-2 text-center text-[10pt] whitespace-pre-wrap">{item.description}</td>
                <td className="border-r border-gray-900 p-2 text-right text-[10pt] pr-4">{item.hours}</td>
                <td className="border-r border-gray-900 p-2 text-right text-[10pt] pr-4">{formatCurrency(item.unitPrice, country, true, false)}</td>
                <td className="p-2 text-right text-[10pt] pr-4">{formatCurrency(item.amount, country, true, false)}</td>
              </tr>
            ))}
            {/* Totals Section */}
            <tr className="border-b border-gray-900">
              <td colSpan={4} className="border-r border-gray-900 p-2 text-left font-bold text-[10pt]">SubTotal</td>
              <td className="p-2 text-right text-[10pt] pr-4 font-bold">{formatCurrency(subtotal, country, true, false)}</td>
            </tr>
            {country === 'india' ? (
              <>
                <tr className="border-b border-gray-900">
                  <td colSpan={4} className="border-r border-gray-900 p-2 text-left font-bold text-[10pt]">CGST ({cgstRate ?? (taxRate / 2)}%)</td>
                  <td className="p-2 text-right text-[10pt] pr-4 font-bold">{formatCurrency(subtotal * ((cgstRate ?? (taxRate / 2)) / 100), country, true, false)}</td>
                </tr>
                <tr className="border-b border-gray-900">
                  <td colSpan={4} className="border-r border-gray-900 p-2 text-left font-bold text-[10pt]">SGST ({sgstRate ?? (taxRate / 2)}%)</td>
                  <td className="p-2 text-right text-[10pt] pr-4 font-bold">{formatCurrency(subtotal * ((sgstRate ?? (taxRate / 2)) / 100), country, true, false)}</td>
                </tr>
              </>
            ) : (
              taxAmount > 0 && (
                <tr className="border-b border-gray-900">
                  <td colSpan={4} className="border-r border-gray-900 p-2 text-left font-bold text-[10pt]">Consumption Tax ({taxRate}%)</td>
                  <td className="p-2 text-right text-[10pt] pr-4 font-bold">{formatCurrency(taxAmount, country, true, false)}</td>
                </tr>
              )
            )}
            {roundOff !== undefined && roundOff !== 0 && (
              <tr className="border-b border-gray-900">
                <td colSpan={4} className="border-r border-gray-900 p-2 text-left font-bold text-[10pt]">Round Off</td>
                <td className="p-2 text-right text-[10pt] pr-4 font-bold">{formatCurrency(roundOff, country, true, false)}</td>
              </tr>
            )}
            <tr className="border-b border-gray-900">
              <td colSpan={4} className="border-r border-gray-900 p-2 text-left font-bold text-[10pt]">Grand Total ({currencyCode})</td>
              <td className="p-2 text-right text-[10pt] pr-4 font-bold">{formatCurrency(grandTotal, country, true, false)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Footer: Bank Details and Signature horizontally aligned */}
      <div className="mt-12 flex justify-between items-end">
        {/* Bank Details (Left) */}
        <div className="text-[10pt] space-y-1">
          <h3 className="font-bold text-[11pt] mb-3">Bank Details:</h3>
          {bankDetails.bankName && (
            <p className="flex gap-1 leading-tight">
              <span className="min-w-[166px]">Bank Name:</span>
              <span>{bankDetails.bankName}</span>
            </p>
          )}

          {bankDetails.branchName && (
            <p className="flex gap-1 leading-tight">
              <span className="min-w-[166px]">Branch:</span>
              <span>{bankDetails.branchName}</span>
            </p>
          )}

          {bankDetails.branchCode && (
            <p className="flex gap-1 leading-tight">
              <span className="min-w-[166px]">Branch Code:</span>
              <span>{bankDetails.branchCode}</span>
            </p>
          )}

          {bankDetails.accountType && (
            <p className="flex gap-1 leading-tight">
              <span className="min-w-[166px]">Account Type:</span>
              <span>{bankDetails.accountType}</span>
            </p>
          )}

          {bankDetails.accountNumber && (
            <p className="flex gap-1 leading-tight">
              <span className="min-w-[166px]">Account No:</span>
              <span>{bankDetails.accountNumber}</span>
            </p>
          )}

          {bankDetails.accountName && (
            <p className="flex gap-1 leading-tight">
              <span className="min-w-[166px]">Account Holder:</span>
              <span>{bankDetails.accountName}</span>
            </p>
          )}

          {(() => {
            const isJapan = country === 'japan';
            const swift = bankDetails.swiftCode?.trim();
            const ifsc = bankDetails.ifsc?.trim();

            if (isJapan || (swift && swift.length > 0)) {
              const codeValue = (swift && swift.length > 0) ? swift : ifsc;
              if (!codeValue) return null;
              return (
                <p className="flex gap-1 leading-tight">
                  <span className="min-w-[166px]">Swift Code:</span>
                  <span>{codeValue}</span>
                </p>
              );
            } else if (ifsc && ifsc.length > 0) {
              return (
                <p className="flex gap-1 leading-tight">
                  <span className="min-w-[166px]">IFSC Code:</span>
                  <span>{ifsc}</span>
                </p>
              );
            }
            return null;
          })()}
        </div>

        {/* Signature Section (Right) - Horizontally aligned with Account Holder row */}
        <div className="w-[80mm] text-center relative mb-4">
          {isVisionAI && stampUrl && (
            <img
              src={stampUrl}
              alt="Stamp"
              className="absolute left-1/2 -translate-x-1/2 -top-[19mm] w-[18mm] h-[18mm] opacity-90 z-10"
            />
          )}
          <div className="border-t border-gray-900 pt-2">
            <p className="font-bold text-[10pt]">Authorised Signature</p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default InvoiceLayout;
