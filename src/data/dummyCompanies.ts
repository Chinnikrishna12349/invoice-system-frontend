import { CompanyInfo, BankDetails } from '../../types';
import { VISION_AI_LOGO_BASE64 } from '../assets/visionAiLogoBase64';

export interface DummyCompany extends Omit<CompanyInfo, 'id' | 'userId' | 'createdAt' | 'updatedAt'> {
    id: string; // Dummy ID
    currency: 'INR' | 'JPY' | 'USD';
    fromEmail?: string; // Added fromEmail for auto-population
}

export interface DummyClient {
    id: string;
    companyName: string;
    address: string;
    email: string;
    phone: string;
    contactPerson: string;
    country: 'india' | 'japan';
    bankDetails?: BankDetails;
}

export const FROM_COMPANIES: DummyCompany[] = [
    {
        id: 'comp_vision_ai',
        companyName: 'Vision AI LLC',
        companyAddress: '305-0861, Ibaraki-Ken, Tsukuba-Shi, Yatabe 1077-58',
        companyLogoUrl: VISION_AI_LOGO_BASE64,
        invoiceFormat: 'INV-VI-',
        currency: 'JPY',
        fromEmail: 'billing@vision-ai.jp', // Added fromEmail
        bankDetails: {
            bankName: 'ＧＭＯあおぞらネット銀行',
            accountNumber: '2165551',
            accountHolderName: 'VISION AI',
            ifscCode: '',
            branchName: '法人第二営業部',
            branchCode: '002',
            accountType: '普通口座'
        }
    },
    {
        id: 'comp_ideal_folks',
        companyName: 'Ideal Folks LLC',
        companyAddress: '106-0044, Tokyo, Minato-Ku, Highashiazabu 3-4-17, Higashi Azabu K Building 3F',
        companyLogoUrl: '',
        invoiceFormat: 'INV-IF-',
        currency: 'JPY',
        fromEmail: 'accounts@idealfolks.com',
        bankDetails: {
            bankName: 'Sumitomo Mitsui Banking Corporation',
            accountNumber: '1234567',
            accountHolderName: 'IDEAL FOLKS',
            ifscCode: '',
            branchName: 'Azabu Branch',
            branchCode: '123',
            accountType: 'Savings'
        }
    },
    {
        id: 'comp_vcas',
        companyName: 'VCAS Consulting LLC',
        companyAddress: '210-0025, Kanagawa-Ken, Kawasaki-Shi, Kawasaki-Ku, Shimonamiki 11-5, Kawasaki Sight City 4-809',
        companyLogoUrl: '',
        invoiceFormat: 'INV-VCAS-',
        currency: 'JPY',
        fromEmail: 'finance@vcasconsulting.com',
        bankDetails: {
            bankName: 'Mizuho Bank',
            accountNumber: '7654321',
            accountHolderName: 'VCAS CONSULTING',
            ifscCode: '',
            branchName: 'Kawasaki Branch',
            branchCode: '456',
            accountType: 'Current'
        }
    }

];

export const TO_COMPANIES: DummyClient[] = [
    {
        id: 'client_kk_blue',
        companyName: 'KK Blue Arbarao',
        address: '106-0044, Tokyo, Minato-Ku, Highashiazabu 1-9-11',
        contactPerson: 'Manager',
        email: 'soumu@blue-arbaro.tokyo',
        phone: '+81-3-6555-2183',
        country: 'japan'
    },
    {
        id: 'client_ideal_folks',
        companyName: 'Ideal Folks LLC',
        address: '106-0044, Tokyo, Minato-Ku, Highashiazabu 3-4-17, Higashi Azabu K Building 3F',
        contactPerson: 'Manager',
        email: 'info@idealfolks.com',
        phone: '+81-3-6876-0591',
        country: 'japan'
    },
    {
        id: 'client_vcas',
        companyName: 'VCAS Consulting LLC',
        address: '210-0025, Kanagawa-Ken, Kawasaki-Shi, Kawasaki-Ku, Shimonamiki 11-5, Kawasaki Sight City 4-809',
        contactPerson: 'Manager',
        email: 'business@vcasconsulting.com',
        phone: '+81-4-4400-1821',
        country: 'japan'
    }
];

export const TO_EMPLOYEES: DummyClient[] = [];
