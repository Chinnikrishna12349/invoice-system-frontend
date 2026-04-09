import { Invoice, CompanyInfo } from '../types';
import { calculateTax, Country, formatCurrency, formatDate } from '../services/countryPreferenceService';
import jsPDF from 'jspdf';
import i18n from '../src/i18n/i18n';
import { configureJapaneseFont, renderJapaneseText } from './japaneseFontSupport';
import { getCompanyInfo } from './authService';
import { toKatakana } from '../src/utils/katakanaConverter';
import visionAiStamp from '../src/assets/visionai-stamp.png';
import placeholderLogo from '../src/assets/oryfolks-logo.svg';
import { VISION_AI_LOGO_BASE64 } from '../src/assets/visionAiLogoBase64';

// Helper function to add text to PDF (handles Japanese properly using html2canvas)
const addTextToPdf = async (
    doc: jsPDF,
    text: string,
    x: number,
    y: number,
    options: {
        fontSize?: number;
        fontStyle?: 'normal' | 'bold';
        align?: 'left' | 'center' | 'right';
        language?: 'en' | 'ja';
        maxWidth?: number;
        baseline?: 'top' | 'bottom' | 'middle' | 'alphabetic' | 'hanging' | 'ideographic';
    } = {}
): Promise<number> => {
    const { fontSize = 10, fontStyle = 'normal', align = 'left', language = 'en', maxWidth = 100, baseline = 'top' } = options;

    // Check for Japanese characters OR specific currency symbols (¥, ₹)
    // In Japanese mode, force ALL text (including colons and values) through the image renderer
    // to ensure 100% baseline parity between labels, colons, and data.
    const hasJapanese = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff66-\uff9f]/.test(text);
    const isPureAscii = /^[\x00-\x7f]*$/.test(text);
    const forceImage = (options as any).forceImage === true;

    if (language === 'ja' || hasJapanese || (!isPureAscii) || forceImage) {
        // Use high-speed native canvas for Japanese/Special characters
        try {
            const canvas = await renderJapaneseText(text, fontSize, fontStyle, maxWidth, align);
            if (canvas) {
                // 1px = 0.2645833 mm (at 96 DPI). Scale is 4 (set in renderJapaneseText).
                const canvasToMm = 0.2645833 / 4;
                let finalWidth = canvas.width * canvasToMm;
                let finalHeight = canvas.height * canvasToMm;

                if (finalWidth > maxWidth) {
                    const ratio = maxWidth / finalWidth;
                    finalWidth = maxWidth;
                    finalHeight = finalHeight * ratio;
                }

                let adjustedX = x;
                // Move slightly up to align with Helvetica baseline
                let adjustedY = y - 1.8;

                if (align === 'right') {
                    adjustedX = x - finalWidth;
                } else if (align === 'center') {
                    adjustedX = x - finalWidth / 2;
                }

                // Add image with calculated dimensions
                doc.addImage(canvas, 'PNG', adjustedX, adjustedY, finalWidth, finalHeight, '', 'FAST');
                return finalHeight;
            } else {
                // Fallback to basic text if canvas fails
                doc.text(text, x, y, { align, maxWidth, baseline });
                return fontSize * 0.3527 * 1.2;
            }
        } catch (error) {
                doc.text(text, x, y, { align, maxWidth, baseline });
                return fontSize * 0.3527 * 1.2;
            }
        } catch (error) {
            console.warn('Error rendering Japanese text, using fallback:', error);
            doc.setFont('helvetica', fontStyle);
            doc.setFontSize(fontSize);
            doc.text(text, x, y, { align, maxWidth, baseline: 'top' });
            return fontSize * 0.3527 * 1.2;
        }
    } else {
        // Use regular jsPDF text for English version
        doc.setFont('helvetica', fontStyle);
        doc.setFontSize(fontSize);
        // Standard doc.text now uses the baseline option directly
        doc.text(text, x, y, { align, maxWidth, baseline });

        // Calculate approx height
        // For wrapping text, we should ideally use splitTextToSize
        if (maxWidth) {
            const lines = doc.splitTextToSize(text, maxWidth);
            return lines.length * fontSize * 0.3527 * 1.2;
        }
        return fontSize * 0.3527 * 1.2;
    }
};

// Helper function to get translations from i18n
const getTranslations = async (language: 'en' | 'ja') => {
    // Temporarily change language to get translations - MUST await this!
    const currentLang = i18n.language;
    console.log('Changing language from', currentLang, 'to', language);
    await i18n.changeLanguage(language);

    // Wait a bit to ensure translations are loaded
    await new Promise(resolve => setTimeout(resolve, 100));

    console.log('Current i18n language after change:', i18n.language);

    const t = {
        invoice: i18n.t('invoice.title') || (language === 'ja' ? '請求書' : 'INVOICE'),
        sNo: i18n.t('invoice.sNo') || 'S.No',
        companyName: i18n.t('invoice.companyName'),
        from: i18n.t('invoice.from'),
        billTo: i18n.t('invoice.to'),
        description: i18n.t('invoice.description'),
        hours: i18n.t('invoice.hours'),
        unitPrice: i18n.t('invoice.unitPrice'),
        amount: i18n.t('invoice.amount'),
        subtotal: i18n.t('invoice.subtotal'),
        cgst: i18n.t('invoice.cgst'),
        sgst: i18n.t('invoice.sgst'),
        consumptionTax: i18n.t('invoice.consumptionTax'),
        total: i18n.t('invoice.total'),
        grandTotal: i18n.t('invoice.grandTotal'),
        thankYou: i18n.t('invoice.thankYou'),
        invoiceNo: i18n.t('invoice.invoiceNo'),
        date: i18n.t('invoice.dateLabel'),
        dueDate: i18n.t('invoice.dueDate'), // Changed from dueLabel ('Due:') to dueDate ('Due Date') for explicit Requirement
        email: i18n.t('invoice.email'),
        phone: i18n.t('invoice.phone'),
        address: i18n.t('invoice.address'),
        thankYouMessage: language === 'ja' ? '' : i18n.t('invoice.thankYou'),
        companySeal: language === 'ja' ? '〒 (会社印)' : '',
        paymentInstructions: i18n.t('payment.instructions'),
        bankName: i18n.t('payment.bankName'),
        branchName: i18n.t('payment.branchName'),
        accountType: i18n.t('payment.accountType'),
        accountNumber: i18n.t('payment.accountNumber'),
        accountName: i18n.t('payment.accountName'),
        ifsc: i18n.t('payment.ifsc'),
        branchCode: i18n.t('payment.branchCode'),
        paymentNote: i18n.t('payment.note'),
        authorisedSignature: i18n.t('payment.authorisedSignature'),
        contactInfo: i18n.t('contact.info'),
        phoneHours: i18n.t('contact.phoneHours'),
        companyTagline: i18n.t('company.tagline'),
        // Company address components - use translations
        companyAddress: i18n.t('company.address'),
        companyGstin: i18n.t('company.gstin'),
        companyPhone: i18n.t('company.phone'),
        companyEmail: i18n.t('company.email'),
        poNumber: i18n.t('invoice.poNumber') || 'PO Number',
        roundOff: i18n.t('invoice.roundOff') || 'Round Off',
        bankDetailsLabel: i18n.t('payment.instructions'),
        bankNameLabel: i18n.t('payment.bankName'),
        branchLabel: i18n.t('payment.branchName'),
        branchCodeLabel: i18n.t('payment.branchCode'),
        accountTypeLabel: i18n.t('payment.accountType'),
        accountNoLabel: i18n.t('payment.accountNumber'),
        accountHolderLabel: i18n.t('payment.accountName'),
        swiftCodeLabel: i18n.t('payment.swiftCode') || 'SWIFT Code',
        bankCodeLabel: i18n.t('payment.bankCode') || (language === 'ja' ? '銀行コード：' : 'Bank Code:'),
        ifscCodeLabel: i18n.t('payment.ifsc')
    };

    // Restore original language
    await i18n.changeLanguage(currentLang);

    return t;
};

// Helper function to optimize image data for PDF
const optimizeImageForPdf = (canvas: HTMLCanvasElement, maxWidth: number, maxHeight: number): string => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // Calculate new dimensions maintaining aspect ratio
    let width = canvas.width;
    let height = canvas.height;

    if (width > maxWidth) {
        const ratio = maxWidth / width;
        width = maxWidth;
        height = height * ratio;
    }

    if (height > maxHeight) {
        const ratio = maxHeight / height;
        height = maxHeight;
        width = width * ratio;
    }

    // Create a new canvas with optimized dimensions
    const optimizedCanvas = document.createElement('canvas');
    optimizedCanvas.width = Math.floor(width);
    optimizedCanvas.height = Math.floor(height);
    const optimizedCtx = optimizedCanvas.getContext('2d');

    if (!optimizedCtx) return '';

    // Apply image smoothing for better quality when downscaling
    optimizedCtx.imageSmoothingEnabled = true;
    optimizedCtx.imageSmoothingQuality = 'high';

    // Draw the image to the optimized canvas
    optimizedCtx.drawImage(canvas, 0, 0, optimizedCanvas.width, optimizedCanvas.height);

    // Convert to JPEG with quality 0.8 (80%) for better compression
    return optimizedCanvas.toDataURL('image/jpeg', 0.8);
};

// Helper function to load logo image and add it to PDF with optimization
const addLogoToPdf = async (doc: jsPDF, x: number, y: number, logoUrl: string | null | undefined, maxWidth: number = 50, maxHeight: number = 25): Promise<void> => {
    try {
        if (!logoUrl) {
            console.warn('PDF Generator: No logoUrl provided.');
            return;
        }

        // Determine if it's already a full URL or data URL
        let imageUrl = logoUrl;
        const isDataUrl = logoUrl.startsWith('data:');
        const isRelative = !logoUrl.startsWith('http') && !isDataUrl;

        if (isRelative) {
            // Ensure single leading slash
            imageUrl = logoUrl.startsWith('/') ? logoUrl : '/' + logoUrl;
        }

        console.log(`PDF Generator: Processing logo: ${isDataUrl ? 'Base64/Data URL' : imageUrl}`);

        let imageToLoad = imageUrl;

        // 1. Fetch only if not a data URL
        if (!isDataUrl) {
            try {
                console.log(`PDF Generator: Primary fetch attempt for: ${imageUrl}`);
                const response = await fetch(imageUrl);

                const contentType = response.headers.get('Content-Type');
                if (!response.ok || (contentType && !contentType.startsWith('image/'))) {
                    throw new Error(`Fetch failed or invalid content type: ${response.status} (${contentType})`);
                }
                const blob = await response.blob();
                imageToLoad = URL.createObjectURL(blob);
            } catch (fetchErr) {
                console.warn('PDF Generator: Primary fetch failed or returned non-image, trying absolute backend URL fallback...', fetchErr);
                const backendBase = import.meta.env?.VITE_API_URL?.replace('/api/invoices', '')
                    || 'https://invoice-system-backend-owhd.onrender.com';

                const absoluteUrl = `${backendBase}${imageUrl.startsWith('/') ? imageUrl : '/' + imageUrl}`;
                console.log(`PDF Generator: Fallback attempt with absolute URL: ${absoluteUrl}`);

                try {
                    const response = await fetch(absoluteUrl);
                    const contentType = response.headers.get('Content-Type');
                    if (!response.ok || (contentType && !contentType.startsWith('image/'))) {
                        throw new Error(`Absolute fetch failed or invalid content type: ${response.status} (${contentType})`);
                    }
                    const blob = await response.blob();
                    imageToLoad = URL.createObjectURL(blob);
                } catch (retryErr) {
                    console.error('PDF Generator: All fetch attempts failed:', retryErr);
                    return; // Fail gracefully
                }
            }
        }

        try {
            await new Promise<void>((resolve, reject) => {
                const img = new Image();

                // Allow timeout
                const timeout = setTimeout(() => {
                    img.src = '';
                    reject(new Error('Image loading timed out'));
                }, 5000);

                img.onload = () => {
                    clearTimeout(timeout);
                    try {
                        const width = img.naturalWidth || 500;
                        const height = img.naturalHeight || 250;

                        const canvas = document.createElement('canvas');
                        const scale = 3; // 3x scale is enough for good quality without bloating size
                        canvas.width = width * scale;
                        canvas.height = height * scale;

                        const ctx = canvas.getContext('2d');
                        if (!ctx) throw new Error('Could not create canvas context');

                        // White background for logos with transparency
                        ctx.fillStyle = '#FFFFFF';
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

                        const imgRatio = width / height;
                        const targetRatio = maxWidth / maxHeight;
                        let drawWidth = maxWidth;
                        let drawHeight = maxHeight;
                        let offsetX = 0;
                        let offsetY = 0;

                        if (imgRatio > targetRatio) {
                            drawHeight = maxWidth / imgRatio;
                            offsetY = (maxHeight - drawHeight) / 2;
                        } else {
                            drawWidth = maxHeight * imgRatio;
                            offsetY = (maxHeight - drawHeight) / 2;
                        }

                        // 6. Add to PDF
                        doc.addImage(dataUrl, 'JPEG', x + offsetX, y + offsetY, drawWidth, drawHeight, undefined, 'FAST');
                        console.log('PDF Generator: Logo added successfully to document.');
                        resolve();
                    } catch (err) {
                        reject(err);
                    }
                };

                img.onerror = () => {
                    clearTimeout(timeout);
                    reject(new Error('Image metadata load failed'));
                };

                img.src = imageToLoad;
            });
        } finally {
            // Revoke object URL ONLY if we created one for a blob
            if (imageToLoad.startsWith('blob:')) {
                URL.revokeObjectURL(imageToLoad);
            }
        }
    } catch (error) {
        console.error('PDF Generator: Logo insertion skipped due to error:', error);
    }
};

// Helper function to add static logo/stamp to PDF
const addStaticStampToPdf = async (doc: jsPDF, x: number, y: number, stampImageData: string, maxWidth: number = 30, maxHeight: number = 30): Promise<void> => {
    return new Promise<void>((resolve) => {
        try {
            if (typeof window === 'undefined' || typeof document === 'undefined') {
                resolve();
                return;
            }

            const img = new Image();
            img.onload = () => {
                try {
                    const imgRatio = img.naturalWidth / img.naturalHeight;
                    let drawWidth = maxWidth;
                    let drawHeight = maxHeight;

                    if (imgRatio > 1) {
                        drawHeight = maxWidth / imgRatio;
                    } else {
                        drawWidth = maxHeight * imgRatio;
                    }

                    // Add image with high quality
                    doc.addImage(stampImageData, 'PNG', x, y, drawWidth, drawHeight, undefined, 'FAST');
                    resolve();
                } catch (err) {
                    console.error('Error adding static stamp:', err);
                    resolve();
                }
            };
            img.onerror = () => {
                console.error('Error loading static stamp image');
                resolve();
            };
            img.src = stampImageData;
        } catch (error) {
            console.error('Error in addStaticStampToPdf:', error);
            resolve();
        }
    });
};

const drawInvoiceContent = async (
    doc: jsPDF,
    invoice: Invoice,
    language: 'en' | 'ja',
    t: any,
    companyInfo: CompanyInfo | null | undefined
) => {
    let yPosition = 9; // Standardized top margin of 9mm for horizontal/vertical symmetry

    // Use passed company info
    const companyInfoToUse = companyInfo;
    const effectiveCountry = language === 'ja' ? 'japan' : (invoice.country || 'india');

    const formatAmount = (value: number, includeSymbol: boolean = false, forceRound: boolean = false) => {
        // Wrapper for the centralized service
        return formatCurrency(value, effectiveCountry, !forceRound, includeSymbol);
    };

    // Use centralized formatDate
    const formatDateInPdf = (dateString: string) => {
        return formatDate(dateString);
    };

    // Add logo at top left
    // Fallback to base64-encoded Vision AI logo if no custom logo uploaded
    const isVisionAI = companyInfoToUse?.companyName === 'Vision AI LLC';
    let logoToUse: string | null = companyInfoToUse?.companyLogoUrl || null;

    if (isVisionAI && (!logoToUse || (!logoToUse.startsWith('data:') && !logoToUse.startsWith('http')))) {
        logoToUse = VISION_AI_LOGO_BASE64;
    }

    const rightColX = 120;
    const rightColWidth = 196 - rightColX;

    // Helper to draw the header on every page
    const drawPageHeader = async (targetDoc: typeof doc, startY: number) => {
        // Logo
        if (companyInfoToUse?.companyLogoUrl || invoice.logoUrl) {
            await addLogoToPdf(targetDoc, 14, startY, companyInfoToUse?.companyLogoUrl || invoice.logoUrl, 50, 25);
        }

        // Header Colon Alignment
        const headerLabelWidth = 25;
        const headerColonX = rightColX + headerLabelWidth;
        const headerValueX = headerColonX + 4;

        let headY = startY;
        const invoiceNoLabelH = await addTextToPdf(targetDoc, t.invoiceNo.replace(/[：:]/g, ''), rightColX, headY, {
            fontSize: 11, fontStyle: 'bold', language, maxWidth: headerLabelWidth - 2 
        });
        await addTextToPdf(targetDoc, ':', headerColonX, headY, { fontSize: 11, fontStyle: 'bold', language });
        const invoiceNoValueH = await addTextToPdf(targetDoc, invoice.invoiceNumber, headerValueX, headY, {
            fontSize: 11, fontStyle: 'bold', language, maxWidth: rightColWidth - (headerValueX - rightColX)
        });
        headY += Math.max(invoiceNoLabelH, invoiceNoValueH) + 3;

        const dateLabelH = await addTextToPdf(targetDoc, t.dateLabel?.replace(/[：:]/g, '') || t.date.replace(/[：:]/g, ''), rightColX, headY, {
            fontSize: 11, fontStyle: 'bold', language, maxWidth: headerLabelWidth - 2
        });
        await addTextToPdf(targetDoc, ':', headerColonX, headY, { fontSize: 11, fontStyle: 'bold', language });
        const dateValueH = await addTextToPdf(targetDoc, formatDateInPdf(invoice.date), headerValueX, headY, {
            fontSize: 11, fontStyle: 'bold', language, maxWidth: rightColWidth - (headerValueX - rightColX)
        });
        headY += Math.max(dateLabelH, dateValueH) + 3;
        return headY;
    };

    // New Sticky Footer Helper
    const drawPageFooter = async (targetDoc: jsPDF, showLabel: boolean = true, startY?: number) => {
        // Prevent double drawing on the same page
        const currentPage = (targetDoc as any).internal.getCurrentPageInfo().pageNumber;
        if ((targetDoc as any).lastFooterPage === currentPage) return;
        (targetDoc as any).lastFooterPage = currentPage;

        const hasBankDetails = companyInfoToUse?.bankDetails &&
            Object.values(companyInfoToUse.bankDetails).some(v => v && v.toString().trim().length > 0);

        const footerStartY = startY || 225; // Default to bottom if not specified
        let swiftY = footerStartY + 30; // Fallback for signature alignment
        
        if (hasBankDetails) {
            // Prevent double drawing on the same page
            if (showLabel) {
                await addTextToPdf(targetDoc, t.bankDetailsLabel || 'Bank Details:', 14, footerStartY, { fontSize: 11, fontStyle: 'bold', language });
            }
            
            const b = companyInfoToUse?.bankDetails;
            const details = [
                { label: t.bankNameLabel || 'Bank Name', value: b?.bankName },
                { label: t.bankCodeLabel || 'Bank Code', value: (b as any)?.bankCode },
                { label: t.branchLabel || 'Branch Name', value: b?.branchName },
                { label: t.branchCodeLabel || 'Branch Code', value: b?.branchCode },
                { label: t.accountTypeLabel || 'Account Type', value: b?.accountType },
                { label: t.accountNoLabel || 'Account No', value: b?.accountNumber },
                { label: t.accountHolderLabel || 'Account Name', value: b?.accountHolderName },
                { label: t.swiftCodeLabel || 'SWIFT Code', value: (b as any)?.swiftCode || (b as any)?.swift },
                ...(language !== 'ja' ? [{ label: t.ifscCodeLabel || 'IFSC', value: b?.ifscCode || (b as any)?.ifsc }] : [])
            ];

            const validDetails = details.filter(item => item.value && item.value.toString().trim().length > 0);
            let fCurY = footerStartY + 8;
            swiftY = fCurY + 30; // More specific fallback if bank details block exists
            const bLabelWidth = 40; // Increased to ensure perfect "straight-aligned" output
            const bColonX = 14 + bLabelWidth;
            const bValueX = bColonX + 4;

            for (const item of validDetails.slice(0, 7)) { // Show up to 7 items
                const label = item.label.replace(/[：:]/g, '');
                const val = item.value || '';
                // FORCE image renderer for ALL bank detail rows in English/Japanese to ensure 100% parity
                // (font matching, boldness, and alignment)
                const forceImg = true; 
                
                const labelH = await addTextToPdf(targetDoc, label, 14, fCurY, { fontSize: 9, language, maxWidth: bLabelWidth - 2, forceImage: forceImg } as any);
                await addTextToPdf(targetDoc, ':', bColonX, fCurY, { fontSize: 9, language, forceImage: forceImg } as any);
                const valueH = await addTextToPdf(targetDoc, val.toString(), bValueX, fCurY, { fontSize: 9, language, maxWidth: 100, forceImage: forceImg } as any);
                
                if (label.toLowerCase().includes('swift')) {
                    swiftY = fCurY;
                }
                
                fCurY += Math.max(labelH, valueH) + 1.5;
            }
        }

        // Signature Section - Drawn on every page or just final?
        // Usually, signature is on every page footer or just the last?
        // Based on screenshots, it's at the end.
        // Move OUTSIDE hasBankDetails to ensure it appears in Japanese PDF too
        const sigX = rightColX + (rightColWidth / 2);
        const sigY = startY ? Math.max(startY + 20, 255) : 255; 
        
        // If startY is provided (final footer), align it to the RIGHT of the bank details block if there's space
        let finalSigY = sigY;
        let finalSigX = sigX;

        if (startY && (companyInfoToUse?.bankDetails && Object.values(companyInfoToUse.bankDetails).some(v => v && v.toString().trim().length > 0))) {
            // Reposition TO THE RIGHT of payment details for a "straight" professional look
            // Aligned exactly straight to the SWIFT code row if found
            finalSigY = (swiftY as any) + 5; 
        }

        if (invoice.signatureUrl) {
            await addLogoToPdf(targetDoc, finalSigX - 15, finalSigY - 18, invoice.signatureUrl, 30, 15);
        } else if (isVisionAI) {
            await addStaticStampToPdf(targetDoc, finalSigX - 8, finalSigY - 18, visionAiStamp, 16, 16);
        }
        targetDoc.line(rightColX + 5, finalSigY, 196, finalSigY);
        const sigLabel = language === 'ja' ? '承認された署名' : (t.authorisedSignature || 'Authorised Signature');
        await addTextToPdf(targetDoc, sigLabel, finalSigX, finalSigY + 5, { 
            fontSize: 10, 
            fontStyle: 'bold', 
            align: 'center', 
            language,
            forceImage: true 
        } as any);
    };

    let footerLabelDrawn = false;

    // Initial Header
    yPosition = await drawPageHeader(doc, 9);

    // Add small padding after header (drawPageHeader already returns bottom y)
    yPosition += 8; 

    // From Address (Company Details) - Left side
    const fromStartY = yPosition;
    await addTextToPdf(doc, t.from, 14, fromStartY, {
        fontSize: 10,
        fontStyle: 'bold',
        language,
        maxWidth: 90
    });

    let fromY = fromStartY + 6;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    // Company Name Bold
    const displayCompanyName = companyInfoToUse?.companyName || invoice.company || t.companyName;
    const fromNameHeight = await addTextToPdf(doc, language === 'ja' ? toKatakana(displayCompanyName) : displayCompanyName, 14, fromY, {
        fontSize: 10,
        fontStyle: 'bold',
        language,
        maxWidth: 90
    });
    fromY += fromNameHeight + 2; // Dynamic gap after bold company name

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    // DYNAMIC ADDRESS GENERATION
    // Use companyInfoToUse first, fall back to hardcoded only if absolutely necessary logic requires it (which it shouldn't for "dynamic" requirement)
    let fromLines: string[] = [];

    if (companyInfoToUse?.companyAddress) {
        // Split address by newlines or commas if it's a single string
        // Assuming companyAddress might be multi-line
        const addressParts = companyInfoToUse.companyAddress.split(/[\n,]+/).map(s => s.trim()).filter(s => s.length > 0);
        fromLines = [...addressParts];
    } else {
        // Fallback if no company info (shouldn't happen with AuthContext but safe to keep)
        fromLines = ['Vedayapalem', 'Nellore, Andhra Pradesh', 'PIN: 524004', 'India'];
    }

    // Add Contact Info from Company Info specific fields or fallback
    // We don't have direct fields in CompanyInfo for GSTIN/Phone/Email in the Type def shown earlier?
    // Wait, let's check CompanyInfo type in types.ts again.
    // Type: id, companyName, companyAddress, companyLogoUrl, bankDetails. 
    // It MISSES gstin, phone, email. 
    // BUT the implementation plan said "Ensure the company address entered by the user dynamically appears". 
    // The user issue is "Address". 
    // I will append the address lines. 
    // For GSTIN/Phone/Email, if they are not in CompanyInfo, we might have to stick to hardcoded or see if they are in 'user' object?
    // Re-checking types.ts -> CompanyInfo has limited fields.
    // ideally we should fetch extended info. 
    // However, for "Company Address", I will definitely use `companyInfo.companyAddress`.

    for (const line of fromLines) {
        if (line && line.trim()) {
            const displayLine = language === 'ja' ? toKatakana(line.trim()) : line.trim();
            const lineHeight = await addTextToPdf(doc, displayLine, 14, fromY, {
                fontSize: 10,
                language,
                maxWidth: 90
            });
            fromY += lineHeight + 1;
        }
    }

    // From Email (From Sender) - Added as requested with label and fallback
    const senderEmail = invoice.fromEmail || (invoice as any).gmail;
    if (senderEmail && senderEmail.trim()) {
        console.log('PDF Generator: Drawing From Email:', senderEmail);
        const fromLabelX = 14;
        const fromLabelWidth = language === 'ja' ? 32 : 25; // Standardized 
        const fromColonX = fromLabelX + fromLabelWidth;
        const fromValueX = fromColonX + 4;

        const emailLabelH = await addTextToPdf(doc, (t.email || 'Email').replace(/[：:]/g, ''), fromLabelX, fromY + 2, {
            fontSize: 10,
            language,
            baseline: 'top',
            maxWidth: fromLabelWidth - 2
        });
        await addTextToPdf(doc, ':', fromColonX, fromY + 2, { fontSize: 10, language, baseline: 'top' });

        const emailValueH = await addTextToPdf(doc, senderEmail.trim(), fromValueX, fromY + 2, {
            fontSize: 10,
            language,
            maxWidth: 90 - (fromValueX - fromLabelX),
            baseline: 'top'
        });
        fromY += Math.max(emailLabelH, emailValueH) + 2;
    }



    // Bill To (Employee Info) - aligned to right column
    // Uses the same rightColX as Header for perfect vertical alignment
    const billToX = rightColX;
    let billToY = fromStartY;

    if (invoice.employeeName && invoice.employeeName.trim() && invoice.employeeName !== 'N/A') {
        await addTextToPdf(doc, t.billTo, billToX, billToY, {
            fontSize: 10,
            fontStyle: 'bold',
            align: 'left',
            language,
            maxWidth: rightColWidth,
            baseline: 'top'
        });
        billToY = fromStartY + 6;

        const employeeNameHeight = await addTextToPdf(doc, language === 'ja' ? toKatakana(invoice.employeeName.trim()) : invoice.employeeName.trim(), billToX, billToY, {
            fontSize: 10,
            fontStyle: 'bold',
            align: 'left',
            language,
            maxWidth: rightColWidth,
            baseline: 'top'
        });
        billToY += employeeNameHeight + 3; // Increased gap after bold client name



        // Bill To: email, phone and address field labels rendered with uniform width for alignment
        const billToLabelWidth = language === 'ja' ? 32 : 25; // Increased for Japanese labels
        const billToColonX = billToX + billToLabelWidth;
        const billToValueX = billToColonX + 4;

        // Email
        if (invoice.employeeEmail && invoice.employeeEmail.trim()) {
            const label = t.email.replace(/[：:]/g, '');
            const labelH = await addTextToPdf(doc, label, billToX, billToY, {
                fontSize: 10,
                align: 'left',
                language,
                maxWidth: billToLabelWidth - 2
            });
            // Standard colon alignment
            await addTextToPdf(doc, ':', billToColonX, billToY, { fontSize: 10, align: 'left', language });

            const valueH = await addTextToPdf(doc, invoice.employeeEmail.trim(), billToValueX, billToY, {
                fontSize: 10,
                align: 'left',
                language,
                maxWidth: rightColWidth - (billToValueX - billToX)
            });
            billToY += Math.max(labelH, valueH) + 2;
        }

        // Phone
        if (invoice.employeeMobile && invoice.employeeMobile.trim()) {
            const label = t.phone.replace(/[：:]/g, '');
            const labelH = await addTextToPdf(doc, label, billToX, billToY, {
                fontSize: 10,
                align: 'left',
                language,
                maxWidth: billToLabelWidth - 2
            });
            // Standard colon alignment
            await addTextToPdf(doc, ':', billToColonX, billToY, { fontSize: 10, align: 'left', language });

            const valueH = await addTextToPdf(doc, invoice.employeeMobile.trim(), billToValueX, billToY, {
                fontSize: 10,
                align: 'left',
                language,
                maxWidth: rightColWidth - (billToValueX - billToX)
            });
            billToY += Math.max(labelH, valueH) + 2;
        }

        // Address
        if (invoice.employeeAddress && invoice.employeeAddress.trim()) {
            const label = t.address.replace(/[：:]/g, '');
            const labelH = await addTextToPdf(doc, label, billToX, billToY, {
                fontSize: 10,
                align: 'left',
                language,
                maxWidth: billToLabelWidth - 2
            });
            // Standard colon alignment
            await addTextToPdf(doc, ':', billToColonX, billToY, { fontSize: 10, align: 'left', language });

            const addressToDisplay = invoice.employeeAddress.replace(/\n/g, ', ').trim();
            const finalAddress = language === 'ja' ? toKatakana(addressToDisplay) : addressToDisplay;
            const valueH = await addTextToPdf(doc, finalAddress, billToValueX, billToY, {
                fontSize: 10,
                align: 'left',
                language,
                maxWidth: rightColWidth - (billToValueX - billToX)
            });
            billToY += Math.max(labelH, valueH) + 2;
        }
    }

    // Align PO Number (Left) and Due Date (Right) strictly opposite to each other
    // Calculate the starting Y for this row, ensuring it's below both From and Bill To sections
    let commonRowY = Math.max(fromY, billToY) + 3; // Add gap
    let maxRowH = 0;

    // PO Number (Left Side)
    if (invoice.poNumber && invoice.poNumber.trim()) {
        const poLabelWidth = language === 'ja' ? 32 : 25;
        const poColonX = 14 + poLabelWidth;
        const poValueX = poColonX + 4;

        const labelH = await addTextToPdf(doc, t.poNumber.replace(/[：:]/g, ''), 14, commonRowY, {
            fontSize: 10,
            fontStyle: 'bold',
            language,
            maxWidth: poLabelWidth - 2
        });
        await addTextToPdf(doc, ':', poColonX, commonRowY, { fontSize: 10, fontStyle: 'bold', language });
        const valueH = await addTextToPdf(doc, invoice.poNumber.trim(), poValueX, commonRowY, {
            fontSize: 10,
            fontStyle: 'bold',
            language,
            maxWidth: 90 - (poValueX - 14)
        });
        maxRowH = Math.max(maxRowH, labelH, valueH);
    }

    // Due Date (Right Side)
    if (invoice.dueDate) {
        const dueDateLabelWidth = language === 'ja' ? 32 : 25;
        const dueDateLabelX = rightColX;
        const dueDateColonX = dueDateLabelX + dueDateLabelWidth;
        const dueDateValueX = dueDateColonX + 4;

        const labelH = await addTextToPdf(doc, t.dueDate.replace(/[：:]/g, ''), dueDateLabelX, commonRowY, {
            fontSize: 10,
            fontStyle: 'bold',
            language,
            maxWidth: dueDateLabelWidth - 2
        });
        await addTextToPdf(doc, ':', dueDateColonX, commonRowY, { fontSize: 10, fontStyle: 'bold', language });
        const valueH = await addTextToPdf(doc, formatDateInPdf(invoice.dueDate), dueDateValueX, commonRowY, {
            fontSize: 10,
            fontStyle: 'bold',
            language,
            maxWidth: rightColWidth - (dueDateValueX - rightColX)
        });

        maxRowH = Math.max(maxRowH, labelH, valueH);
    }

    if (maxRowH > 0) {
        commonRowY += maxRowH + 2;
    }

    // Update Y position for the table start, based on this new row
    yPosition = commonRowY + 10;



    // Services Table
    // Refined column widths for better spacing and professional alignment
    const colX = [14, 25, 105, 125, 160, 196];
    const tableStartY = yPosition + 5;

    doc.setDrawColor(0);
    doc.setLineWidth(0.1);

    // Header Row
    doc.line(colX[0], tableStartY, colX[5], tableStartY);

    const headerHeight = 10;
    // Vertically center text: (10mm row - 3.5mm text_height) / 2 = 3.25mm
    const textY = tableStartY + 3.25;

    // SNO
    await addTextToPdf(doc, t.sNo, (colX[0] + colX[1]) / 2, textY, {
        fontSize: 10, fontStyle: 'bold', align: 'center', language
    });
    // Description - Left aligned for professional feel
    await addTextToPdf(doc, t.description, colX[1] + 2, textY, {
        fontSize: 10, fontStyle: 'bold', align: 'left', language
    });
    // Hours (Right Aligned -4 padding)
    await addTextToPdf(doc, t.hours, colX[3] - 4, textY, {
        fontSize: 10, fontStyle: 'bold', align: 'right', language
    });
    // Unit Price (Right Aligned -4 padding)
    await addTextToPdf(doc, t.unitPrice, colX[4] - 4, textY, {
        fontSize: 10, fontStyle: 'bold', align: 'right', language
    });
    // Amount (Right Aligned -4 padding)
    await addTextToPdf(doc, t.amount, colX[5] - 4, textY, {
        fontSize: 10, fontStyle: 'bold', align: 'right', language
    });

    for (const x of colX) {
        doc.line(x, tableStartY, x, tableStartY + headerHeight);
    }

    doc.line(colX[0], tableStartY + headerHeight, colX[5], tableStartY + headerHeight);

    yPosition = tableStartY + headerHeight;

    // Table Body
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    // Use for..of loop to support await inside
    for (const [index, service] of invoice.services.entries()) {
        const amount = Math.round((service.hours * service.rate) * 100) / 100;
        const descWidth = colX[2] - colX[1] - 4;
        const descLines = doc.splitTextToSize(service.description || '-', descWidth);
        const rowHeight = Math.max(12, descLines.length * 5 + 4);

        // Page break check BEFORE drawing the row to prevent overlap
        // Increased threshold to 265mm since we removed sticky footer from breaks
        if (yPosition + rowHeight > 265) {
            // SKIP drawPageFooter here to prevent interrupting the table
            doc.addPage();
            await drawPageHeader(doc, 9);
            yPosition = 55;
            
            // Redraw table headers
            doc.setDrawColor(0);
            doc.setLineWidth(0.4);
            doc.line(colX[0], yPosition, colX[5], yPosition);
            doc.line(colX[0], yPosition + 10, colX[5], yPosition + 10);
            const textY = yPosition + 3.25;
            await addTextToPdf(doc, t.sNo, (colX[0] + colX[1]) / 2, textY, { fontSize: 10, align: 'center', language });
            await addTextToPdf(doc, t.description, (colX[1] + colX[2]) / 2, textY, { fontSize: 10, align: 'center', language });
            await addTextToPdf(doc, t.hours, (colX[2] + colX[3]) / 2, textY, { fontSize: 10, align: 'center', language });
            await addTextToPdf(doc, t.unitPrice, (colX[3] + colX[4]) / 2, textY, { fontSize: 10, align: 'center', language });
            await addTextToPdf(doc, t.amount, (colX[4] + colX[5]) / 2, textY, { fontSize: 10, align: 'center', language });
            yPosition += 10;
        }

        for (const x of colX) {
            doc.line(x, yPosition, x, yPosition + rowHeight);
        }

        const rowTextY = yPosition + (rowHeight - 3.5) / 2;

        // SNO
        await addTextToPdf(doc, String(index + 1), (colX[0] + colX[1]) / 2, rowTextY, {
            fontSize: 10, align: 'center', language
        });

        // Description
        let lineY = rowTextY - (descLines.length > 1 ? 2 : 0); // Slight offset for multi-line
        if (descLines.length === 1) {
            const displayDesc = language === 'ja' ? toKatakana(descLines[0]) : descLines[0];
            await addTextToPdf(doc, displayDesc, colX[1] + 2, rowTextY, {
                align: 'left', language, maxWidth: colX[2] - colX[1] - 4, fontSize: 10
            });
        } else {
            for (const line of descLines) {
                const displayLine = language === 'ja' ? toKatakana(line) : line;
                await addTextToPdf(doc, displayLine, colX[1] + 2, lineY, {
                    align: 'left', language, maxWidth: colX[2] - colX[1] - 4, fontSize: 10
                });
                lineY += 5;
            }
        }

        // Hours (Right Aligned)
        const formattedHours = Number(service.hours).toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        });
        await addTextToPdf(doc, formattedHours, colX[3] - 4, rowTextY, {
            align: 'right', language, fontSize: 10, maxWidth: (colX[3] - colX[2]) - 2
        });

        // Unit Price WITH CURRENCY (Right Aligned)
        const formattedRate = formatAmount(service.rate, false);
        await addTextToPdf(doc, formattedRate, colX[4] - 4, rowTextY, {
            align: 'right', language, fontSize: 10, maxWidth: (colX[4] - colX[3]) - 2
        });

        // Amount WITH CURRENCY (Right Aligned)
        const formattedItemAmount = formatAmount(amount, false);
        await addTextToPdf(doc, formattedItemAmount, colX[5] - 4, rowTextY, {
            align: 'right', language, fontSize: 10, maxWidth: (colX[5] - colX[4]) - 2
        });

        doc.line(colX[0], yPosition + rowHeight, colX[5], yPosition + rowHeight);
        yPosition += rowHeight;
    }

    // Totals Section
    const subTotal = invoice.services.reduce((acc, s) => acc + Math.round((s.hours * s.rate) * 100) / 100, 0);
    const taxRate = invoice.taxRate || 0;

    // Only calculate tax if it's India OR Japanese Consumption Tax toggle is ON
    const shouldCalculateTax = effectiveCountry === 'india' || (effectiveCountry === 'japan' && invoice.showConsumptionTax);

    const taxCalculation = calculateTax(subTotal, shouldCalculateTax ? taxRate : 0, effectiveCountry, invoice.cgstRate, invoice.sgstRate);
    const { grandTotal, consumptionTaxRate, consumptionTaxAmount, cgstRate, sgstRate, cgstAmount, sgstAmount } = taxCalculation;

    const drawTotalRow = async (label: string, value: string, isBold: boolean = false) => {
        const rowH = 10;
        
        // Page break check for total rows - increased threshold
        if (yPosition > 255) {
            // SKIP drawPageFooter here
            doc.addPage();
            await drawPageHeader(doc, 9);
            yPosition = 55;
        }

        doc.line(colX[0], yPosition, colX[0], yPosition + rowH);
        doc.line(colX[4], yPosition, colX[4], yPosition + rowH);
        doc.line(colX[5], yPosition, colX[5], yPosition + rowH);

        doc.line(colX[0], yPosition + rowH, colX[5], yPosition + rowH);

        const fontSize = 10;
        // Center text vertically in the 10mm row (10 - 3.5) / 2 = 3.25
        const textY = yPosition + 3.25;

        await addTextToPdf(doc, label.replace(/[：:]/g, ''), colX[0] + 2, textY, {
            fontSize, fontStyle: isBold ? 'bold' : 'normal', align: 'left', language
        });

        // Correctly right-align value at the end of the table
        await addTextToPdf(doc, value, colX[5] - 4, textY, {
            fontSize,
            fontStyle: isBold ? 'bold' : 'normal',
            align: 'right',
            language
        });

        yPosition += rowH;
    };

    // SubTotal
    await drawTotalRow(t.subtotal, formatAmount(subTotal, false, false), true);

    // Tax
    if (effectiveCountry === 'japan') {
        if (invoice.showConsumptionTax && consumptionTaxRate !== undefined) {
            await drawTotalRow(`${t.consumptionTax} (${consumptionTaxRate}%)`, formatAmount(consumptionTaxAmount || 0, false, false), true);
        }
    } else {
        // Use cgstRate/sgstRate from invoice if available, else fall back to calculation
        const effectiveCgstRate = invoice.cgstRate ?? cgstRate;
        const effectiveSgstRate = invoice.sgstRate ?? sgstRate;

        const effectiveCgstAmount = invoice.cgstRate !== undefined ? Math.round((subTotal * (invoice.cgstRate / 100)) * 100) / 100 : (cgstAmount || 0);
        const effectiveSgstAmount = invoice.sgstRate !== undefined ? Math.round((subTotal * (invoice.sgstRate / 100)) * 100) / 100 : (sgstAmount || 0);

        if (effectiveCgstRate) await drawTotalRow(`${t.cgst} (${effectiveCgstRate}%)`, formatAmount(effectiveCgstAmount, false, false), true);
        if (effectiveSgstRate) await drawTotalRow(`${t.sgst} (${effectiveSgstRate}%)`, formatAmount(effectiveSgstAmount, false, false), true);
    }

    // Round Off (if exists)
    if (invoice.roundOff !== undefined && invoice.roundOff !== 0) {
        await drawTotalRow(t.roundOff, formatAmount(invoice.roundOff, false, false), true);
    }

    // Grand Total (Currency in label, amount without symbol)
    // Use stored finalAmount if available, otherwise calculated
    const currencyCode = effectiveCountry === 'japan' ? 'JPY' : 'INR';
    const finalGrandTotal = invoice.finalAmount !== undefined ? invoice.finalAmount : (shouldCalculateTax ? grandTotal : subTotal);

    await drawTotalRow(`${t.grandTotal} (${currencyCode})`, formatAmount(finalGrandTotal, false, true), true);

    // Add Thank You Message ONLY if not Japanese and translation exists
    if (language !== 'ja' && t.thankYou && t.thankYou.trim().length > 0) {
        yPosition += 5;
        await addTextToPdf(doc, t.thankYou, 105, yPosition, {
            fontSize: 10,
            fontStyle: 'bold',
            align: 'center',
            language
        });
        yPosition += 10;
    }

    // Final Page Footer
    // Final Page Footer - Pass dynamic yPosition to remove empty space
    // and ensure it follows the table/Thank You message closely (min 15mm gap)
    await drawPageFooter(doc, !footerLabelDrawn, Math.max(160, yPosition + 15));
}


// Generate PDF and return as bytes for email attachment
export const generateInvoicePDFBytes = async (invoice: Invoice, language: 'en' | 'ja' = 'en', companyInfoParam?: CompanyInfo | null): Promise<Uint8Array> => {
    // Get translations from i18n
    const t = await getTranslations(language);

    try {
        const doc = new jsPDF({
            compress: true,
            unit: 'mm',
            format: 'a4'
        });

        if (language === 'ja') {
            configureJapaneseFont(doc);
        }

        await drawInvoiceContent(doc, invoice, language, t, companyInfoParam || getCompanyInfo());

        // Return PDF as bytes
        const arrayBuffer = doc.output('arraybuffer');
        return new Uint8Array(arrayBuffer);
    } catch (error) {
        console.error('Error generating PDF bytes:', error);
        throw error;
    }
};

export const generateInvoicePDF = async (invoice: Invoice, language: 'en' | 'ja' = 'en', companyInfoParam?: CompanyInfo | null) => {
    // Get translations from i18n
    const t = await getTranslations(language);

    try {
        // Initialize PDF with compression and optimization settings
        const doc = new jsPDF({
            compress: true,
            unit: 'mm',
            format: 'a4'
        });

        doc.setProperties({
            title: `Invoice ${invoice.invoiceNumber}`,
            creator: 'Invoice Generator',
            author: 'Invoice Generator'
        });

        if (language === 'ja') {
            configureJapaneseFont(doc);
        }

        await drawInvoiceContent(doc, invoice, language, t, companyInfoParam || getCompanyInfo());

        // Resource name from first service item
        const resourceName = invoice.services && invoice.services.length > 0
            ? invoice.services[0].description
                .split('\n')[0]
                .replace(/[^a-zA-Z0-9 ]/g, '')
                .trim()
                .substring(0, 30)
            : '';

        // Save
        const fileName = resourceName
            ? `${invoice.invoiceNumber} ${resourceName}.pdf`
            : `${invoice.invoiceNumber}.pdf`;

        const pdfData = doc.output('blob');
        const pdfUrl = URL.createObjectURL(pdfData);

        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();

        setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(pdfUrl);
        }, 100);

    } catch (error) {
        console.error('Error generating PDF:', error);
        alert(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};