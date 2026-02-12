import React, { useState, useCallback, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CountryProvider } from './contexts/CountryContext';
import { Navigation } from './components/Navigation';
import { LandingPage } from './pages/LandingPage';
import { Dashboard } from './pages/Dashboard';
import { InvoicesPage } from './pages/InvoicesPage';
import InvoicePage from './pages/InvoicePage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Invoice } from './types';

const AppContent: React.FC = () => {
    const { isAuthenticated, isLoading } = useAuth();
    const location = useLocation();


    // Show navigation only on authenticated routes
    // Show navigation on all authenticated pages except landing
    const showNavigation = isAuthenticated && location.pathname !== '/';

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
            {showNavigation && (
                <Navigation />
            )}
            {/* Error display removed */}
            <Routes>
                <Route
                    path="/"
                    element={<LandingPage />}
                />
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/invoices"
                    element={
                        <ProtectedRoute>
                            <InvoicesPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/invoice/:id"
                    element={
                        <ProtectedRoute>
                            <InvoicePage />
                        </ProtectedRoute>
                    }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </div>
    );
};

const App: React.FC = () => {
    return (
        <AuthProvider>
            <CountryProvider>
                <AppContent />
            </CountryProvider>
        </AuthProvider>
    );
};

export default App;
