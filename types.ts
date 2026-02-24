export interface ServiceItem {
  id: string;
  description: string;
  hours: number;
  rate: number;
}

export type Country = 'india' | 'japan';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  poNumber?: string; // Added field
  fromEmail?: string; // Added From Email field
  clientType?: 'company' | 'employee'; // Added clientType
  dueDate: string;
  company: string;
  employeeName: string;
  signatureUrl?: string;

  employeeEmail: string;
  employeeAddress: string;
  employeeMobile: string;
  services: ServiceItem[];
  taxRate?: number;
  cgstRate?: number;
  sgstRate?: number;
  showConsumptionTax?: boolean;
  roundOff?: number;
  finalAmount?: number;
  country?: Country; // Country for tax calculation
  userId?: string; // For data isolation
  companyInfo?: CompanyInfo; // Snapshot of company details at creation time
}

// Company and Bank Details Types
export interface BankDetails {
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
  ifscCode: string;
  swiftCode?: string; // Optional Swift Code for Japan/International
  branchName?: string;
  branchCode?: string;
  accountType?: string;
}

export interface CompanyInfo {
  id: string;
  companyName: string;
  companyAddress: string;
  signatureUrl?: string;
  companyLogoUrl: string;
  invoiceFormat?: string;
  bankDetails: BankDetails;
}
