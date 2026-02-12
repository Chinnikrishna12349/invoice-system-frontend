/**
 * Production-safe logger utility
 * Logs only in development mode, suppresses in production
 */

const isDev = import.meta.env?.DEV || import.meta.env?.MODE === 'development';

export const logger = {
    log: (...args: any[]) => {
        if (isDev) {
            console.log(...args);
        }
    },

    warn: (...args: any[]) => {
        if (isDev) {
            console.warn(...args);
        }
    },

    error: (...args: any[]) => {
        // Always log errors, even in production
        console.error(...args);
    },

    info: (...args: any[]) => {
        if (isDev) {
            console.info(...args);
        }
    },

    debug: (...args: any[]) => {
        if (isDev) {
            console.debug(...args);
        }
    }
};

// Export a function to check if we're in development mode
export const isDevMode = () => isDev;
