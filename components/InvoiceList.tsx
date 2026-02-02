
import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Invoice } from '../types';
import { calculateTax } from '../services/countryPreferenceService';
import { ICONS } from '../constants';
import { sendInvoiceByEmail } from "../services/apiService";

interface InvoiceListProps {
    invoices: Invoice[];
    onEdit?: (invoice: Invoice) => void;
    onDelete: (id: string) => void;
    onDownload: (invoice: Invoice) => void;
}

export const InvoiceList: React.FC<InvoiceListProps> = ({ invoices, onEdit, onDelete, onDownload }) => {
    const { t } = useTranslation();
    const [searchQuery, setSearchQuery] = useState('');

    const handleSendEmail = async (id: string) => {
        try {
            const invoice = invoices.find(inv => inv.id === id);
            if (!invoice) {
                alert(t('form.invoiceNotFound'));
                return;
            }

            if (!invoice.employeeEmail || !invoice.employeeEmail.trim()) {
                alert('This invoice does not have an email address.');
                return;
            }

            if (window.confirm(`Send invoice to ${invoice.employeeEmail}?`)) {
                await sendInvoiceByEmail(id, invoice);
                alert(`Invoice sent successfully to ${invoice.employeeEmail}!`);
            }
        } catch (error: any) {
            console.error('Error sending email:', error);
            alert(`Failed to send email: ${error?.message || t('form.emailError')}`);
        }
    };

    const filteredInvoices = useMemo(() => {
        if (!searchQuery.trim()) return invoices;
        const query = searchQuery.toLowerCase().trim();
        return invoices.filter(invoice =>
            invoice.invoiceNumber.toLowerCase().includes(query) ||
            invoice.employeeName.toLowerCase().includes(query) ||
            invoice.employeeEmail.toLowerCase().includes(query)
        );
    }, [invoices, searchQuery]);

    const sortedInvoices = filteredInvoices.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const calculateTotal = (invoice: Invoice) => {
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
            {/* Search Bar - Could be moved to parent or kept here */}
            {invoices.length > 0 && (
                <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        className="block w-full rounded-lg border-0 py-2.5 pl-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                        placeholder="Search invoices..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            )}

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
                                        {invoice.country === 'japan' ? '¥' : '₹'} {calculateTotal(invoice).toFixed(2)}
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
                                                onClick={() => handleSendEmail(invoice.id)}
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
                {sortedInvoices.length === 0 && searchQuery && (
                    <div className="text-center py-12">
                        <p className="text-gray-500">{t('app.status.noResults')}</p>
                        <button
                            onClick={() => setSearchQuery('')}
                            className="mt-2 text-blue-600 hover:text-blue-500 text-sm font-medium"
                        >
                            Clear search
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
