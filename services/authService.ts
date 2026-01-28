/**
 * Authentication Service
 * Handles login and token management using localStorage
 * Connects to secure backend API with JWT authentication
 */

export interface User {
    id: string;
    email: string;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface SignupCredentials {
    email: string;
    password: string;
    name: string;
    companyName: string;
    companyAddress: string;
    invoiceFormat?: string;
    companyLogo: File | null;
    bankDetails: {
        bankName: string;
        accountNumber: string;
        accountHolderName: string;
        ifscCode: string;
        branchName?: string;
        branchCode?: string;
        accountType?: string;
    };
}

export interface CompanyInfo {
    id: string;
    companyName: string;
    companyAddress: string;
    companyLogoUrl: string;
    invoiceFormat?: string;
    bankDetails: {
        bankName: string;
        accountNumber: string;
        accountHolderName: string;
        ifscCode: string;
        branchName?: string;
        branchCode?: string;
        accountType?: string;
    };
}

interface SignupResponse {
    token: string;
    userId: string;
    email: string;
    companyInfo: CompanyInfo;
}

const TOKEN_KEY = 'authToken';
const USER_KEY = 'authUser';
const COMPANY_INFO_KEY = 'companyInfo';

// API base URL
const AUTH_API_URL = import.meta.env?.VITE_API_URL?.replace('/api/invoices', '') || 'http://localhost:8081';

interface ApiResponse<T> {
    success: boolean;
    message: string;
    data?: T;
    error?: string;
}

interface LoginResponse {
    token: string;
    userId: string;
    email: string;
}

/**
 * Get stored token from localStorage
 */
export const getToken = (): string | null => {
    return localStorage.getItem(TOKEN_KEY);
};

/**
 * Get stored user from localStorage
 */
export const getUser = (): User | null => {
    const userStr = localStorage.getItem(USER_KEY);
    if (!userStr) return null;
    try {
        return JSON.parse(userStr);
    } catch {
        return null;
    }
};

/**
 * Check if user is authenticated (token exists)
 */
export const isAuthenticated = (): boolean => {
    return !!getToken();
};

/**
 * Validate token with backend
 */
export const validateToken = async (token: string): Promise<boolean> => {
    try {
        // Add timeout to prevent infinite loading
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

        const response = await fetch(`${AUTH_API_URL}/api/auth/validate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token }),
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            return false;
        }

        const result: ApiResponse<boolean> = await response.json();
        return result.success && result.data === true;
    } catch (error) {
        console.error('Token validation error:', error);
        return false;
    }
};

/**
 * Login user - calls secure backend API
 * Password is NEVER stored on frontend
 */
export const login = async (credentials: LoginCredentials): Promise<{ token: string; user: User }> => {
    // Validate inputs (client-side validation is for UX only, backend validates strictly)
    if (!credentials.email || !credentials.password) {
        throw new Error('Email and password are required');
    }

    const response = await fetch(`${AUTH_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            email: credentials.email.trim(),
            password: credentials.password, // Password sent securely, never stored
        }),
    });

    // Handle non-OK responses properly
    if (!response.ok) {
        let errorMessage = 'Login failed';
        try {
            const errorResult: ApiResponse<LoginResponse> = await response.json();
            errorMessage = errorResult.error || errorResult.message || `Login failed: ${response.status} ${response.statusText}`;
        } catch (parseError) {
            // If response is not JSON, use status text
            errorMessage = `Login failed: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
    }

    const result: ApiResponse<LoginResponse> = await response.json();

    if (!result.success || !result.data) {
        // Extract error message from API response
        const errorMessage = result.error || result.message || 'Login failed';
        throw new Error(errorMessage);
    }

    const { token, userId, email } = result.data;

    // Store token and minimal user info (NO password)
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify({ id: userId, email }));

    return {
        token,
        user: { id: userId, email },
    };
};

/**
 * Get stored company info from localStorage
 */
export const getCompanyInfo = (): CompanyInfo | null => {
    const companyStr = localStorage.getItem(COMPANY_INFO_KEY);
    if (!companyStr) return null;
    try {
        return JSON.parse(companyStr);
    } catch {
        return null;
    }
};

/**
 * Fetch company info from backend API
 */
export const fetchCompanyInfo = async (): Promise<CompanyInfo | null> => {
    try {
        const token = getToken();
        if (!token) {
            return null;
        }

        const response = await fetch(`${AUTH_API_URL}/api/auth/company-info`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            console.warn('Failed to fetch company info:', response.status);
            return null;
        }

        const result: ApiResponse<CompanyInfo> = await response.json();

        if (result.success && result.data) {
            // Store in localStorage
            localStorage.setItem(COMPANY_INFO_KEY, JSON.stringify(result.data));
            return result.data;
        }

        return null;
    } catch (error) {
        console.error('Error fetching company info:', error);
        return null;
    }
};

/**
 * Check if backend server is reachable
 */
export const checkBackendHealth = async (): Promise<boolean> => {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

        const response = await fetch(`${AUTH_API_URL}/api/auth/health`, {
            method: 'GET',
            signal: controller.signal,
        });

        clearTimeout(timeoutId);
        return response.ok;
    } catch (error) {
        console.error('Backend health check failed:', error);
        return false;
    }
};

/**
 * Signup new user - calls secure backend API
 * Password is NEVER stored on frontend
 */
export const signup = async (credentials: SignupCredentials): Promise<{ token: string; user: User; companyInfo: CompanyInfo }> => {
    // First check if backend is reachable
    const isBackendHealthy = await checkBackendHealth();
    if (!isBackendHealthy) {
        throw new Error(
            `Cannot connect to backend server at ${AUTH_API_URL}. ` +
            `Please make sure the backend is running. ` +
            `To start: cd backend && mvn spring-boot:run`
        );
    }
    // Validate inputs (client-side validation is for UX only, backend validates strictly)
    if (!credentials.email || !credentials.password || !credentials.name) {
        throw new Error('Email, password, and name are required');
    }
    if (!credentials.companyName || !credentials.companyAddress) {
        throw new Error('Company name and address are required');
    }
    if (!credentials.bankDetails.bankName || !credentials.bankDetails.accountNumber ||
        !credentials.bankDetails.accountHolderName || !credentials.bankDetails.ifscCode) {
        throw new Error('Bank details are required');
    }
    if (credentials.password.length < 6) {
        throw new Error('Password must be at least 6 characters');
    }

    // Create FormData for multipart/form-data request
    const formData = new FormData();
    formData.append('email', credentials.email.trim());
    formData.append('password', credentials.password);
    formData.append('name', credentials.name.trim());
    formData.append('companyName', credentials.companyName.trim());
    formData.append('companyAddress', credentials.companyAddress.trim());
    if (credentials.invoiceFormat) {
        formData.append('invoiceFormat', credentials.invoiceFormat);
    }
    if (credentials.companyLogo) {
        formData.append('companyLogo', credentials.companyLogo);
    }

    formData.append('bankName', credentials.bankDetails.bankName.trim());
    formData.append('accountNumber', credentials.bankDetails.accountNumber.trim());
    formData.append('accountHolderName', credentials.bankDetails.accountHolderName.trim());
    formData.append('ifscCode', credentials.bankDetails.ifscCode.trim());
    // Only append optional fields if they have values
    if (credentials.bankDetails.branchName && credentials.bankDetails.branchName.trim()) {
        formData.append('branchName', credentials.bankDetails.branchName.trim());
    }
    if (credentials.bankDetails.branchCode && credentials.bankDetails.branchCode.trim()) {
        formData.append('branchCode', credentials.bankDetails.branchCode.trim());
    }
    if (credentials.bankDetails.accountType && credentials.bankDetails.accountType.trim()) {
        formData.append('accountType', credentials.bankDetails.accountType.trim());
    }

    // Log FormData contents for debugging (without sensitive data)
    console.log('Signup FormData keys:', Array.from(formData.keys()));
    console.log('FormData has companyLogo:', formData.has('companyLogo'));

    let response: Response;
    let result: ApiResponse<SignupResponse>;

    try {
        response = await fetch(`${AUTH_API_URL}/api/auth/signup`, {
            method: 'POST',
            body: formData, // Don't set Content-Type header, browser will set it with boundary
        });
    } catch (networkError) {
        // Network error (CORS, connection refused, etc.)
        console.error('Network error during signup:', networkError);
        throw new Error(`Failed to connect to server. Please check if the backend is running at ${AUTH_API_URL}`);
    }

    // Check if response is ok before trying to parse JSON
    if (!response.ok) {
        // Try to parse error response
        let errorMessage = `Signup failed: ${response.status}`;
        try {
            const errorText = await response.text();
            console.error('Backend error response:', errorText);

            // Try to parse as JSON
            try {
                const errorJson = JSON.parse(errorText);
                errorMessage = errorJson.error || errorJson.message || errorMessage;

                // If there's a detailed error message, use it
                if (errorJson.data && typeof errorJson.data === 'string') {
                    errorMessage = errorJson.data;
                } else if (errorJson.message && errorJson.message !== 'Signup failed') {
                    errorMessage = errorJson.message;
                }
            } catch (jsonParseError) {
                // If it's not JSON, use the text as error message
                if (errorText && errorText.trim().length > 0) {
                    errorMessage = errorText;
                }
            }
        } catch (textError) {
            console.error('Failed to read error response:', textError);
            errorMessage = `Signup failed: ${response.status} ${response.statusText}`;
        }

        throw new Error(errorMessage);
    }

    try {
        const responseText = await response.text();
        console.log('Backend response:', responseText);
        result = JSON.parse(responseText);
    } catch (parseError) {
        console.error('Failed to parse response:', parseError);
        throw new Error('Invalid response from server. Please try again.');
    }

    if (!result.success || !result.data) {
        const errorMessage = result.error || result.message || 'Signup failed';
        throw new Error(errorMessage);
    }

    const { token, userId, email, companyInfo } = result.data;

    // Store token, user info, and company info (NO password)
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify({ id: userId, email }));
    localStorage.setItem(COMPANY_INFO_KEY, JSON.stringify(companyInfo));

    return {
        token,
        user: { id: userId, email },
        companyInfo,
    };
};

/**
 * Update company info - handles Base64 logo conversion in backend
 */
export const updateCompanyInfo = async (credentials: Partial<SignupCredentials>): Promise<CompanyInfo> => {
    const token = getToken();
    if (!token) throw new Error('Not authenticated');

    const formData = new FormData();
    if (credentials.companyName) formData.append('companyName', credentials.companyName.trim());
    if (credentials.companyAddress) formData.append('companyAddress', credentials.companyAddress.trim());
    if (credentials.invoiceFormat) formData.append('invoiceFormat', credentials.invoiceFormat);
    if (credentials.companyLogo) formData.append('companyLogo', credentials.companyLogo);

    if (credentials.bankDetails) {
        if (credentials.bankDetails.bankName) formData.append('bankName', credentials.bankDetails.bankName.trim());
        if (credentials.bankDetails.accountNumber) formData.append('accountNumber', credentials.bankDetails.accountNumber.trim());
        if (credentials.bankDetails.accountHolderName) formData.append('accountHolderName', credentials.bankDetails.accountHolderName.trim());
        if (credentials.bankDetails.ifscCode) formData.append('ifscCode', credentials.bankDetails.ifscCode.trim());
        if (credentials.bankDetails.branchName) formData.append('branchName', credentials.bankDetails.branchName.trim());
        if (credentials.bankDetails.branchCode) formData.append('branchCode', credentials.bankDetails.branchCode.trim());
        if (credentials.bankDetails.accountType) formData.append('accountType', credentials.bankDetails.accountType.trim());
    }

    const response = await fetch(`${AUTH_API_URL}/api/auth/update-company`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: formData
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Update failed: ${errorText || response.statusText}`);
    }

    const result: ApiResponse<CompanyInfo> = await response.json();
    if (!result.success || !result.data) {
        throw new Error(result.error || 'Update failed');
    }

    // Update local storage
    localStorage.setItem(COMPANY_INFO_KEY, JSON.stringify(result.data));
    return result.data;
};

/**
 * Logout user - clears all authentication data
 */
export const logout = (): void => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(COMPANY_INFO_KEY);
};

