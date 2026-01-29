/**
 * API Service for Invoice Management Backend
 * Handles all HTTP requests to the Spring Boot backend
 */

import { Invoice } from '../types';

// Vite uses import.meta.env; fall back to localhost backend
// @ts-ignore - Vite provides import.meta.env at runtime
const API_BASE_URL = import.meta.env?.VITE_API_URL || 'https://invoice-system-backend-owhd.onrender.com/api/invoices';
const AUTH_API_URL = import.meta.env?.VITE_API_URL?.replace('/api/invoices', '') || 'https://invoice-system-backend-owhd.onrender.com';

/**
 * Get JWT token from localStorage
 */
const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

/**
 * Create headers with authentication token
 */
const createAuthHeaders = (): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

/**
 * Handle 401 Unauthorized responses - clear auth and redirect
 */
const handleUnauthorized = (): void => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('authUser');
  window.location.href = '/';
};

/**
 * Check response for 401 and handle accordingly
 */
const checkAuthError = (response: Response): void => {
  if (response.status === 401) {
    handleUnauthorized();
    throw new Error('Session expired. Please login again.');
  }
};

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

/**
 * Create a new invoice
 */
export const createInvoice = async (invoice: Invoice): Promise<Invoice> => {
  const response = await fetch(`${API_BASE_URL}`, {
    method: 'POST',
    headers: createAuthHeaders(),
    body: JSON.stringify(invoice),
  });

  checkAuthError(response);

  if (!response.ok) {
    throw new Error(`Failed to create invoice: ${response.statusText}`);
  }

  const result: ApiResponse<Invoice> = await response.json();
  if (!result.success) {
    throw new Error(result.error || 'Failed to create invoice');
  }

  return result.data!;
};

/**
 * Update an existing invoice
 */
export const updateInvoice = async (id: string, invoice: Invoice): Promise<Invoice> => {
  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: 'PUT',
    headers: createAuthHeaders(),
    body: JSON.stringify(invoice),
  });

  checkAuthError(response);

  if (!response.ok) {
    throw new Error(`Failed to update invoice: ${response.statusText}`);
  }

  const result: ApiResponse<Invoice> = await response.json();
  if (!result.success) {
    throw new Error(result.error || 'Failed to update invoice');
  }

  return result.data!;
};

/**
 * Get all invoices
 */
export const getAllInvoices = async (userId?: string): Promise<Invoice[]> => {
  const url = userId
    ? `${API_BASE_URL}?userId=${encodeURIComponent(userId)}`
    : API_BASE_URL;

  const response = await fetch(url, {
    method: 'GET',
    headers: createAuthHeaders(),
  });

  checkAuthError(response);

  if (!response.ok) {
    throw new Error(`Failed to fetch invoices: ${response.statusText}`);
  }

  const result: ApiResponse<Invoice[]> = await response.json();
  if (!result.success) {
    throw new Error(result.error || 'Failed to fetch invoices');
  }

  return result.data || [];
};

/**
 * Get a single invoice by ID
 */
export const getNextInvoiceNumber = async (userId: string): Promise<string> => {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/next-number?userId=${userId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  checkAuthError(response);

  if (!response.ok) {
    throw new Error('Failed to fetch next invoice number');
  }

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to fetch next invoice number');
  }
  return data.data;
};

export const getInvoiceById = async (id: string): Promise<Invoice> => {
  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: 'GET',
    headers: createAuthHeaders(),
  });

  checkAuthError(response);

  if (!response.ok) {
    throw new Error(`Failed to fetch invoice: ${response.statusText}`);
  }

  const result: ApiResponse<Invoice> = await response.json();
  if (!result.success) {
    throw new Error(result.error || 'Failed to fetch invoice');
  }

  return result.data!;
};

/**
 * Delete an invoice
 */
export const deleteInvoice = async (id: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: 'DELETE',
    headers: createAuthHeaders(),
  });

  checkAuthError(response);

  if (!response.ok) {
    throw new Error(`Failed to delete invoice: ${response.statusText}`);
  }

  const result: ApiResponse<void> = await response.json();
  if (!result.success) {
    throw new Error(result.error || 'Failed to delete invoice');
  }
};

/**
 * Download invoice as PDF
 */
export const downloadInvoicePdf = async (id: string, invoiceNumber: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/${id}/download`, {
    method: 'GET',
    headers: createAuthHeaders(),
  });

  checkAuthError(response);

  if (!response.ok) {
    throw new Error(`Failed to download PDF: ${response.statusText}`);
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Invoice_${invoiceNumber}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

/**
 * Get invoices for a specific employee
 */
export const getInvoicesByEmployeeId = async (employeeId: string): Promise<Invoice[]> => {
  const response = await fetch(`${API_BASE_URL}/employee/${employeeId}`, {
    method: 'GET',
    headers: createAuthHeaders(),
  });

  checkAuthError(response);

  if (!response.ok) {
    throw new Error(`Failed to fetch invoices: ${response.statusText}`);
  }

  const result: ApiResponse<Invoice[]> = await response.json();
  if (!result.success) {
    throw new Error(result.error || 'Failed to fetch invoices');
  }

  return result.data || [];
};

/**
 * Send invoice to customer email
 */
export const sendInvoiceByEmail = async (id: string, invoice: any, language: 'en' | 'ja' = 'en'): Promise<void> => {
  try {
    // Validate invoice has email
    if (!invoice.employeeEmail || !invoice.employeeEmail.trim()) {
      throw new Error('Invoice does not have a valid email address');
    }

    // Get company info from localStorage
    const { getCompanyInfo } = await import('./authService');
    const companyInfo = getCompanyInfo();

    // Generate PDF using the SAME function as download with selected language
    const { generateInvoicePDFBytes } = await import('./pdfService');
    const pdfBytes = await generateInvoicePDFBytes(invoice, language, companyInfo);

    if (import.meta.env?.DEV) {
      console.log('Generated PDF for email:', pdfBytes.length, 'bytes');
    }

    // If Uint8Array has a byteOffset, we need to create a new ArrayBuffer
    // Otherwise, use the buffer directly
    let arrayBuffer: ArrayBuffer;
    if (pdfBytes.byteOffset === 0 && pdfBytes.byteLength === pdfBytes.buffer.byteLength) {
      // Can use buffer directly
      arrayBuffer = pdfBytes.buffer as ArrayBuffer;
    } else {
      // Need to create a new ArrayBuffer with only the relevant bytes
      arrayBuffer = pdfBytes.buffer.slice(pdfBytes.byteOffset, pdfBytes.byteOffset + pdfBytes.byteLength) as ArrayBuffer;
    }

    // Send PDF bytes as ArrayBuffer with proper content type
    const headers: HeadersInit = {
      'Content-Type': 'application/octet-stream',
    };
    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (import.meta.env?.DEV) {
      console.log('Sending email request to:', `${API_BASE_URL}/${id}/send-email`);
      console.log('PDF size:', arrayBuffer.byteLength, 'bytes');
    }

    const response = await fetch(`${API_BASE_URL}/${id}/send-email`, {
      method: 'POST',
      headers,
      body: arrayBuffer,
    });

    checkAuthError(response);

    // Try to parse response as JSON, but handle non-JSON errors gracefully
    let errorMessage = `Failed to send email: ${response.status} ${response.statusText}`;

    if (!response.ok) {
      try {
        const errorResult = await response.json();
        if (errorResult.error) {
          errorMessage = errorResult.error;
        } else if (errorResult.message) {
          errorMessage = errorResult.message;
        }
      } catch (parseError) {
        // If response is not JSON, try to get text
        try {
          const errorText = await response.text();
          if (errorText) {
            errorMessage = errorText;
          }
        } catch (textError) {
          // Use default error message
        }
      }
      throw new Error(errorMessage);
    }

    // Parse successful response
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || result.message || 'Failed to send invoice email');
      }
    }

    if (import.meta.env?.DEV) {
      console.log('Email sent successfully');
    }
  } catch (error: any) {
    console.error('Error in sendInvoiceByEmail:', error);
    // Re-throw with a more descriptive message if it's not already an Error
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(error?.message || 'Failed to send invoice email');
  }
};
