
import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Invoice } from '../types';
import { calculateTax, formatCurrency } from '../services/countryPreferenceService';
import { ICONS } from '../constants';
import { sendInvoiceByEmail } from "../services/apiService";
import { SendEmailModal } from './SendEmailModal';

interface InvoiceListProps {
    invoices: Invoice[];
    onEdit?: (invoice: Invoice) => void;
    onDelete: (id: string) => void;
    onDownload: (invoice: Invoice) => void;
}

export const InvoiceList: React.FC<InvoiceListProps> = ({ invoices, onEdit, onDelete, onDownload }) => {
    const { t } = useTranslation();
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    const [emailInvoice, setEmailInvoice] = useState<Invoice | null>(null);

    const handleSendEmailClick = (invoice: Invoice) => {
        if (!invoice.employeeEmail || !invoice.employeeEmail.trim()) {
            alert('This invoice does not have an email address.');
            return;
        }
        setEmailInvoice(invoice);
        setIsEmailModalOpen(true);
    };

    const handleConfirmSend = async (additionalEmails: string[]) => {
        if (!emailInvoice) return;

        try {
            await sendInvoiceByEmail(emailInvoice.id, emailInvoice, 'en', additionalEmails);
            const recipientText = emailInvoice.employeeEmail + (additionalEmails.length > 0 ? ` and ${additionalEmails.length} others` : '');
            alert(`Invoice sent successfully to ${recipientText}!`);
        } catch (error: any) {
            console.error('Error sending email:', error);
            throw error; // Re-throw so modal can show error
        }
    };


    const sortedInvoices = useMemo(() => {
        return [...invoices].sort((a, b) => {
            const aNum = a.invoiceNumber || '';
            const bNum = b.invoiceNumber || '';

            // Extract prefix and number
            const aMatch = aNum.match(/^([a-zA-Z-]*?)(\d+)$/);
            const bMatch = bNum.match(/^([a-zA-Z-]*?)(\d+)$/);

            if (aMatch && bMatch) {
                const aPrefix = aMatch[1];
                const bPrefix = bMatch[1];
                const aSuffix = parseInt(aMatch[2], 10);
                const bSuffix = parseInt(bMatch[2], 10);

                if (aPrefix !== bPrefix) {
                    return aPrefix.localeCompare(bPrefix);
                }
                return aSuffix - bSuffix;
            }

            // Fallback to simple locale compare
            return aNum.localeCompare(bNum);
        });
    }, [invoices]);

    const calculateTotal = (invoice: Invoice) => {
        if (invoice.finalAmount !== undefined) {
            return invoice.finalAmount;
        }

        const subTotal = invoice.services?.reduce((acc, service) =>
            acc + (service.hours * service.rate), 0) || 0;

        const taxCalculation = calculateTax(
            subTotal,
            invoice.taxRate || 0,
            invoice.country,
            invoice.cgstRate,
            invoice.sgstRate
        );
        return taxCalculation.grandTotal;
    };

    if (invoices.length === 0) {
        return (
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/40 p-12 text-center ring-1 ring-white/60">
                <div className="text-4xl mb-4">📭</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('app.status.noInvoices')}</h3>
                <p className="text-gray-500">{t('app.status.createFirst')}</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">

            <div className="bg-white/80 backdrop-blur-xl shadow-xl ring-1 ring-white/60 sm:rounded-3xl overflow-hidden border border-white/40">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Invoice</th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Client</th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Date</th>
                                <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Amount</th>
                                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                                    <span className="sr-only">Actions</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {sortedInvoices.map((invoice) => (
                                <tr key={invoice.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-blue-600 sm:pl-6">
                                        {invoice.invoiceNumber}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                                        <div className="font-medium">{invoice.employeeName}</div>
                                        <div className="text-gray-500 text-xs">{invoice.employeeEmail}</div>
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                        {new Date(invoice.date).toLocaleDateString()}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-right font-medium text-gray-900">
                                        {formatCurrency(calculateTotal(invoice), invoice.country, false)}
                                    </td>
                                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                        <div className="flex items-center justify-end gap-2">
                                            {onEdit && (
                                                <button
                                                    onClick={() => onEdit(invoice)}
                                                    className="text-gray-400 hover:text-blue-600 transition-colors p-1"
                                                    title="Edit"
                                                >
                                                    {ICONS.EDIT}
                                                </button>
                                            )}
                                            <button
                                                onClick={() => onDownload(invoice)}
                                                className="text-gray-400 hover:text-blue-600 transition-colors p-1"
                                                title="Download PDF"
                                            >
                                                {ICONS.DOWNLOAD}
                                            </button>
                                            <button
                                                onClick={() => handleSendEmailClick(invoice)}
                                                className="text-gray-400 hover:text-blue-600 transition-colors p-1"
                                                title="Email Invoice"
                                            >
                                                {ICONS.EMAIL}
                                            </button>
                                            <button
                                                onClick={() => onDelete(invoice.id)}
                                                className="text-gray-400 hover:text-red-600 transition-colors p-1"
                                                title="Delete"
                                            >
                                                {ICONS.DELETE}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {emailInvoice && (
                <SendEmailModal
                    isOpen={isEmailModalOpen}
                    onClose={() => setIsEmailModalOpen(false)}
                    onSend={handleConfirmSend}
                    invoice={emailInvoice}
                />
            )}
        </div>
    );
};
