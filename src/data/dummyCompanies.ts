import { CompanyInfo } from '../../types';
import { VISION_AI_LOGO_BASE64 } from '../assets/visionAiLogoBase64';

export interface DummyCompany extends Omit<CompanyInfo, 'id' | 'userId' | 'createdAt' | 'updatedAt'> {
    id: string; // Dummy ID
    currency: 'INR' | 'JPY' | 'USD';
}

export interface DummyClient {
    id: string;
    companyName: string;
    address: string;
    email: string;
    phone: string;
    contactPerson: string;
    country: 'india' | 'japan';
}

export const FROM_COMPANIES: DummyCompany[] = [
    {
        id: 'comp_vision_ai',
        companyName: 'Vision AI LLC',
        companyAddress: '305-0861, Ibaraki-Ken, Tsukuba-Shi, Yatabe 1077-58',
        companyLogoUrl: VISION_AI_LOGO_BASE64,
        invoiceFormat: 'VAI-',
        currency: 'JPY',
        bankDetails: {
            bankName: 'ＧＭＯあおぞらネット銀行 法人第二営業部',
            accountNumber: '2165551',
            accountHolderName: 'ヴイシオン　エイ',
            ifscCode: '',
            branchName: '法人第二営業部',
            accountType: '普通口座'
        }
    },
    {
        id: 'comp_ideal_folks',
        companyName: 'Ideal Folks LLC',
        companyAddress: '106-0044, Tokyo, Minato-Ku, Highashiazabu 3-4-17, Higashi Azabu K Building 3F',
        companyLogoUrl: '',
        invoiceFormat: 'IFL-',
        currency: 'JPY',
        bankDetails: {
            bankName: '',
            accountNumber: '',
            accountHolderName: '',
            ifscCode: '',
            branchName: '',
            accountType: ''
        }
    },
    {
        id: 'comp_vcas',
        companyName: 'VCAS Consulting LLC',
        companyAddress: '210-0025, Kanagawa-Ken, Kawasaki-Shi, Kawasaki-Ku, Shimonamiki 11-5, Kawasaki Sight City 4-809',
        companyLogoUrl: '',
        invoiceFormat: 'VCS-',
        currency: 'JPY',
        bankDetails: {
            bankName: '',
            accountNumber: '',
            accountHolderName: '',
            ifscCode: '',
            branchName: '',
            accountType: ''
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
    }
];
