import { formatCurrency, Country, formatDate } from '../../services/countryPreferenceService';
import { useTranslation } from 'react-i18next';

interface InvoiceItem {
  sno: number;
  description: string;
  hours: number;
  unitPrice: number;
  amount: number;
  shift?: string;
  percentage?: number;
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
    ifsc?: string;
    swiftCode?: string;
    bankCode?: string;
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
  signatureUrl?: string; // Added
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
  signatureUrl,
}) => {
  const { t, i18n } = useTranslation();
  const language = i18n.language;

  // Use centralized formatDate
  const formatDateLocal = (dateString: string) => {
    return formatDate(dateString);
  };

  const currencyCode = country === 'japan' ? 'JPY' : country === 'international' ? 'USD' : 'INR';

  return (
    <div className="bg-white mx-auto shadow-2xl overflow-hidden" style={{ width: '210mm', minHeight: '297mm', padding: '18mm 14mm' }}>

      {/* Header Area */}
      <div className="flex justify-between items-start mb-10">
        <div className="w-1/2">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="max-w-[50mm] max-h-[20mm] object-contain" />
          ) : (
            null
          )}
        </div>
        <div className="w-1/2 text-left pl-[26mm] relative">
          {/* Stamp moved to bottom right */}
          <div className="space-y-1">
            <h2 className="text-[10pt] font-bold text-gray-900 leading-tight uppercase tracking-tight">INVOICE # {invoiceNumber}</h2>
            <p className="text-[10pt] font-bold text-gray-900">Date: {formatDateLocal(date)}</p>
          </div>
        </div>
      </div>

      {/* From and Bill To Row */}
      <div className="flex justify-between mb-8 text-[10pt]">
        <div className="w-1/2 pr-4">
          <h3 className="font-bold text-gray-900 mb-1">From:</h3>
          <p className="font-bold text-gray-900 mb-1 break-words">{from.name}</p>
          <div className="text-gray-700 leading-relaxed break-words" style={{ wordBreak: 'break-word' }}>
            {from.address.map((line, index) => (
              <p key={index} className="break-words">{line}</p>
            ))}
            {from.email && <p className="break-words">{from.email}</p>}
          </div>
        </div>
        <div className="w-1/2 pl-[26mm] text-left">
          <h3 className="font-bold text-gray-900 mb-1">Bill To:</h3>
          <p className="font-bold text-gray-900 mb-1 break-words">{billTo.name}</p>
          <div className="text-gray-700 leading-relaxed space-y-1 break-words" style={{ wordBreak: 'break-word' }}>
            {billTo.email && (
              <div className="flex">
                <span className="min-w-[65px] font-normal">Email:</span>
                <span className="break-words">{billTo.email}</span>
              </div>
            )}
            {billTo.phone && (
              <div className="flex">
                <span className="min-w-[65px] font-normal">Phone:</span>
                <span className="break-words">{billTo.phone}</span>
              </div>
            )}
            <div className="flex">
              <span className="min-w-[65px] font-normal">Address:</span>
              <span className="flex-1 break-words" style={{ wordBreak: 'break-word' }}>{billTo.address.replace(/\n/g, ', ')}</span>
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
            <p className="font-bold text-gray-900">Due Date: {formatDateLocal(dueDate)}</p>
          )}
        </div>
      </div>

      {/* Items Table */}
      <div className="mb-8">
        <table className="w-full border-collapse border border-gray-900">
          <thead>
            <tr className="border-b border-gray-900">
              <th className="border-r border-gray-900 p-2 text-center w-[15mm] font-bold text-[10pt]">SNO</th>
              <th className="border-r border-gray-900 p-2 text-center font-bold text-[10pt]">Description</th>
              <th className="border-r border-gray-900 p-2 text-right w-[25mm] font-bold text-[10pt] pr-4">Hours</th>
              <th className="border-r border-gray-900 p-2 text-right w-[35mm] font-bold text-[10pt] pr-4">Unit Price</th>
              <th className="p-2 text-right w-[38mm] font-bold text-[10pt] pr-4">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => {
                return (
                  <tr key={idx} className="border-b border-gray-900 min-h-[12mm]">
                    <td className="border-r border-gray-900 p-2 text-center text-[10pt]">{idx + 1}</td>
                    <td className="border-r border-gray-900 p-2 text-left text-[10pt] whitespace-pre-wrap">{item.description}</td>
                    <td className="border-r border-gray-900 p-2 text-right text-[10pt] pr-4">{item.hours}</td>
                    <td className="border-r border-gray-900 p-2 text-right text-[10pt] pr-4">{formatCurrency(item.unitPrice, country, true, false)}</td>
                    <td className="p-2 text-right text-[10pt] pr-4">{formatCurrency(item.amount, country, true, false)}</td>
                  </tr>
                );
            })}
            {/* Totals Section */}
            <tr className="border-b border-gray-900">
              <td colSpan={4} className="border-r border-gray-900 p-2 text-left font-bold text-[10pt]">SubTotal</td>
              <td className="p-2 text-right text-[10pt] pr-4 font-bold">{formatCurrency(subtotal, country, true, false)}</td>
            </tr>
            {country === 'india' ? (
              <>
                <tr className="border-b border-gray-900">
                  <td colSpan={4} className="border-r border-gray-900 p-2 text-left font-bold text-[10pt]">CGST ({cgstRate ?? (taxRate / 2)}%)</td>
                  <td className="p-2 text-right text-[10pt] pr-4 font-bold">{formatCurrency(Math.round((subtotal * ((cgstRate ?? (taxRate / 2)) / 100)) * 100) / 100, country, true, false)}</td>
                </tr>
                <tr className="border-b border-gray-900">
                  <td colSpan={4} className="border-r border-gray-900 p-2 text-left font-bold text-[10pt]">SGST ({sgstRate ?? (taxRate / 2)}%)</td>
                  <td className="p-2 text-right text-[10pt] pr-4 font-bold">{formatCurrency(Math.round((subtotal * ((sgstRate ?? (taxRate / 2)) / 100)) * 100) / 100, country, true, false)}</td>
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
        <div className="text-[10pt]">
          {(() => {
            const hasBankDetails = bankDetails && Object.values(bankDetails).some(v => v && v.toString().trim().length > 0);
            if (!hasBankDetails) return null;

            const isIndia = country === 'india';
            const isInternational = country === 'international';
            const isJapanLocal = country === 'japan';
            const swift = bankDetails.swiftCode?.trim();
            const ifsc = bankDetails.ifsc?.trim();
            const showSwift = isInternational || (isJapanLocal && swift);

            const details = [
                { label: t('payment.bankName', 'Bank Name'), value: bankDetails.bankName },
                { label: t('payment.bankCode', 'Bank Code'), value: bankDetails.bankCode },
                { label: t('payment.branchName', 'Branch Name'), value: bankDetails.branchName },
                { label: t('payment.branchCode', 'Branch Code'), value: bankDetails.branchCode },
                { label: t('payment.accountType', 'Account Type'), value: bankDetails.accountType },
                { label: t('payment.accountNumber', 'Account No'), value: bankDetails.accountNumber },
                { label: t('payment.accountName', 'Account Name'), value: bankDetails.accountName },
                ...((showSwift) ? [{ label: t('payment.swiftCode', 'SWIFT Code'), value: swift }] : []),
                ...(isIndia && language !== 'ja' ? [{ label: t('payment.ifsc', 'IFSC'), value: ifsc }] : [])
            ];

            const validDetails = details.filter(item => item.value && item.value.toString().trim().length > 0);
            const labelWidthClass = language === 'ja' ? "min-w-[135px]" : "min-w-[113px]";

            return (
              <>
                <h3 className="font-bold text-[11pt] mb-3">{t('payment.instructions', 'Bank Details:')}</h3>
                <div className="space-y-[1.5px]">
                  {validDetails.map((item, index) => {
                    const labelText = item.label.replace(/[：:]/g, '');
                    return (
                      <p key={index} className="flex leading-tight">
                        <span className={labelWidthClass}>{labelText}</span>
                        <span className="min-w-[15px]">:</span>
                        <span>{item.value}</span>
                      </p>
                    );
                  })}
                </div>
              </>
            );
          })()}
        </div>

        {/* Signature Section (Right) - Horizontally aligned with Account Holder row */}
        <div className="w-[80mm] text-center relative mb-4">
          {((isVisionAI && stampUrl) || signatureUrl) && (
            <img
              src={signatureUrl || stampUrl}
              alt="Signature"
              className="absolute left-1/2 -translate-x-1/2 -top-[19mm] w-[30mm] h-[18mm] object-contain opacity-90 z-10"
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
