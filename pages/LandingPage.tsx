import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LoginForm } from '../components/LoginForm';
import { SignupForm } from '../components/SignupForm';

export const LandingPage: React.FC = () => {
    const { isAuthenticated, isLoading } = useAuth();
    const navigate = useNavigate();
    const [isLogin, setIsLogin] = useState(true);

    // Redirect if already authenticated removed as per user request to always land on login
    /*
    useEffect(() => {
        if (!isLoading && isAuthenticated) {
            navigate('/dashboard', { replace: true });
        }
    }, [isAuthenticated, isLoading, navigate]);
    */

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                {/* Header */}
                <div className="text-center">
                    <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-2">
                        Invoice Management
                    </h1>
                    <p className="text-lg text-gray-600">
                        Streamline your invoicing process
                    </p>
                </div>

                {/* Auth Card */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 sm:p-10 backdrop-blur-sm bg-white/90">
                    {/* Tabs */}
                    <div className="flex mb-8 bg-gray-100/50 p-1.5 rounded-xl">
                        <button
                            onClick={() => setIsLogin(true)}
                            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${isLogin
                                ? 'bg-white text-blue-600 shadow-sm ring-1 ring-gray-200'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                                }`}
                        >
                            Login
                        </button>
                        <button
                            onClick={() => setIsLogin(false)}
                            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${!isLogin
                                ? 'bg-white text-blue-600 shadow-sm ring-1 ring-gray-200'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                                }`}
                        >
                            Sign Up
                        </button>
                    </div>

                    {/* Form */}
                    <div className="mt-6">
                        {isLogin ? <LoginForm /> : <SignupForm />}
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-sm text-gray-500">
                    {isLogin ? "Don't have an account? " : 'Already have an account? '}
                    <button
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-blue-600 hover:text-blue-700 font-semibold transition-colors"
                    >
                        {isLogin ? 'Create account' : 'Log in'}
                    </button>
                </p>
            </div>
        </div>
    );
};

