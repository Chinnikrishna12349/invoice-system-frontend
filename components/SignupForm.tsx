import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ImageUpload } from './ImageUpload';
import { BankDetailsForm, BankDetailsFormData } from './BankDetailsForm';
import { checkBackendHealth } from '../services/authService';

const API_URL = import.meta.env?.VITE_API_URL?.replace('/api/invoices', '') || 'https://invoice-system-backend-owhd.onrender.com';

export const SignupForm: React.FC = () => {
    const { signup } = useAuth();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [companyAddress, setCompanyAddress] = useState('');
    const [invoiceFormat, setInvoiceFormat] = useState('INV-'); // Default value
    const [companyLogo, setCompanyLogo] = useState<File | null>(null);
    const [bankDetails, setBankDetails] = useState<BankDetailsFormData>({
        bankName: '',
        accountNumber: '',
        accountHolderName: '',
        ifscCode: '',
        branchName: '',
        branchCode: '',
        accountType: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');

    // Check backend status on component mount
    useEffect(() => {
        const checkBackend = async () => {
            setBackendStatus('checking');
            const isHealthy = await checkBackendHealth();
            setBackendStatus(isHealthy ? 'online' : 'offline');
        };
        checkBackend();
    }, []);

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!name.trim()) newErrors.name = 'Name is required';
        if (!email.trim()) newErrors.email = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Invalid email format';

        if (!password) newErrors.password = 'Password is required';
        else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';

        if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';

        if (!companyName.trim()) newErrors.companyName = 'Company name is required';
        if (!companyAddress.trim()) newErrors.companyAddress = 'Company address is required';
        if (!companyLogo) newErrors.companyLogo = 'Company logo is required';

        if (!bankDetails.bankName.trim()) newErrors.bankName = 'Bank name is required';
        if (!bankDetails.accountNumber.trim()) newErrors.accountNumber = 'Account number is required';
        if (!bankDetails.accountHolderName.trim()) newErrors.accountHolderName = 'Account holder name is required';
        if (!bankDetails.ifscCode.trim()) newErrors.ifscCode = 'IFSC code is required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setErrors({});

        if (!validateForm()) {
            const errorFields = Object.keys(errors);
            if (errorFields.length > 0) {
                const fieldNames = errorFields.map(field => {
                    const labels: Record<string, string> = {
                        name: 'Full Name',
                        email: 'Email',
                        password: 'Password',
                        confirmPassword: 'Confirm Password',
                        companyName: 'Company Name',
                        companyAddress: 'Company Address',
                        bankName: 'Bank Name',
                        accountNumber: 'Account Number',
                        accountHolderName: 'Account Holder Name',
                        ifscCode: 'IFSC Code',
                    };
                    return labels[field] || field;
                });
                setError(`Please fill in the following required fields: ${fieldNames.join(', ')}`);
            } else {
                setError('Please fix the errors in the form');
            }
            return;
        }

        setIsLoading(true);

        try {
            await signup({
                email,
                password,
                name,
                companyName,
                companyAddress,
                invoiceFormat,
                companyLogo,
                bankDetails: {
                    bankName: bankDetails.bankName.trim(),
                    accountNumber: bankDetails.accountNumber.trim(),
                    accountHolderName: bankDetails.accountHolderName.trim(),
                    ifscCode: bankDetails.ifscCode.trim(),
                    branchName: bankDetails.branchName?.trim() || undefined,
                    branchCode: bankDetails.branchCode?.trim() || undefined,
                    accountType: bankDetails.accountType?.trim() || undefined,
                },
            });
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Signup failed. Please try again.';
            setError(errorMessage);

            // If it's a validation error from backend, try to extract field-specific errors
            if (errorMessage.includes('required') || errorMessage.includes('must be')) {
                // Highlight which fields might be missing
                const missingFields: string[] = [];
                if (errorMessage.toLowerCase().includes('email')) missingFields.push('email');
                if (errorMessage.toLowerCase().includes('password')) missingFields.push('password');
                if (errorMessage.toLowerCase().includes('name')) missingFields.push('name');
                if (errorMessage.toLowerCase().includes('company')) missingFields.push('companyName', 'companyAddress');
                if (errorMessage.toLowerCase().includes('bank')) missingFields.push('bankName', 'accountNumber', 'accountHolderName', 'ifscCode');

                // Update field errors
                const newErrors: Record<string, string> = { ...errors };
                missingFields.forEach(field => {
                    if (!newErrors[field]) {
                        newErrors[field] = 'This field is required';
                    }
                });
                setErrors(newErrors);
            }

            console.error('Signup error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const inputClasses = (hasError: boolean) => `
        block w-full rounded-lg border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset 
        ${hasError ? 'ring-red-300 placeholder:text-red-300 focus:ring-red-500' : 'ring-gray-300 placeholder:text-gray-400 focus:ring-blue-600'} 
        focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 transition-shadow
    `;

    const labelClasses = "block text-sm font-medium leading-6 text-gray-900 mb-1.5";

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            {/* Backend Status Indicator */}
            {backendStatus === 'checking' && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
                    <div className="flex items-center gap-3">
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-yellow-600"></div>
                        <p className="text-yellow-800 text-sm">Checking backend connection...</p>
                    </div>
                </div>
            )}
            {backendStatus === 'offline' && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
                    <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <div className="flex-1">
                            <p className="text-red-800 font-medium text-sm mb-1">Backend Server Offline</p>
                            <p className="text-red-700 text-sm mb-2">The backend server is not reachable at {API_URL}</p>
                            <div className="bg-red-100 p-3 rounded mt-2">
                                <p className="text-red-800 text-xs font-medium mb-1">To start the backend:</p>
                                <ol className="text-red-700 text-xs list-decimal list-inside space-y-1">
                                    <li>Open PowerShell or Terminal</li>
                                    <li>Navigate to backend folder: <code className="bg-red-200 px-1 rounded">cd backend</code></li>
                                    <li>Run: <code className="bg-red-200 px-1 rounded">mvn spring-boot:run</code></li>
                                    <li>Wait for: <code className="bg-red-200 px-1 rounded">Started InvoiceManagementApplication</code></li>
                                </ol>
                                <button
                                    type="button"
                                    onClick={async () => {
                                        setBackendStatus('checking');
                                        const isHealthy = await checkBackendHealth();
                                        setBackendStatus(isHealthy ? 'online' : 'offline');
                                    }}
                                    className="mt-3 text-xs bg-red-600 text-white px-3 py-1.5 rounded-md hover:bg-red-700 transition-colors"
                                >
                                    Retry Connection
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Error Display */}
            {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
                    <div className="flex items-start">
                        <svg className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="flex-1">
                            <p className="text-red-700 font-medium text-sm mb-1">Signup Failed</p>
                            <p className="text-red-600 text-sm">{error}</p>
                            {error.includes('connect to server') && (
                                <div className="mt-2 space-y-1">
                                    <p className="text-red-600 text-xs font-medium">Troubleshooting:</p>
                                    <ul className="text-red-600 text-xs list-disc list-inside space-y-0.5">
                                        <li>Make sure the backend server is running on port 8080</li>
                                        <li>Check if the API URL is correct: {API_URL}</li>
                                        <li>Verify CORS settings in the backend</li>
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Personal Information */}
            <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-2">Personal Information</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="signup-name" className={labelClasses}>
                            Full Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="signup-name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className={inputClasses(!!errors.name)}
                            placeholder="John Doe"
                        />
                        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                    </div>

                    <div>
                        <label htmlFor="signup-email" className={labelClasses}>
                            Email <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="signup-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className={inputClasses(!!errors.email)}
                            placeholder="you@example.com"
                        />
                        {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                    </div>

                    <div>
                        <label htmlFor="signup-password" className={labelClasses}>
                            Password <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="signup-password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                            className={inputClasses(!!errors.password)}
                            placeholder="At least 6 characters"
                        />
                        {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
                    </div>

                    <div>
                        <label htmlFor="signup-confirm-password" className={labelClasses}>
                            Confirm Password <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="signup-confirm-password"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            minLength={6}
                            className={inputClasses(!!errors.confirmPassword)}
                            placeholder="Confirm your password"
                        />
                        {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
                    </div>
                </div>
            </div>

            {/* Company Information */}
            <div className="space-y-6 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-2">Company Information</h3>

                <div className="grid grid-cols-1 gap-6">
                    <div>
                        <label htmlFor="companyName" className={labelClasses}>
                            Company Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="companyName"
                            type="text"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            required
                            className={inputClasses(!!errors.companyName)}
                            placeholder="Your Company Name"
                        />
                        {errors.companyName && <p className="mt-1 text-sm text-red-600">{errors.companyName}</p>}
                    </div>

                    <div>
                        <label htmlFor="companyAddress" className={labelClasses}>
                            Company Address <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            id="companyAddress"
                            value={companyAddress}
                            onChange={(e) => setCompanyAddress(e.target.value)}
                            required
                            rows={3}
                            className={inputClasses(!!errors.companyAddress)}
                            placeholder="Enter company address"
                        />
                        {errors.companyAddress && <p className="mt-1 text-sm text-red-600">{errors.companyAddress}</p>}
                    </div>

                    <div>
                        <label htmlFor="invoiceFormat" className="block text-sm font-medium leading-6 text-gray-900 mb-1.5">
                            Invoice Number Format
                        </label>
                        <div className="mt-2">
                            <input
                                id="invoiceFormat"
                                type="text"
                                value={invoiceFormat}
                                onChange={(e) => setInvoiceFormat(e.target.value)}
                                className={`block w-full rounded-lg border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 transition-shadow`}
                                placeholder="e.g. INV-, OF-IT-"
                            />
                            <p className="mt-1 text-xs text-gray-500">Prefix for invoice numbers. Numbers will be auto-appended (e.g. default INV-1)</p>
                        </div>
                    </div>

                    <ImageUpload
                        value={companyLogo}
                        onChange={setCompanyLogo}
                        label="Company Logo"
                        maxSizeMB={5}
                        error={errors.companyLogo}
                    />
                </div>
            </div>

            {/* Bank Details */}
            <BankDetailsForm
                data={bankDetails}
                onChange={setBankDetails}
                errors={{
                    bankName: errors.bankName,
                    accountNumber: errors.accountNumber,
                    accountHolderName: errors.accountHolderName,
                    ifscCode: errors.ifscCode,
                }}
            />

            <div className="pt-4">
                <button
                    type="submit"
                    disabled={isLoading || backendStatus !== 'online'}
                    className="flex w-full justify-center rounded-lg bg-blue-600 px-3 py-3 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
                >
                    {isLoading ? (
                        <span className="flex items-center gap-2">
                            <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Creating account...
                        </span>
                    ) : backendStatus !== 'online' ? 'Backend Offline - Cannot Sign Up' : 'Create Account'}
                </button>
            </div>
        </form >
    );
};
