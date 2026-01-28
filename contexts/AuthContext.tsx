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
            const { user: newUser, companyInfo: newCompanyInfo } = await signup(credentials);
            setUser(newUser);
            setCompanyInfo(newCompanyInfo);
            navigate('/dashboard');
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
