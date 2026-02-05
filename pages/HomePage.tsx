import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { InvoiceForm } from '../components/InvoiceForm';
import { Invoice } from '../types';
import {
    createInvoice,
    updateInvoice,
    getAllInvoices
} from '../services/apiService';

export const HomePage: React.FC = () => {
    const { t } = useTranslation();
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [invoices, setInvoices] = useState<Invoice[]>([]);

    // Load invoices
    React.useEffect(() => {
        getAllInvoices()
            .then(data => setInvoices(data || []))
            .catch(() => setInvoices([]));
    }, []);

    const handleSaveInvoice = useCallback(async (invoice: Invoice) => {
        try {
            if (selectedInvoice) {
                await updateInvoice(selectedInvoice.id, invoice);
            } else {
                await createInvoice(invoice);
            }
            setSelectedInvoice(null);
            setError(null);
            alert('Invoice saved successfully!');
            // Reload to update numbering
            window.location.reload();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to save invoice';
            setError(errorMessage);
            alert(errorMessage);
        }
    }, [selectedInvoice]);

    const handleClearSelection = useCallback(() => {
        setSelectedInvoice(null);
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
            <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
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
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
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

