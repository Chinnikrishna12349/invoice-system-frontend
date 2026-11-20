import visionAiStamp from '../assets/visionai-stamp.png';
import { VISION_AI_LOGO_BASE64 } from '../assets/visionAiLogoBase64';
import { Invoice } from '../../types';

export const mapInvoiceToLayoutProps = (invoice: Invoice) => {
    const subTotal = (invoice.services || []).reduce((sum, s) => {
        const hrs = Number(s?.hours) || 0;
        const rt = Number(s?.rate) || 0;
        return sum + Math.round((hrs * rt) * 100) / 100;
    }, 0);

    const country = (invoice.country || 'india') as any;
    const shouldCalculateTax = country === 'india' || (country === 'japan' && invoice.showConsumptionTax);
    const taxRate = Number(invoice.taxRate) || (country === 'japan' ? 10 : 18);

    let calculatedTax = 0;
    if (country === 'japan') {
        calculatedTax = shouldCalculateTax ? Math.round((subTotal * (taxRate / 100)) * 100) / 100 : 0;
    } else if (country === 'india') {
        const cgst = Math.round((subTotal * (Number(invoice.cgstRate ?? (taxRate / 2)) / 100)) * 100) / 100;
        const sgst = Math.round((subTotal * (Number(invoice.sgstRate ?? (taxRate / 2)) / 100)) * 100) / 100;
        calculatedTax = cgst + sgst;
    }

    const rawRoundOff = Number(invoice.roundOff);
    const roundOff = (invoice.roundOff !== null && invoice.roundOff !== undefined && !isNaN(rawRoundOff)) ? rawRoundOff : 0;

    const parsedFinal = Number(invoice.finalAmount);
    const grandTotal = (invoice.finalAmount !== null && invoice.finalAmount !== undefined && !isNaN(parsedFinal) && parsedFinal > 0)
        ? parsedFinal
        : (country === 'japan' ? Math.round(subTotal + calculatedTax + roundOff) : Math.round((subTotal + calculatedTax + roundOff) * 100) / 100);

    const taxAmount = calculatedTax;

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
            shift: s.shift,
            percentage: s.percentage
        })),
        subtotal: subTotal,
        taxRate: invoice.taxRate || (invoice.cgstRate || 0) + (invoice.sgstRate || 0),
        taxAmount: taxAmount,
        grandTotal: grandTotal,
        roundOff: roundOff,
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
