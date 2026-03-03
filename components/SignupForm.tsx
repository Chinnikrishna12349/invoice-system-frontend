import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { checkBackendHealth } from '../services/authService';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env?.VITE_API_URL?.replace('/api/invoices', '') || 'https://invoice-system-backend-owhd.onrender.com';

export const SignupForm: React.FC = () => {
    const { signup } = useAuth();
    const navigate = useNavigate();

    // User Personal Info (Still required)
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // State for Feedback
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');

    // Check backend status on component mount
    useEffect(() => {
        const checkBackend = async () => {
            setBackendStatus('checking');
            const isHealthy = await checkBackendHealth();
            setBackendStatus(isHealthy ? 'online' : 'offline');

            // Auto-retrying if offline to provide smoother experience
            if (!isHealthy) {
                console.log("Backend offline, scheduling auto-retry...");
                setTimeout(() => {
                    checkBackend();
                }, 15000); // Retry after 15 seconds
            }
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

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setErrors({});

        if (!validateForm()) {
            return;
        }

        setIsLoading(true);

        try {
            // Inject Placeholder/Dummy Data for Backend Compliance
            // The backend requires these fields, but we don't want the user to fill them.
            // We'll update them later via the Invoice Form dropdowns logic implicitly (data isolation).
            await signup({
                email,
                password,
                name,
                companyName: "Pending Setup",
                companyAddress: "Address Not Set",
                invoiceFormat: "INV-",
                companyLogo: null, // No logo initially
                bankDetails: {
                    bankName: "Pending",
                    accountNumber: "0000000000",
                    accountHolderName: "Pending",
                    ifscCode: "PEND0000000",
                    branchName: "Main",
                    accountType: "Current"
                },
            });
            setShowSuccessModal(true);
            // AuthContext will handle navigation to dashboard automatically
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Signup failed. Please try again.';
            setError(errorMessage);
            console.error('Signup error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSuccessClose = () => {
        setShowSuccessModal(false);
        navigate('/login');
    };

    const inputClasses = (hasError: boolean) => `
        block w-full rounded-lg border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset 
        ${hasError ? 'ring-red-300 placeholder:text-red-300 focus:ring-red-500' : 'ring-gray-300 placeholder:text-gray-400 focus:ring-blue-600'} 
        focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 transition-shadow
    `;

    const labelClasses = "block text-sm font-medium leading-6 text-gray-900 mb-1.5";

    return (
        <>
            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Backend Status Indicator */}
                {backendStatus === 'checking' && (
                    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-lg shadow-sm animate-pulse">
                        <div className="flex items-center gap-3">
                            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-600"></div>
                            <div>
                                <p className="text-blue-800 font-medium text-sm">Waking up backend server...</p>
                                <p className="text-blue-600 text-xs">Since we are on a free tier, the server takes about 30-45 seconds to wake up for the first time. Please stay on this page.</p>
                            </div>
                        </div>
                    </div>
                )}
                {backendStatus === 'offline' && (
                    <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg shadow-sm">
                        <div className="flex items-start gap-3">
                            <div className="p-1 bg-red-100 rounded-full">
                                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <h4 className="text-red-800 font-bold text-sm">Server Taking Longer Than Usual to Wake</h4>
                                <p className="text-red-700 text-sm mt-1">Render (our hosting provider) is still spinning up the server. We will keep trying automatically.</p>
                                <button
                                    type="button"
                                    onClick={async () => {
                                        setBackendStatus('checking');
                                        const isHealthy = await checkBackendHealth(12); // Extra persistence for manual retry
                                        setBackendStatus(isHealthy ? 'online' : 'offline');
                                    }}
                                    className="mt-4 w-full sm:w-auto bg-red-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-red-700 transition-all shadow-md active:scale-95"
                                >
                                    Retry Connection
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Error Display */}
                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
                        <p className="text-red-700 font-medium text-sm mb-1">Signup Failed</p>
                        <p className="text-red-600 text-sm">{error}</p>
                    </div>
                )}

                {/* Personal Information Only */}
                <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-2">Create Your Account</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
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

                        <div className="md:col-span-2">
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
                    <p className="mt-4 text-center text-sm text-gray-500">
                        Setup company and bank details later in your dashboard.
                    </p>
                </div>
            </form >
        </>
    );
};
