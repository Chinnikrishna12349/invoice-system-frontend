import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LoginCredentials, SignupCredentials, CompanyInfo, login, signup, logout, getToken, getUser, getCompanyInfo, fetchCompanyInfo, isAuthenticated, validateToken } from '../services/authService';

interface AuthContextType {
    user: User | null;
    companyInfo: CompanyInfo | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (credentials: LoginCredentials) => Promise<void>;
    signup: (credentials: SignupCredentials) => Promise<void>;
    logout: () => void;
    refreshCompanyInfo: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    // Check authentication on mount - validate token with backend
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const token = getToken();
                if (token) {
                    // Validate token with backend before auto-login
                    const isValid = await validateToken(token);
                    if (isValid) {
                        const storedUser = getUser();
                        // Always fetch latest company info from backend to ensure we have the correct logo URL
                        const latestCompanyInfo = await fetchCompanyInfo();

                        setUser(storedUser);
                        setCompanyInfo(latestCompanyInfo || getCompanyInfo());
                    } else {
                        // Token is invalid, clear it
                        logout();
                        setUser(null);
                        setCompanyInfo(null);
                    }
                }
            } catch (error) {
                console.error('Error checking authentication:', error);
                // On error, clear auth data
                logout();
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };

        checkAuth();
    }, []);

    // Background pinger to keep Render backend awake (pings every 8 minutes)
    useEffect(() => {
        const AUTH_API_URL = import.meta.env?.VITE_API_URL?.replace('/api/invoices', '') || 'https://invoice-system-backend-owhd.onrender.com';

        const pingBackend = async () => {
            try {
                await fetch(`${AUTH_API_URL}/api/auth/health`);
                if (import.meta.env?.DEV) {
                    console.log('Stay-Awake: Backend pinged successfully');
                }
            } catch (e) {
                if (import.meta.env?.DEV) {
                    console.warn('Stay-Awake: Ping failed, backend might be sleeping');
                }
            }
        };

        // Ping immediately on mount
        pingBackend();

        // Then ping every 8 minutes (Render sleeps after 15 mins of inactivity)
        const pinger = setInterval(pingBackend, 8 * 60 * 1000);

        return () => clearInterval(pinger);
    }, []);

    const handleLogin = async (credentials: LoginCredentials) => {
        try {
            const { user: loggedInUser } = await login(credentials);
            let storedCompanyInfo = getCompanyInfo();

            // If company info is not in localStorage, fetch from backend
            if (!storedCompanyInfo) {
                storedCompanyInfo = await fetchCompanyInfo();
            }

            setUser(loggedInUser);
            setCompanyInfo(storedCompanyInfo);
            navigate('/dashboard');
        } catch (error) {
            throw error;
        }
    };

    const handleSignup = async (credentials: SignupCredentials) => {
        try {
            await signup(credentials);
            // After signup, redirect to login page as requested by user
            navigate('/login');
        } catch (error) {
            throw error;
        }
    };

    const handleLogout = () => {
        logout();
        setUser(null);
        setCompanyInfo(null);
        navigate('/');
    };

    const handleRefreshCompanyInfo = async () => {
        try {
            const info = await fetchCompanyInfo();
            if (info) {
                setCompanyInfo(info);
            }
        } catch (error) {
            console.error('Failed to refresh company info:', error);
        }
    };

    const value: AuthContextType = {
        user,
        companyInfo,
        isAuthenticated: !!user,
        isLoading,
        login: handleLogin,
        signup: handleSignup,
        logout: handleLogout,
        refreshCompanyInfo: handleRefreshCompanyInfo,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
