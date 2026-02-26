import { getToken } from './authService';

const getBaseUrl = () => {
    const envUrl = import.meta.env?.VITE_API_URL;
    if (envUrl && envUrl !== 'https://invoice-system-backend-owhd.onrender.com/api/invoices') {
        return envUrl.replace('/api/invoices', '');
    }
    return import.meta.env?.DEV ? 'http://localhost:8085' : 'https://invoice-system-backend-owhd.onrender.com';
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
        if (!response.ok) throw new Error('Failed to fetch bank accounts');
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
        if (!response.ok) throw new Error('Failed to save bank account');
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
        if (!response.ok) throw new Error('Failed to update bank account');
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
        if (!response.ok) throw new Error('Failed to delete bank account');
    }
};
