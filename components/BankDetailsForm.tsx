import React from 'react';

export interface BankDetailsFormData {
    bankName: string;
    accountNumber: string;
    accountHolderName: string;
    ifscCode: string;
    swiftCode?: string; // Added Swift Code
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
            if (country === 'japan') {
                processedValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11);
            } else {
                processedValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11);
            }
        }

        // Bug 4: Branch Code Validation (Numeric only, max 3 for Japan)
        if (field === 'branchCode') {
            processedValue = value.replace(/\D/g, '');
            if (country === 'japan') {
                processedValue = processedValue.slice(0, 3);
            }
        }

        onChange({ ...data, [field]: processedValue });
    };


    const inputClasses = (hasError: boolean) => `
        block w-full rounded-lg border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset 
        ${hasError ? 'ring-red-300 placeholder:text-red-300 focus:ring-red-500' : 'ring-gray-300 placeholder:text-gray-400 focus:ring-blue-600'} 
        focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 transition-shadow duration-200
    `;

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
                        value={data.bankName}
                        onChange={(e) => updateField('bankName', e.target.value)}
                        required
                        className={inputClasses(!!errors.bankName)}
                        placeholder="Enter bank name"
                    />
                    {errors.bankName && (
                        <p className="mt-1 text-xs text-red-500">{errors.bankName}</p>
                    )}
                </div>

                <div>
                    <label htmlFor="accountNumber" className={labelClasses}>
                        Account Number <span className="text-red-500">*</span>
                    </label>
                    <input
                        id="accountNumber"
                        type="text"
                        value={data.accountNumber}
                        onChange={(e) => updateField('accountNumber', e.target.value)}
                        required
                        className={inputClasses(!!errors.accountNumber)}
                        placeholder="Enter account number"
                    />
                    {errors.accountNumber && (
                        <p className="mt-1 text-xs text-red-500">{errors.accountNumber}</p>
                    )}
                </div>

                <div>
                    <label htmlFor="accountHolderName" className={labelClasses}>
                        Account Holder Name <span className="text-red-500">*</span>
                    </label>
                    <input
                        id="accountHolderName"
                        type="text"
                        value={data.accountHolderName}
                        onChange={(e) => updateField('accountHolderName', e.target.value)}
                        required
                        className={inputClasses(!!errors.accountHolderName)}
                        placeholder="Enter account holder name"
                    />
                    {errors.accountHolderName && (
                        <p className="mt-1 text-xs text-red-500">{errors.accountHolderName}</p>
                    )}
                </div>

                <div>
                    <label htmlFor="ifscCode" className={labelClasses}>
                        {country === 'japan' ? 'Swift Code' : 'IFSC Code'}
                    </label>
                    <input
                        id="ifscCode"
                        type="text"
                        value={country === 'japan' ? (data.swiftCode || '') : data.ifscCode}
                        onChange={(e) => {
                            if (country === 'japan') {
                                updateField('swiftCode', e.target.value.toUpperCase());
                            } else {
                                updateField('ifscCode', e.target.value.toUpperCase());
                            }
                        }}
                        className={inputClasses(!!errors.ifscCode)}
                        placeholder={`Enter ${country === 'japan' ? 'Swift' : 'IFSC'} code`}
                    />
                    {/* Reuse error for simplification or separate? Reuse error key for now but we might want distinct key */}
                    {errors.ifscCode && (
                        <p className="mt-1 text-xs text-red-500">{errors.ifscCode}</p>
                    )}
                </div>

                <div>
                    <label htmlFor="branchName" className={labelClasses}>
                        Branch Name
                    </label>
                    <input
                        id="branchName"
                        type="text"
                        value={data.branchName}
                        onChange={(e) => updateField('branchName', e.target.value)}
                        className={inputClasses(false)}
                        placeholder="Enter branch name"
                    />
                </div>

                <div>
                    <label htmlFor="branchCode" className={labelClasses}>
                        Branch Code
                    </label>
                    <input
                        id="branchCode"
                        type="text"
                        value={data.branchCode}
                        onChange={(e) => updateField('branchCode', e.target.value)}
                        className={inputClasses(false)}
                        placeholder="Enter branch code"
                    />
                </div>

                <div>
                    <label htmlFor="accountType" className={labelClasses}>
                        Account Type
                    </label>
                    <select
                        id="accountType"
                        value={data.accountType || ''}
                        onChange={(e) => updateField('accountType', e.target.value)}
                        className={inputClasses(false)}
                    >
                        <option value="">Select Account Type</option>
                        <option value="Savings">Savings</option>
                        <option value="Current">Current</option>
                    </select>
                </div>
            </div>
        </div>
    );
};

