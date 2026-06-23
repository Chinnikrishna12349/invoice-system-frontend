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
    country?: 'india' | 'japan'; // Added country prop
}

export const BankDetailsForm: React.FC<BankDetailsFormProps> = ({ data, onChange, errors = {}, country = 'india' }) => {
    const codeType = country === 'japan' ? 'swift' : 'ifsc';

    const updateField = (field: keyof BankDetailsFormData, value: string) => {
        let processedValue = value;

        // Bug 1 & 9: Account Number Validation (Numeric only)
        if (field === 'accountNumber') {
            processedValue = value.replace(/\D/g, '');
            if (country === 'japan') {
                processedValue = processedValue.slice(0, 7);
            } else {
                processedValue = processedValue.slice(0, 18);
            }
        }

        // Bug 2 & 10: Account Name Validation (Alphabets and spaces only)
        if (field === 'accountHolderName') {
            processedValue = value.replace(/[^a-zA-Z\s]/g, '');
            // Limit to reasonable length
            processedValue = processedValue.slice(0, 50);
        }

        // Bug 3: SWIFT Code Validation (Alpha-numeric, max 11)
        if (field === 'swiftCode' || field === 'ifscCode') {
            processedValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11);
        }

        // Bug 4: Branch Code Validation (Numeric only, max 3 for Japan)
        if (field === 'branchCode') {
            processedValue = value.replace(/\D/g, '');
            if (country === 'japan') {
                processedValue = processedValue.slice(0, 3);
            }
        }

        // Add Bank Code validation (Numeric only, max 4 for Japan)
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
                        className={inputClasses(!!errors.bankName)}
                        placeholder="Enter bank name"
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
                        className={inputClasses(!!errors.accountNumber)}
                        placeholder="Enter account number"
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
                        className={inputClasses(!!errors.accountHolderName)}
                        placeholder="Enter account holder name"
                    />
                    {errors.accountHolderName && (
                        <p className="mt-1 text-xs text-red-600 font-bold animate-pulse">{errors.accountHolderName}</p>
                    )}
                </div>

                <div>
                    <label htmlFor="codeField" className={labelClasses}>
                        {codeType === 'swift' ? 'SWIFT Code' : 'IFSC Code'} <span className="text-red-500">*</span>
                    </label>
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
                        className={inputClasses(!!errors.ifscCode || !!errors.swiftCode)}
                        placeholder={`Enter ${codeType === 'swift' ? 'Swift' : 'IFSC'} code`}
                    />
                    {(errors.ifscCode || errors.swiftCode) && (
                        <p className="mt-1 text-xs text-red-600 font-bold animate-pulse">{errors.ifscCode || errors.swiftCode}</p>
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
                        className={inputClasses(!!errors.branchName)}
                        placeholder="Enter branch name"
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

