import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { InvoiceForm } from '../components/InvoiceForm';
import { Invoice } from '../types';
import {
    createInvoice,
    updateInvoice,
    getAllInvoices
} from '../services/apiService';

import { useCountry } from '../contexts/CountryContext';
import { useAuth } from '../contexts/AuthContext';

import { useLocation } from 'react-router-dom';

export const Dashboard: React.FC = () => {
    const { t } = useTranslation();
    const location = useLocation();
    const { country, setCountry } = useCountry();
    const { companyInfo, user } = useAuth();
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [invoices, setInvoices] = useState<Invoice[]>([]);

    // Load invoices to maintain count for ID generation
    React.useEffect(() => {
        loadInvoices();
    }, [user?.id]); // Reload when user changes

    // Check for edit invoice in location state
    React.useEffect(() => {
        const state = location.state as { editInvoice?: Invoice };
        if (state?.editInvoice) {
            setSelectedInvoice(state.editInvoice);
            // Optional: Clear state so refresh doesn't re-select? 
            // Window.history.replaceState clears it but might trigger rerender issues if not careful.
            // For now, persistent on this navigation is fine. 
            // Actually, better to reset it if we navigate away and back? 
            // The browser handles state per history entry.
            // We just need to ensure strict equality check or ID check?
            // React handles it.

            // Just ensure we scroll to form?
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [location.state]);

    const loadInvoices = async () => {
        try {
            // Pass user.id to API for backend processing
            const allInvoices = await getAllInvoices(user?.id);
            // Additional frontend filtering for safety/reactivity
            if (user?.id) {
                const strictInvoices = allInvoices.filter(inv => inv.userId === user.id);
                setInvoices(strictInvoices);
            } else {
                setInvoices([]);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load invoices');
        }
    };

    const handleSaveInvoice = useCallback(async (invoice: Invoice) => {
        try {
            // Ensure invoice has country and userId set
            const invoiceWithData = { ...invoice, country, userId: user?.id };
            if (selectedInvoice) {
                await updateInvoice(selectedInvoice.id, invoiceWithData);
            } else {
                await createInvoice(invoiceWithData);
            }
            setSelectedInvoice(null);
            setError(null);
            // await loadInvoices(); // No need to load if we reload
            alert('Invoice saved successfully! The page will now reload.');
            window.location.reload();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to save invoice';
            setError(errorMessage);
            alert(errorMessage);
        }
    }, [selectedInvoice, country]);

    const handleClearSelection = useCallback(() => {
        setSelectedInvoice(null);
    }, []);

    return (
        <div className="w-full">
            <main className="max-w-5xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
                {/* Country Toggle Switch */}
                <div className="mb-8 bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/40 p-6 ring-1 ring-white/60">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-medium text-gray-700 mb-1">Tax Country</h3>
                            <p className="text-xs text-gray-500">
                                {country === 'india'
                                    ? 'India: CGST & SGST will be applied'
                                    : 'Japan: Consumption Tax will be applied'}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className={`text-sm font-medium ${country === 'india' ? 'text-blue-600' : 'text-gray-400'}`}>
                                India
                            </span>
                            <button
                                type="button"
                                onClick={() => setCountry(country === 'india' ? 'japan' : 'india')}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${country === 'japan' ? 'bg-gradient-to-r from-indigo-500 to-purple-500' : 'bg-gray-200'
                                    }`}
                                role="switch"
                                aria-checked={country === 'japan'}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${country === 'japan' ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                />
                            </button>
                            <span className={`text-sm font-medium ${country === 'japan' ? 'text-blue-600' : 'text-gray-400'}`}>
                                Japan
                            </span>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg shadow-sm">
                        <div className="flex items-center justify-between">
                            <p className="text-red-700 font-medium">{error}</p>
                            <button
                                onClick={() => setError(null)}
                                className="text-red-600 text-sm hover:underline ml-4"
                            >
                                Dismiss
                            </button>
                        </div>
                    </div>
                )}

                {/* Create Invoice Section */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Create New Invoice</h2>
                        <p className="text-gray-600">Fill in the form below to create a new invoice</p>
                    </div>
                    <InvoiceForm
                        onSave={handleSaveInvoice}
                        selectedInvoice={selectedInvoice}
                        clearSelection={handleClearSelection}
                        invoices={invoices}
                    />
                </div>
            </main>
        </div>
    );
};

