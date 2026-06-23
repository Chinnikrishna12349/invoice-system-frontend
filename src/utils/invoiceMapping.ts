import visionAiStamp from '../assets/visionai-stamp.png';
import { VISION_AI_LOGO_BASE64 } from '../assets/visionAiLogoBase64';
import { Invoice } from '../../types';

export const mapInvoiceToLayoutProps = (invoice: Invoice) => {
    const subTotal = (invoice.services || []).reduce((sum, s) => sum + (s.hours * s.rate), 0);
    const taxAmount = (invoice.finalAmount || 0) - (invoice.roundOff || 0) - subTotal;

    // Determine if it's Vision AI for specific branding
    const isVisionAI = invoice.companyInfo?.companyName === 'Vision AI LLC';
    let logoToUse = invoice.companyInfo?.companyLogoUrl || '';
    if (isVisionAI && (!logoToUse || (!logoToUse.startsWith('data:') && !logoToUse.startsWith('http')))) {
        logoToUse = VISION_AI_LOGO_BASE64;
    }

    return {
        invoiceNumber: invoice.invoiceNumber,
        poNumber: invoice.poNumber,
        date: invoice.date,
        dueDate: invoice.dueDate,
        from: {
            name: invoice.companyInfo?.companyName || invoice.company || '',
            address: invoice.companyInfo?.companyAddress ? invoice.companyInfo.companyAddress.split(/[\n,]+/).map(s => s.trim()).filter(Boolean) : [],
            gstin: '',
            phone: '',
            email: invoice.fromEmail || ''
        },
        billTo: {
            name: invoice.employeeName,
            email: invoice.employeeEmail,
            phone: invoice.employeeMobile,
            address: invoice.employeeAddress
        },
        items: (invoice.services || []).map((s, idx) => ({
            sno: idx + 1,
            description: s.description,
            hours: s.hours,
            unitPrice: s.rate,
            amount: s.hours * s.rate,
            overtime: s.overtime,
            shift: s.shift,
            percentage: s.percentage
        })),
        subtotal: subTotal,
        taxRate: invoice.taxRate || (invoice.cgstRate || 0) + (invoice.sgstRate || 0),
        taxAmount: taxAmount,
        grandTotal: invoice.finalAmount || 0,
        roundOff: invoice.roundOff,
        bankDetails: {
            bankName: invoice.companyInfo?.bankDetails?.bankName || '',
            accountName: invoice.companyInfo?.bankDetails?.accountHolderName || '',
            accountNumber: invoice.companyInfo?.bankDetails?.accountNumber || '',
            ifsc: invoice.companyInfo?.bankDetails?.ifscCode || '',
            swiftCode: invoice.companyInfo?.bankDetails?.swiftCode,
            bankCode: invoice.companyInfo?.bankDetails?.bankCode || '',
            branchName: invoice.companyInfo?.bankDetails?.branchName || '',
            branchCode: invoice.companyInfo?.bankDetails?.branchCode || '',
            accountType: invoice.companyInfo?.bankDetails?.accountType || ''
        },
        country: invoice.country as any,
        cgstRate: invoice.cgstRate,
        sgstRate: invoice.sgstRate,
        logoUrl: logoToUse,
        stampUrl: isVisionAI ? visionAiStamp : undefined,
        isVisionAI: isVisionAI,
        signatureUrl: invoice.signatureUrl
    };
};
