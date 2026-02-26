import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';


import { useAuth } from '../contexts/AuthContext';
import { CompanySettings } from './CompanySettings';


export const Navigation: React.FC = () => {
    const { t } = useTranslation();
    const location = useLocation();
    const { isAuthenticated, companyInfo, logout } = useAuth();
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const isActive = (path: string) => {
        return location.pathname === path;
    };

    return (
        <>
            <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-white/20 shadow-lg">
                <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between gap-4">


                        <nav className="flex items-center gap-2 sm:gap-3">
                            {isAuthenticated && (
                                <>
                                    <Link
                                        to="/dashboard"
                                        className={`px-3 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${isActive('/dashboard') ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                                            }`}
                                    >
                                        <span className="hidden sm:inline">Dashboard</span>
                                    </Link>

                                    <Link
                                        to="/invoices"
                                        className={`px-3 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${isActive('/invoices') ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                                            }`}
                                    >
                                        <span className="hidden sm:inline">Invoices</span>
                                    </Link>

                                    <Link
                                        to="/bank-accounts"
                                        className={`px-3 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${isActive('/bank-accounts') ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                                            }`}
                                    >
                                        <span className="hidden sm:inline">Bank Accounts</span>
                                    </Link>

                                    <button
                                        onClick={() => setIsSettingsOpen(true)}
                                        className="px-3 py-2 rounded-lg font-medium transition-colors text-gray-600 hover:bg-gray-100 flex items-center gap-2"
                                        title="Settings"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        <span className="hidden sm:inline">Settings</span>
                                    </button>

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

            {isSettingsOpen && (
                <CompanySettings onClose={() => setIsSettingsOpen(false)} />
            )}
        </>
    );
};
