import { getToken } from './authService';

const getBaseUrl = () => {
    // Priority 1: Explicitly defined VITE_API_URL or VITE_API_BASE_URL
    const explicitUrl = import.meta.env?.VITE_API_URL || import.meta.env?.VITE_API_BASE_URL;

    if (explicitUrl) {
        if (explicitUrl.includes('/api/invoices')) {
            return explicitUrl.replace('/api/invoices', '');
        }
        if (explicitUrl.startsWith('http')) {
            return explicitUrl;
        }
    }

    // Priority 2: Hardcoded Production URL for this specific project
    const PROD_URL = 'https://invoice-system-backend-owhd.onrender.com';

    // Priority 3: Localhost fallback
    return import.meta.env?.DEV ? 'http://localhost:8085' : PROD_URL;
};

const API_URL = `${getBaseUrl()}/api/bank-accounts`;

export interface BankAccount {
    id: string;
    bankName: string;
    accountNumber: string;
    accountHolderName: string;
    ifscCode: string;
    swiftCode?: string;
    branchName: string;
    branchCode: string;
    accountType?: string;
    userId: string;
}

export const bankAccountService = {
    getAll: async (userId?: string): Promise<BankAccount[]> => {
        const token = getToken();
        const url = userId ? `${API_URL}?userId=${userId}` : API_URL;
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to fetch bank accounts (${response.status}): ${errorText || response.statusText}`);
        }
        return response.json();
    },

    save: async (data: Omit<BankAccount, 'id'>): Promise<BankAccount> => {
        const token = getToken();
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to save bank account (${response.status}): ${errorText || response.statusText}`);
        }
        return response.json();
    },

    update: async (id: string, data: Partial<BankAccount>): Promise<BankAccount> => {
        const token = getToken();
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to update bank account (${response.status}): ${errorText || response.statusText}`);
        }
        return response.json();
    },

    delete: async (id: string): Promise<void> => {
        const token = getToken();
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to delete bank account (${response.status}): ${errorText || response.statusText}`);
        }
    }
};
