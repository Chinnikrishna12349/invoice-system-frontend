import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Invoice } from '../types';

interface SendEmailModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSend: (emails: string[]) => Promise<void>;
    invoice: Invoice;
}

export const SendEmailModal: React.FC<SendEmailModalProps> = ({ isOpen, onClose, onSend, invoice }) => {
    const { t } = useTranslation();
    const [additionalEmails, setAdditionalEmails] = useState<string>('');
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSend = async () => {
        setError(null);
        setIsSending(true);
        try {
            // Split by comma, trim, and filter out empty strings
            const emailList = additionalEmails
                .split(',')
                .map(e => e.trim())
                .filter(e => e.length > 0);

            // Basic email validation for the additional ones
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            const invalidEmails = emailList.filter(e => !emailRegex.test(e));

            if (invalidEmails.length > 0) {
                setError(`The following emails are invalid: ${invalidEmails.join(', ')}`);
                setIsSending(false);
                return;
            }

            await onSend(emailList);
            onClose();
            setAdditionalEmails('');
        } catch (err: any) {
            setError(err.message || 'Failed to send email');
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all animate-fade-in-up">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-lg">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-white">Send Invoice Email</h3>
                    </div>
                    <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    {/* Primary Recipient Info */}
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                        <label className="block text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">Primary Recipient</label>
                        <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-900">{invoice.employeeName}</span>
                            <span className="text-slate-500">&lt;{invoice.employeeEmail}&gt;</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-2">This is the email address defined in the invoice.</p>
                    </div>

                    {/* Additional Emails Input */}
                    <div>
                        <label htmlFor="additionalEmails" className="block text-sm font-semibold text-slate-700 mb-1.5">
                            Additional Recipients (Optional)
                        </label>
                        <textarea
                            id="additionalEmails"
                            rows={3}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none resize-none text-sm placeholder:text-slate-400"
                            placeholder="Enter emails separated by commas (e.g. boss@corp.com, hr@corp.com)"
                            value={additionalEmails}
                            onChange={(e) => setAdditionalEmails(e.target.value)}
                            disabled={isSending}
                        />
                        <p className="mt-1.5 text-[11px] text-slate-500 italic">
                            Separate multiple addresses with commas.
                        </p>
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100 animate-pulse">
                            ⚠️ {error}
                        </div>
                    )}

                    {/* Footer Actions */}
                    <div className="flex items-center gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSending}
                            className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSend}
                            disabled={isSending}
                            className="flex-[2] py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold hover:shadow-lg hover:shadow-blue-200 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
                        >
                            {isSending ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Sending...</span>
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                    </svg>
                                    <span>Send Now</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
