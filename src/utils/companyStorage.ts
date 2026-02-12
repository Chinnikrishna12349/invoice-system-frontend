// Utility functions for managing hidden companies in localStorage

const HIDDEN_SENDERS_KEY = 'invoice_hidden_senders';
const HIDDEN_CLIENTS_KEY = 'invoice_hidden_clients';

export const getHiddenSenders = (): string[] => {
    try {
        const hidden = localStorage.getItem(HIDDEN_SENDERS_KEY);
        return hidden ? JSON.parse(hidden) : [];
    } catch {
        return [];
    }
};

export const getHiddenClients = (): string[] => {
    try {
        const hidden = localStorage.getItem(HIDDEN_CLIENTS_KEY);
        return hidden ? JSON.parse(hidden) : [];
    } catch {
        return [];
    }
};

export const hideSender = (id: string): void => {
    const hidden = getHiddenSenders();
    if (!hidden.includes(id)) {
        hidden.push(id);
        localStorage.setItem(HIDDEN_SENDERS_KEY, JSON.stringify(hidden));
    }
};

export const hideClient = (id: string): void => {
    const hidden = getHiddenClients();
    if (!hidden.includes(id)) {
        hidden.push(id);
        localStorage.setItem(HIDDEN_CLIENTS_KEY, JSON.stringify(hidden));
    }
};

export const unhideSender = (id: string): void => {
    const hidden = getHiddenSenders();
    const filtered = hidden.filter(h => h !== id);
    localStorage.setItem(HIDDEN_SENDERS_KEY, JSON.stringify(filtered));
};

export const unhideClient = (id: string): void => {
    const hidden = getHiddenClients();
    const filtered = hidden.filter(h => h !== id);
    localStorage.setItem(HIDDEN_CLIENTS_KEY, JSON.stringify(filtered));
};
