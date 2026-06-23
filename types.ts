export interface ServiceItem {
  id: string;
  overtime: string; // 'Normal Days' | 'Weekends' | 'Holidays'
  description: string;
  shift: string; // '9:00 AM – 10:00 PM' | '10:00 PM – 5:00 AM'
  hours: number;
  rate: number;
  percentage?: number;
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
  bankCode?: string; // 4-digit Bank Code for Japan
  branchName?: string;
  branchCode?: string;
  accountType?: string;
}

export interface CompanyInfo {
  id?: string;
  companyName: string;
  companyAddress: string;
  signatureUrl?: string;
  companyLogoUrl?: string;
  fromEmail?: string;
  invoiceFormat?: string;
  bankDetails?: BankDetails;
}

export interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
  ifscCode: string;
  swiftCode?: string;
  bankCode: string; // Added Bank Code
  branchName: string;
  branchCode: string;
  accountType?: string;
  userId: string;
}
