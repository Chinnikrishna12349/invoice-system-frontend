import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { updateCompanyInfo } from '../services/authService';
import { ImageUpload } from './ImageUpload';
import { BankDetailsForm, BankDetailsFormData } from './BankDetailsForm';

interface CompanySettingsProps {
    onClose: () => void;
}

export const CompanySettings: React.FC<CompanySettingsProps> = ({ onClose }) => {
    const { t } = useTranslation();
    const { companyInfo, refreshCompanyInfo } = useAuth();

    const [companyName, setCompanyName] = useState(companyInfo?.companyName || '');
    const [companyAddress, setCompanyAddress] = useState(companyInfo?.companyAddress || '');
    const [invoiceFormat, setInvoiceFormat] = useState(companyInfo?.invoiceFormat || 'INV-');
    const [fromEmail, setFromEmail] = useState(companyInfo?.fromEmail || '');
    const [companyLogo, setCompanyLogo] = useState<File | null>(null);
    const [bankDetails, setBankDetails] = useState<BankDetailsFormData>({
        bankName: companyInfo?.bankDetails?.bankName || '',
        accountNumber: companyInfo?.bankDetails?.accountNumber || '',
        accountHolderName: companyInfo?.bankDetails?.accountHolderName || '',
        ifscCode: companyInfo?.bankDetails?.ifscCode || '',
        branchName: companyInfo?.bankDetails?.branchName || '',
        branchCode: companyInfo?.bankDetails?.branchCode || '',
        accountType: companyInfo?.bankDetails?.accountType || '',
    });

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccess('');

        try {
            await updateCompanyInfo({
                companyName,
                companyAddress,
                invoiceFormat,
                fromEmail,
                companyLogo,
                bankDetails
            });

            await refreshCompanyInfo();
            setSuccess('Company settings updated successfully!');
            setTimeout(onClose, 2000);
        } catch (err: any) {
            setError(err.message || 'Failed to update company settings');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto px-4 py-6 sm:px-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

            <div className="relative mx-auto max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h3 className="text-xl font-bold text-gray-900">Company Settings</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[80vh] overflow-y-auto">
                    {error && (
                        <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm border border-red-100">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="bg-green-50 text-green-700 p-4 rounded-xl text-sm border border-green-100 text-center font-semibold">
                            {success}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                                From Email Address (Email sender)
                            </label>
                            <input
                                type="email"
                                value={fromEmail}
                                onChange={(e) => setFromEmail(e.target.value)}
                                className="block w-full rounded-xl border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-3 border"
                                placeholder="e.g., contact@company.com"
                            />
                            <p className="mt-1 text-xs text-gray-500 italic">This email will be used as the sender when emailing invoices.</p>
                        </div>

                        <div className="pt-2">
                            <ImageUpload
                                value={companyLogo}
                                onChange={setCompanyLogo}
                                label="Update Company Logo"
                                existingImageUrl={companyInfo?.companyLogoUrl}
                                maxSizeMB={5}
                            />
                            {companyInfo?.companyLogoUrl && !companyLogo && (
                                <p className="mt-2 text-xs text-gray-500 italic">Current logo is already stored securely in the database.</p>
                            )}
                        </div>
                    </div>

                    <div className="pt-6 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-8 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg hover:shadow-blue-500/25 disabled:opacity-50 transition-all flex items-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white"></div>
                                    Saving...
                                </>
                            ) : 'Save Settings'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
