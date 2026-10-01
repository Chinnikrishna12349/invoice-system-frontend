/**
 * Country preference service for persisting user's country selection
 */

export type Country = 'india' | 'japan' | 'international';

const COUNTRY_PREFERENCE_KEY = 'userCountryPreference';

/**
 * Get stored country preference from localStorage
 * Defaults to 'india' if not set
 */
export const getCountryPreference = (): Country => {
    const stored = localStorage.getItem(COUNTRY_PREFERENCE_KEY);
    if (stored === 'india' || stored === 'japan' || stored === 'international') {
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
    const safeSubTotal = (subTotal !== null && subTotal !== undefined && !isNaN(Number(subTotal))) ? Number(subTotal) : 0;
    const safeTaxRate = (taxRate !== null && taxRate !== undefined && !isNaN(Number(taxRate))) ? Number(taxRate) : 0;

    if (country === 'japan') {
        const consumptionTaxRate = safeTaxRate;
        const consumptionTaxAmount = safeSubTotal * (consumptionTaxRate / 100);
        const grandTotal = safeSubTotal + consumptionTaxAmount;

        return {
            subTotal: safeSubTotal,
            taxAmount: consumptionTaxAmount,
            grandTotal,
            consumptionTaxRate,
            consumptionTaxAmount,
        };
    } else if (country === 'international') {
        // International invoices typically have 0% local tax
        return {
            subTotal: safeSubTotal,
            taxAmount: 0,
            grandTotal: safeSubTotal,
        };
    } else {
        // India: CGST + SGST
        // Use manual rates if provided, otherwise split taxRate
        const cgstRate = cgstRateManual !== undefined ? cgstRateManual : safeTaxRate / 2;
        const sgstRate = sgstRateManual !== undefined ? sgstRateManual : safeTaxRate / 2;

        // Round each component to 2 decimal places to ensure displayed sum matches total
        const cgstAmount = Math.round((safeSubTotal * (cgstRate / 100)) * 100) / 100;
        const sgstAmount = Math.round((safeSubTotal * (sgstRate / 100)) * 100) / 100;
        const grandTotal = safeSubTotal + cgstAmount + sgstAmount;

        return {
            subTotal: safeSubTotal,
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
    return country === 'japan' ? '¥' : country === 'international' ? '$' : '₹';
};

/**
 * Format amount with currency symbol safely preventing null/undefined crashes
 */
export const formatCurrency = (amount: number, country: Country = 'india', showDecimals: boolean = true, includeSymbol: boolean = true): string => {
    const symbol = getCurrencySymbol(country);
    const safeAmount = (amount !== null && amount !== undefined && !isNaN(Number(amount))) ? Number(amount) : 0;

    let formattedNumber = '';
    if (country === 'japan') {
        const val = showDecimals ? safeAmount : Math.round(safeAmount);
        formattedNumber = val.toLocaleString('ja-JP', {
            minimumFractionDigits: showDecimals ? 2 : 0,
            maximumFractionDigits: showDecimals ? 2 : 0
        });
    } else if (country === 'international') {
        formattedNumber = safeAmount.toLocaleString('en-US', {
            minimumFractionDigits: showDecimals ? 2 : 0,
            maximumFractionDigits: showDecimals ? 2 : 0
        });
    } else {
        formattedNumber = safeAmount.toLocaleString('en-IN', {
            minimumFractionDigits: showDecimals ? 2 : 0,
            maximumFractionDigits: showDecimals ? 2 : 0
        });
    }

    return includeSymbol ? `${symbol}${formattedNumber}` : formattedNumber;
};

/**
 * Standardize date format to DD/MM/YYYY safely
 */
export const formatDate = (date: string | Date): string => {
    if (!date) return '';
    if (typeof date === 'string') {
        const match = date.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (match) {
            const [, year, month, day] = match;
            return `${day}/${month}/${year}`;
        }
    }
    const d = new Date(date);
    if (isNaN(d.getTime())) return String(date || '');
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
};



