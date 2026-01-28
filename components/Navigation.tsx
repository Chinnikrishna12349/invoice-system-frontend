import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import logo from '../src/assets/oryfolks-logo.svg';

import { useAuth } from '../contexts/AuthContext';
export const Navigation: React.FC = () => {
    const { t } = useTranslation();
    const location = useLocation();
    const navigate = useNavigate();
    const { isAuthenticated, user, companyInfo, logout } = useAuth();

    // Reset logo error when companyInfo changes
    React.useEffect(() => {
        setLogoError(false);
    }, [companyInfo?.companyLogoUrl]);

    const [logoError, setLogoError] = useState(false);

    const isActive = (path: string) => {
        return location.pathname === path;
    };

    return (
        <>
            <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-white/20 shadow-lg">
                <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                            {/* Company Logo with Fallback */}
                            {isAuthenticated && companyInfo ? (
                                <>
                                    {companyInfo.companyLogoUrl && !logoError ? (
                                        <img
                                            src={companyInfo.companyLogoUrl.startsWith('http')
                                                ? companyInfo.companyLogoUrl
                                                : companyInfo.companyLogoUrl.startsWith('/') ? companyInfo.companyLogoUrl : '/' + companyInfo.companyLogoUrl}
                                            alt={`${companyInfo.companyName} Logo`}
                                            className="h-10 sm:h-12 w-auto object-contain flex-shrink-0"
                                            onError={() => {
                                                // Fallback to initial letter avatar if company logo fails to load
                                                setLogoError(true);
                                            }}
                                        />
                                    ) : (
                                        <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center flex-shrink-0">
                                            <span className="text-white font-bold text-lg sm:text-xl">
                                                {companyInfo.companyName.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <>
                                    <img src={logo} alt="System Logo" className="h-10 w-auto sm:h-12 flex-shrink-0" />
                                </>
                            )}
                        </div>

                        <nav className="flex items-center gap-2 sm:gap-3">
                            {isAuthenticated && (
                                <>
                                    {/* User info - removed as per request */}

                                    {/* Navigation Links */}
                                    <Link
                                        to="/invoices"
                                        className={`px-3 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${isActive('/invoices')
                                            ? 'bg-blue-100 text-blue-700'
                                            : 'text-gray-600 hover:bg-gray-100'
                                            }`}
                                        title="Invoices"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <span className="hidden sm:inline">Invoices</span>
                                    </Link>

                                    {/* Logout Button */}
                                    <button
                                        onClick={logout}
                                        className="px-3 py-2 rounded-lg font-medium transition-all duration-200 text-gray-700 hover:bg-red-50 hover:text-red-600"
                                        title="Logout"
                                    >
                                        <span className="flex items-center gap-2">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                            </svg>
                                            <span className="hidden sm:inline">Logout</span>
                                        </span>
                                    </button>
                                </>
                            )}
                        </nav>
                    </div>
                </div>
            </header>
        </>
    );
};
