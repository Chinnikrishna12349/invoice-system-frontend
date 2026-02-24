/**
 * Country preference service for persisting user's country selection
 */

export type Country = 'india' | 'japan';

const COUNTRY_PREFERENCE_KEY = 'userCountryPreference';

/**
 * Get stored country preference from localStorage
 * Defaults to 'india' if not set
 */
export const getCountryPreference = (): Country => {
    const stored = localStorage.getItem(COUNTRY_PREFERENCE_KEY);
    if (stored === 'india' || stored === 'japan') {
        return stored;
    }
    return 'india'; // Default to India
};

/**
 * Save country preference to localStorage
 */
export const setCountryPreference = (country: Country): void => {
    localStorage.setItem(COUNTRY_PREFERENCE_KEY, country);
};

/**
 * Tax calculation utilities based on country
 */
export interface TaxCalculationResult {
    subTotal: number;
    taxAmount: number;
    grandTotal: number;
    cgstRate?: number;
    sgstRate?: number;
    cgstAmount?: number;
    sgstAmount?: number;
    consumptionTaxRate?: number;
    consumptionTaxAmount?: number;
}

/**
 * Calculate tax based on country
 * @param subTotal - Subtotal amount
 * @param taxRate - Tax rate percentage
 * @param country - Country ('india' or 'japan')
 */
export const calculateTax = (
    subTotal: number,
    taxRate: number = 0,
    country: Country = 'india',
    cgstRateManual?: number,
    sgstRateManual?: number
): TaxCalculationResult => {
    if (country === 'japan') {
        const consumptionTaxRate = taxRate;
        const consumptionTaxAmount = subTotal * (consumptionTaxRate / 100);
        const grandTotal = subTotal + consumptionTaxAmount;

        return {
            subTotal,
            taxAmount: consumptionTaxAmount,
            grandTotal,
            consumptionTaxRate,
            consumptionTaxAmount,
        };
    } else {
        // India: CGST + SGST
        // Use manual rates if provided, otherwise split taxRate
        const cgstRate = cgstRateManual !== undefined ? cgstRateManual : taxRate / 2;
        const sgstRate = sgstRateManual !== undefined ? sgstRateManual : taxRate / 2;

        // Round each component to 2 decimal places to ensure displayed sum matches total
        const cgstAmount = Math.round((subTotal * (cgstRate / 100)) * 100) / 100;
        const sgstAmount = Math.round((subTotal * (sgstRate / 100)) * 100) / 100;
        const grandTotal = subTotal + cgstAmount + sgstAmount;

        return {
            subTotal,
            taxAmount: cgstAmount + sgstAmount,
            grandTotal,
            cgstRate,
            sgstRate,
            cgstAmount,
            sgstAmount,
        };

    }
};

/**
 * Get currency symbol based on country
 */
export const getCurrencySymbol = (country: Country = 'india'): string => {
    return country === 'japan' ? '¥' : '₹';
};

/**
 * Format amount with currency symbol
 */
export const formatCurrency = (amount: number, country: Country = 'india', showDecimals: boolean = true, includeSymbol: boolean = true): string => {
    const symbol = getCurrencySymbol(country);

    let formattedNumber = '';
    if (country === 'japan') {
        const val = Math.round(amount);
        formattedNumber = val.toLocaleString('ja-JP', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });
    } else {
        formattedNumber = amount.toLocaleString('en-IN', {
            minimumFractionDigits: showDecimals ? 2 : 0,
            maximumFractionDigits: showDecimals ? 2 : 0
        });
    }

    return includeSymbol ? `${symbol}${formattedNumber}` : formattedNumber;
};

/**
 * Standardize date format to DD/MM/YYYY
 */
export const formatDate = (date: string | Date): string => {
    const d = new Date(date);
    if (isNaN(d.getTime())) return String(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
};

