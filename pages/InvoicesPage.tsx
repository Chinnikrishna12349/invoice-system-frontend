import React, { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { InvoiceList } from '../components/InvoiceList';
import { Invoice } from '../types';
import { generateInvoicePDF } from '../services/pdfService';
import { Modal } from '../components/Modal';
import { useAuth } from '../contexts/AuthContext';
import {
    deleteInvoice,
    getAllInvoices
} from '../services/apiService';

export const InvoicesPage: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { companyInfo, user } = useAuth();
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [invoiceToDelete, setInvoiceToDelete] = useState<string | null>(null);
    const [showLanguageModal, setShowLanguageModal] = useState(false);
    const [selectedLangInvoice, setSelectedLangInvoice] = useState<Invoice | null>(null);
    const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'ja'>('en');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [dateFilterType, setDateFilterType] = useState<'day' | 'month'>('day');

    const loadInvoices = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            // Pass user.id to API for backend isolation
            const response = await getAllInvoices(user?.id);
            setInvoices(response);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to load invoices';
            console.error('Error loading invoices:', errorMessage);
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadInvoices();
    }, [loadInvoices, user?.id]);

    const handleDeleteClick = useCallback((id: string) => {
        setInvoiceToDelete(id);
        setIsDeleteModalOpen(true);
    }, []);

    const confirmDelete = useCallback(async () => {
        if (invoiceToDelete) {
            try {
                await deleteInvoice(invoiceToDelete);
                setInvoices(prev => prev.filter(inv => inv.id !== invoiceToDelete));
                setError(null);
                alert('Invoice deleted successfully!');
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Failed to delete invoice';
                setError(errorMessage);
                alert(errorMessage);
            }
        }
        setIsDeleteModalOpen(false);
        setInvoiceToDelete(null);
    }, [invoiceToDelete]);

    const handleDownloadClick = useCallback((invoice: Invoice) => {
        setSelectedLangInvoice(invoice);
        setShowLanguageModal(true);
    }, []);

    const handleDownload = useCallback((language: 'en' | 'ja') => {
        if (selectedLangInvoice) {
            // Use the snapshot company info from the invoice if available, otherwise fall back to user's current company info
            const invoiceCompanyInfo = selectedLangInvoice.companyInfo || companyInfo;

            generateInvoicePDF(selectedLangInvoice, language, invoiceCompanyInfo).catch((error) => {
                console.error('Error generating PDF:', error);
                alert('Failed to generate PDF. Please try again.');
            });
            setShowLanguageModal(false);
            setSelectedLangInvoice(null);
        }
    }, [selectedLangInvoice, companyInfo]);

    const handleCloseLanguageModal = useCallback(() => {
        setShowLanguageModal(false);
        setSelectedLangInvoice(null);
    }, []);

    // Filter invoices based on search term and date
    const filteredInvoices = invoices.filter(invoice => {
        // Text search filter
        const searchLower = searchTerm.toLowerCase();
        const matchesText = !searchTerm || (
            invoice.invoiceNumber.toLowerCase().includes(searchLower) ||
            invoice.employeeName.toLowerCase().includes(searchLower) ||
            invoice.employeeEmail.toLowerCase().includes(searchLower)
        );

        // Date filter
        let matchesDate = true;
        if (selectedDate) {
            try {
                const invoiceDate = new Date(invoice.date);
                const filterDate = new Date(selectedDate);

                if (dateFilterType === 'day') {
                    // Filter by specific day
                    matchesDate = invoiceDate.toDateString() === filterDate.toDateString();
                } else if (dateFilterType === 'month') {
                    // Filter by month and year
                    matchesDate = invoiceDate.getMonth() === filterDate.getMonth() &&
                        invoiceDate.getFullYear() === filterDate.getFullYear();
                }
            } catch (error) {
                // If date parsing fails, don't filter by date
                matchesDate = true;
            }
        }

        return matchesText && matchesDate;
    });

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
            <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
                {/* Header Section */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                            {/* Back Arrow Button */}
                            <button
                                onClick={() => navigate(-1)}
                                className="p-2 rounded-lg font-medium transition-all duration-200 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                                title="Go back"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                            </button>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">All Invoices</h1>
                                <p className="text-gray-600">View and manage all your invoices</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-lg border border-blue-200">
                            <span className="text-2xl font-bold text-blue-600">{invoices.length}</span>
                            <span className="text-sm text-gray-600 font-medium">{t('invoice.title')}s</span>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 relative">
                        <div className="flex items-center gap-4">
                            {/* Text Search */}
                            <div className="relative flex-1">
                                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input
                                    type="text"
                                    placeholder="Search by invoice number, employee name, email, or ID..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            {/* Date Filter - Calendar Icon in Right Corner */}
                            <div className="flex items-center gap-2">
                                {selectedDate && (
                                    <button
                                        onClick={() => setSelectedDate('')}
                                        className="px-2 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                                        title="Clear date filter"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                )}
                                <div className="relative">
                                    <input
                                        type="date"
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                        className="hidden"
                                        id="date-picker-input"
                                    />
                                    <label
                                        htmlFor="date-picker-input"
                                        className={`flex items-center justify-center w-10 h-10 rounded-lg border transition-all cursor-pointer ${selectedDate
                                            ? 'bg-blue-50 border-blue-500 text-blue-600'
                                            : 'border-gray-300 text-gray-400 hover:border-gray-400 hover:text-gray-500'
                                            }`}
                                        title="Select date"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </label>
                                </div>
                            </div>
                        </div>
                        {(searchTerm || selectedDate) && (
                            <div className="mt-3 flex items-center justify-between">
                                <p className="text-sm text-gray-600">
                                    Showing <span className="font-semibold text-blue-600">{filteredInvoices.length}</span> of <span className="font-semibold">{invoices.length}</span> invoices
                                </p>
                                {(searchTerm || selectedDate) && (
                                    <button
                                        onClick={() => {
                                            setSearchTerm('');
                                            setSelectedDate('');
                                        }}
                                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                                    >
                                        Clear all filters
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {error && (
                    <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg shadow-sm">
                        <div className="flex items-center justify-between">
                            <p className="text-red-700 font-medium">Error: {error}</p>
                            <button
                                onClick={() => setError(null)}
                                className="text-red-600 text-sm hover:underline ml-4"
                            >
                                Dismiss
                            </button>
                        </div>
                    </div>
                )}

                {/* Invoices List */}
                {isLoading ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                        <div className="text-4xl mb-3 animate-spin">⏳</div>
                        <p className="text-lg text-gray-600 font-medium">Loading invoices...</p>
                    </div>
                ) : filteredInvoices.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                        <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-lg text-gray-600 font-medium mb-2">
                            {searchTerm ? 'No invoices found matching your search' : 'No invoices yet'}
                        </p>
                        <p className="text-sm text-gray-500">
                            {searchTerm ? 'Try adjusting your search terms' : 'Create your first invoice from the home page'}
                        </p>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <InvoiceList
                            invoices={filteredInvoices}
                            onEdit={(invoice) => {
                                // Navigate to dashboard with invoice data to pre-fill the form
                                navigate('/dashboard', { state: { editInvoice: invoice } });
                            }}
                            onDelete={handleDeleteClick}
                            onDownload={handleDownloadClick}
                        />
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                <Modal
                    isOpen={isDeleteModalOpen}
                    onClose={() => setIsDeleteModalOpen(false)}
                    onConfirm={confirmDelete}
                    title={t('form.deleteConfirm')}
                    description={t('form.deleteConfirmDesc')}
                />

                {/* Language Selection Modal */}
                <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 transition-opacity duration-200 ${showLanguageModal ? 'opacity-100 z-50' : 'opacity-0 -z-10 pointer-events-none'}`}>
                    <div className={`bg-white rounded-xl shadow-2xl p-6 w-full max-w-md transform transition-all duration-200 ${showLanguageModal ? 'scale-100' : 'scale-95'}`}>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('download.selectLanguage')}</h3>
                        <p className="text-sm text-gray-600 mb-4">{t('download.selectLanguageDesc')}</p>
                        <div className="space-y-3 mb-6">
                            <button
                                onClick={() => setSelectedLanguage('en')}
                                className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-colors ${selectedLanguage === 'en' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}
                            >
                                <span className="font-medium">{t('download.english')}</span>
                                <span className="text-sm text-gray-500 block mt-1">{t('download.englishDesc')}</span>
                            </button>
                            <button
                                onClick={() => setSelectedLanguage('ja')}
                                className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-colors ${selectedLanguage === 'ja' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}
                            >
                                <span className="font-medium">{t('download.japanese')}</span>
                                <span className="text-sm text-gray-500 block mt-1">{t('download.japaneseDesc')}</span>
                            </button>
                        </div>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={handleCloseLanguageModal}
                                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                {t('app.actions.cancel')}
                            </button>
                            <button
                                onClick={() => handleDownload(selectedLanguage)}
                                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                            >
                                <span>{t('download.downloadPdf')}</span>
                                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

