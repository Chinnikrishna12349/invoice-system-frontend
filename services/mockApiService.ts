import { Invoice, ServiceItem } from '../types';

// Mock data for invoices
let mockInvoices: Invoice[] = [
  {
    id: '1',
    invoiceNumber: 'INV-2023-001',
    date: '2023-11-01',
    employeeName: 'John Doe',
    employeeId: 'emp-001',
    employeeEmail: 'john.doe@example.com',
    employeeAddress: '123 Main St, City, Country',
    employeeMobile: '+1234567890',
    services: [
      { id: '1', description: 'Web Development', hours: 10, rate: 100 },
      { id: '2', description: 'UI/UX Design', hours: 5, rate: 80 }
    ],
    taxRate: 10,
    dueDate: '2023-11-15',
    company: 'Example Corp'
  },
  {
    id: '2',
    invoiceNumber: 'INV-2023-002',
    date: '2023-11-10',
    employeeName: 'Jane Smith',
    employeeId: 'emp-002',
    employeeEmail: 'jane.smith@example.com',
    employeeAddress: '456 Oak St, City, Country',
    employeeMobile: '+1987654321',
    services: [
      { id: '3', description: 'Consulting', hours: 8, rate: 120 },
      { id: '4', description: 'Training', hours: 3, rate: 150 }
    ],
    taxRate: 15,
    dueDate: '2023-12-25',
    company: 'Ory Folks Pvt Ltd'
  }
];

// Helper function to simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const createInvoice = async (invoice: Invoice): Promise<Invoice> => {
  await delay(300); // Simulate network delay
  const newInvoice = {
    ...invoice,
    id: Math.random().toString(36).substr(2, 9), // Generate random ID
    invoiceNumber: `INV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`
  };
  mockInvoices.push(newInvoice);
  return newInvoice;
};

export const updateInvoice = async (id: string, invoice: Invoice): Promise<Invoice> => {
  await delay(300);
  const index = mockInvoices.findIndex(inv => inv.id === id);
  if (index === -1) {
    throw new Error('Invoice not found');
  }
  const updatedInvoice = { ...invoice, id };
  mockInvoices[index] = updatedInvoice;
  return updatedInvoice;
};

export const getAllInvoices = async (): Promise<Invoice[]> => {
  console.log('Fetching all invoices...');
  await delay(300);
  console.log('Returning invoices:', mockInvoices);
  return [...mockInvoices];
};

export const getInvoiceById = async (id: string): Promise<Invoice> => {
  await delay(300);
  const invoice = mockInvoices.find(inv => inv.id === id);
  if (!invoice) {
    throw new Error('Invoice not found');
  }
  return { ...invoice };
};

export const deleteInvoice = async (id: string): Promise<void> => {
  await delay(300);
  const initialLength = mockInvoices.length;
  mockInvoices = mockInvoices.filter(invoice => invoice.id !== id);
  if (mockInvoices.length === initialLength) {
    throw new Error('Invoice not found');
  }
};

export const downloadInvoicePdf = async (id: string, invoiceNumber: string): Promise<void> => {
  await delay(300);
  const invoice = mockInvoices.find(inv => inv.id === id);
  if (!invoice) {
    throw new Error('Invoice not found');
  }
  // In a real implementation, this would generate a PDF
  console.log(`Generating PDF for invoice ${invoiceNumber}`);
  return Promise.resolve();
};

export const getInvoicesByEmployeeId = async (employeeId: string): Promise<Invoice[]> => {
  await delay(300);
  // In a real implementation, this would filter by employee ID
  return [...mockInvoices];
};
