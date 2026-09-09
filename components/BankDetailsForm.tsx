import React, { useState, useEffect } from 'react';

export interface BankDetailsFormData {
    bankName: string;
    accountNumber: string;
    accountHolderName: string;
    ifscCode: string;
    swiftCode?: string; // Added Swift Code
    bankCode?: string; // Added Bank Code
    branchName: string;
    branchCode: string;
    accountType?: string;
}

interface BankDetailsFormProps {
    data: BankDetailsFormData;
    onChange: (data: BankDetailsFormData) => void;
    errors?: Partial<Record<keyof BankDetailsFormData, string>>;
    country?: 'india' | 'japan' | 'international'; // Added country prop
}

export const BankDetailsForm: React.FC<BankDetailsFormProps> = ({ data, onChange, errors = {}, country = 'india' }) => {
    const codeType = (country === 'japan' || country === 'international') ? 'swift' : 'ifsc';
    const [showSwiftInfo, setShowSwiftInfo] = useState(false);

    const updateField = (field: keyof BankDetailsFormData, value: string) => {
        let processedValue = value;

        // Bank Name (max 100)
        if (field === 'bankName') {
            processedValue = value.slice(0, 100);
        }

        // Account Number: allow up to 50 characters (do not block whitespace while typing so empty validation works on submit)
        if (field === 'accountNumber') {
            processedValue = value.slice(0, 50);
        }

        // Account Holder Name: allow English letters, spaces, and Japanese characters up to 100 chars
        if (field === 'accountHolderName') {
            processedValue = value.replace(
                /[^a-zA-Z\s\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF\uFF01-\uFF9F\u3000-\u303F\uFF65\u30FB.'-]/g,
                ''
            ).slice(0, 100);
        }

        // SWIFT / IFSC Code Validation (Alpha-numeric, max 11)
        if (field === 'swiftCode' || field === 'ifscCode') {
            processedValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11);
        }

        // Branch Name (max 100)
        if (field === 'branchName') {
            processedValue = value.slice(0, 100);
        }

        // Branch Code Validation (Numeric only, max 3 for Japan)
        if (field === 'branchCode') {
            processedValue = value.replace(/\D/g, '');
            if (country === 'japan') {
                processedValue = processedValue.slice(0, 3);
            }
        }

        // Bank Code validation (Numeric only, max 4 for Japan)
        if (field === 'bankCode') {
            processedValue = value.replace(/\D/g, '');
            if (country === 'japan') {
                processedValue = processedValue.slice(0, 4);
            }
        }

        onChange({ ...data, [field]: processedValue });
    };

    const inputClasses = (hasError: boolean) => {
        const base = "block w-full rounded-lg py-2.5 px-3 shadow-sm transition-all outline-none sm:text-sm";
        if (hasError) {
            return `${base} border-2 border-red-500 bg-red-50 text-red-900 placeholder-red-300`;
        }
        return `${base} border border-gray-300 bg-white focus:border-blue-500 text-gray-900`;
    };

    const labelClasses = "block text-sm font-medium leading-6 text-gray-900 mb-1.5";

    return (
        <div className="space-y-6 pt-6 border-t border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Bank Details</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="bankName" className={labelClasses}>
                        Bank Name <span className="text-red-500">*</span>
                    </label>
                    <input
                        id="bankName"
                        type="text"
                        name="bankName"
                        value={data.bankName}
                        onChange={(e) => updateField('bankName', e.target.value)}
                        required
                        maxLength={100}
                        className={inputClasses(!!errors.bankName)}
                        placeholder="Enter bank name (max 100 characters)"
                    />
                    {errors.bankName && (
                        <p className="mt-1 text-xs text-red-600 font-bold animate-pulse">{errors.bankName}</p>
                    )}
                </div>

                <div>
                    <label htmlFor="accountNumber" className={labelClasses}>
                        Account Number <span className="text-red-500">*</span>
                    </label>
                    <input
                        id="accountNumber"
                        type="text"
                        name="accountNumber"
                        value={data.accountNumber}
                        onChange={(e) => updateField('accountNumber', e.target.value)}
                        required
                        maxLength={50}
                        className={inputClasses(!!errors.accountNumber)}
                        placeholder="Enter account number (max 50 characters)"
                    />
                    {errors.accountNumber && (
                        <p className="mt-1 text-xs text-red-600 font-bold animate-pulse">{errors.accountNumber}</p>
                    )}
                </div>

                <div>
                    <label htmlFor="accountHolderName" className={labelClasses}>
                        Account Holder Name <span className="text-red-500">*</span>
                    </label>
                    <input
                        id="accountHolderName"
                        type="text"
                        name="accountHolderName"
                        value={data.accountHolderName}
                        onChange={(e) => updateField('accountHolderName', e.target.value)}
                        required
                        maxLength={100}
                        className={inputClasses(!!errors.accountHolderName)}
                        placeholder="Enter account holder name (max 100 characters)"
                    />
                    {errors.accountHolderName && (
                        <p className="mt-1 text-xs text-red-600 font-bold animate-pulse">{errors.accountHolderName}</p>
                    )}
                </div>

                <div>
                    <div className="flex justify-between items-center mb-1.5">
                        <label htmlFor="codeField" className="block text-sm font-medium leading-6 text-gray-900">
                            {codeType === 'swift' ? 'SWIFT Code' : 'IFSC Code'} {country !== 'japan' && <span className="text-red-500">*</span>}
                        </label>
                        {codeType === 'swift' && (
                            <button
                                type="button"
                                onClick={() => setShowSwiftInfo(!showSwiftInfo)}
                                className="text-xs text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {showSwiftInfo ? 'Hide Format Rules' : 'SWIFT/BIC Format Info'}
                            </button>
                        )}
                    </div>
                    <input
                        id="codeField"
                        type="text"
                        name={codeType === 'swift' ? 'swiftCode' : 'ifscCode'}
                        value={codeType === 'swift' ? (data.swiftCode || '') : (data.ifscCode || '')}
                        onChange={(e) => {
                            const val = e.target.value.toUpperCase();
                            if (codeType === 'swift') {
                                updateField('swiftCode', val);
                            } else {
                                updateField('ifscCode', val);
                            }
                        }}
                        maxLength={11}
                        className={inputClasses(!!errors.ifscCode || !!errors.swiftCode)}
                        placeholder={`Enter ${codeType === 'swift' ? '8 or 11-char SWIFT' : 'IFSC'} code`}
                    />
                    {(errors.ifscCode || errors.swiftCode) && (
                        <p className="mt-1 text-xs text-red-600 font-bold animate-pulse">{errors.ifscCode || errors.swiftCode}</p>
                    )}

                    {codeType === 'swift' && (showSwiftInfo || true) && (
                        <div className="mt-2 p-2.5 bg-blue-50/70 border border-blue-100 rounded-lg text-xs text-blue-900 space-y-1">
                            <p className="font-semibold text-blue-950 flex items-center gap-1">
                                ℹ️ SWIFT/BIC Code Format (8 or 11 Characters):
                            </p>
                            <ul className="list-disc list-inside space-y-0.5 text-[11px] text-blue-800">
                                <li><strong>Positions 1–4 (Bank Code):</strong> 4 letters (A–Z only)</li>
                                <li><strong>Positions 5–6 (Country Code):</strong> 2 letters (A–Z only, e.g., JP, IN)</li>
                                <li><strong>Positions 7–8 (Location Code):</strong> 2 letters or numbers (A–Z, 0–9)</li>
                                <li><strong>Positions 9–11 (Branch Code - Optional):</strong> 3 letters or numbers (A–Z, 0–9)</li>
                            </ul>
                        </div>
                    )}
                </div>

                <div>
                    <label htmlFor="branchName" className={labelClasses}>
                        Branch Name <span className="text-red-500">*</span>
                    </label>
                    <input
                        id="branchName"
                        type="text"
                        name="branchName"
                        value={data.branchName}
                        onChange={(e) => updateField('branchName', e.target.value)}
                        required
                        maxLength={100}
                        className={inputClasses(!!errors.branchName)}
                        placeholder="Enter branch name (max 100 characters)"
                    />
                    {errors.branchName && (
                        <p className="mt-1 text-xs text-red-600 font-bold animate-pulse">{errors.branchName}</p>
                    )}
                </div>

                {codeType === 'swift' && (
                    <>
                        <div>
                            <label htmlFor="bankCode" className={labelClasses}>
                                Bank Code <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="bankCode"
                                type="text"
                                name="bankCode"
                                value={data.bankCode || ''}
                                onChange={(e) => updateField('bankCode', e.target.value)}
                                required
                                maxLength={4}
                                className={inputClasses(!!errors.bankCode)}
                                placeholder="Enter 4-digit bank code"
                            />
                            {errors.bankCode && (
                                <p className="mt-1 text-xs text-red-600 font-bold animate-pulse">{errors.bankCode}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="branchCode" className={labelClasses}>
                                Branch Code <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="branchCode"
                                type="text"
                                name="branchCode"
                                value={data.branchCode}
                                onChange={(e) => updateField('branchCode', e.target.value)}
                                required
                                maxLength={country === 'japan' ? 3 : undefined}
                                className={inputClasses(!!errors.branchCode)}
                                placeholder="Enter branch code"
                            />
                            {errors.branchCode && (
                                <p className="mt-1 text-xs text-red-600 font-bold animate-pulse">{errors.branchCode}</p>
                            )}
                        </div>
                    </>
                )}

                <div>
                    <label htmlFor="accountType" className={labelClasses}>
                        Account Type <span className="text-red-500">*</span>
                    </label>
                    <select
                        id="accountType"
                        name="accountType"
                        value={data.accountType || ''}
                        onChange={(e) => updateField('accountType', e.target.value)}
                        className={inputClasses(!!errors.accountType)}
                        required
                    >
                        <option value="">Select Account Type</option>
                        <option value="Savings">Savings</option>
                        <option value="Current">Current</option>
                    </select>
                    {errors.accountType && (
                        <p className="mt-1 text-xs text-red-600 font-bold animate-pulse">{errors.accountType}</p>
                    )}
                </div>
            </div>
        </div>
    );
};

