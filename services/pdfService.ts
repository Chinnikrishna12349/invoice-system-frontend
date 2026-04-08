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
        // Use html2canvas for ALL text in Japanese context
        try {
            const imageData = await renderJapaneseText(text, fontSize, fontStyle, maxWidth, align);
            if (imageData && imageData !== 'data:,') {
                const img = new Image();
                const heightmm = await new Promise<number>((resolve) => {
                    img.onload = () => {
                        // 1px = 0.2645833 mm (at 96 DPI). Scale is 2.
                        const canvasToMm = 0.2645833 / 2;
                        let finalWidth = img.width * canvasToMm;
                        let finalHeight = img.height * canvasToMm;

                        if (finalWidth > maxWidth) {
                            const ratio = maxWidth / finalWidth;
                            finalWidth = maxWidth;
                            finalHeight = finalHeight * ratio;
                        }

                        let adjustedX = x;
                        // Use Y as the TOP edge
                        // Compendsate for padding/baseline differences. 
                        // Increase compensation slightly to 1.8mm for better alignment with Helvetica Top baseline
                        let adjustedY = y - 1.8;

                        if (align === 'right') {
                            adjustedX = x - finalWidth;
                        } else if (align === 'center') {
                            adjustedX = x - finalWidth / 2;
                        }

                        // Add image with calculated dimensions
                        doc.addImage(imageData, 'PNG', adjustedX, adjustedY, finalWidth, finalHeight, '', 'FAST');
                        resolve(finalHeight);
                    };
                    img.onerror = () => {
                        console.warn('Image load failed, using fallback');
                        resolve(0);
                    };
                    img.src = imageData;
                });
                return heightmm;
            } else {
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

        // Parallelize Header Sections
        const headerData = [
            { label: t.invoiceNo.replace(/[：:]/g, ''), value: invoice.invoiceNumber },
            { label: t.dateLabel?.replace(/[：:]/g, '') || t.date.replace(/[：:]/g, ''), value: formatDateInPdf(invoice.date) }
        ];

        const headerJobs = headerData.map(async (item) => {
            const [labelImg, colonImg, valueImg] = await Promise.all([
                renderJapaneseText(item.label, 11, 'bold', headerLabelWidth - 2, 'left'),
                renderJapaneseText(':', 11, 'bold', 5, 'left'),
                renderJapaneseText(item.value, 11, 'bold', rightColWidth - (headerValueX - rightColX), 'left')
            ]);
            return { labelImg, colonImg, valueImg };
        });

        const headerRows = await Promise.all(headerJobs);
        const s = 0.2645833 / 2;

        for (const row of headerRows) {
            const hL = ((img: any) => {
                const i = new Image(); i.src = img;
                let w = i.width * s; let h = i.height * s;
                if (w > headerLabelWidth - 2) { h = h * ((headerLabelWidth - 2) / w); w = headerLabelWidth - 2; }
                targetDoc.addImage(img, 'PNG', rightColX, headY - 1.8, w, h, '', 'FAST');
                return h;
            })(row.labelImg);

            targetDoc.addImage(row.colonImg, 'PNG', headerColonX, headY - 1.8, 0, 0, '', 'FAST'); // Auto size for colon

            const hV = ((img: any) => {
                const i = new Image(); i.src = img;
                let w = i.width * s; let h = i.height * s;
                const maxW = rightColWidth - (headerValueX - rightColX);
                if (w > maxW) { h = h * (maxW / w); w = maxW; }
                targetDoc.addImage(img, 'PNG', headerValueX, headY - 1.8, w, h, '', 'FAST');
                return h;
            })(row.valueImg);

            headY += Math.max(hL, hV) + 3;
        }

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

            // Parallelize image generation for all rows to maximize speed
            const rowJobs = validDetails.slice(0, 7).map(async (item) => {
                const label = item.label.replace(/[：:]/g, '');
                const val = item.value || '';
                
                // Parallel rendering of label, colon, and value images
                const [labelImg, colonImg, valueImg] = await Promise.all([
                    renderJapaneseText(label, 9, 'normal', bLabelWidth - 2, 'left'),
                    renderJapaneseText(':', 9, 'normal', 5, 'left'),
                    renderJapaneseText(val.toString(), 9, 'normal', 100, 'left')
                ]);
                
                return { label, val, labelImg, colonImg, valueImg };
            });

            const rows = await Promise.all(rowJobs);
            
            for (const row of rows) {
                // Sequential drawing to jsPDF is fast since images are pre-rendered
                const { label, val, labelImg, colonImg, valueImg } = row;
                
                // Scale factor for canvas conversion (matches addTextToPdf)
                const s = 0.2645833 / 2; 

                // Draw pre-rendered images to PDF
                // We use helper to calculate exact height for Y increment
                const drawImg = (imgData: string, x: number, y: number, maxW: number) => {
                    const img = new Image();
                    img.src = imgData;
                    let w = img.width * s;
                    let h = img.height * s;
                    if (w > maxW) { h = h * (maxW / w); w = maxW; }
                    targetDoc.addImage(imgData, 'PNG', x, y - 1.8, w, h, '', 'FAST');
                    return h;
                };

                const hL = drawImg(labelImg, 14, fCurY, bLabelWidth - 2);
                drawImg(colonImg, bColonX, fCurY, 5);
                const hV = drawImg(valueImg, bValueX, fCurY, 100);
                
                if (label.toLowerCase().includes('swift')) {
                    swiftY = fCurY;
                }
                
                fCurY += Math.max(hL, hV) + 1.5;
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

    // Parallelize and draw From Lines
    const fromJobs = fromLines.map(async (line) => {
        const displayLine = language === 'ja' ? toKatakana(line.trim()) : line.trim();
        return renderJapaneseText(displayLine, 10, 'normal', 90, 'left');
    });
    const fromImages = await Promise.all(fromJobs);
    const s = 0.2645833 / 2;

    for (const imgData of fromImages) {
        if (imgData) {
            const img = new Image(); img.src = imgData;
            let w = img.width * s; let h = img.height * s;
            if (w > 90) { h = h * (90 / w); w = 90; }
            targetDoc.addImage(imgData, 'PNG', 14, fromY - 1.8, w, h, '', 'FAST');
            fromY += h + 1;
        }
    }

    // From Email (From Sender) - Added as requested with label and fallback
    const senderEmail = invoice.fromEmail || (invoice as any).gmail;
    if (senderEmail && senderEmail.trim()) {
        console.log('PDF Generator: Drawing From Email:', senderEmail);
        const fromLabelX = 14;
        const fromLabelWidth = 25; // Standardized 
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
        // Parallelize Bill To text generation
        const billToItems = [
            { text: t.billTo, fontSize: 10, isBold: true, isLabel: true },
            { text: language === 'ja' ? toKatakana(invoice.employeeName.trim()) : invoice.employeeName.trim(), fontSize: 10, isBold: true, isLabel: false }
        ];

        // Add optional fields
        if (invoice.employeeEmail?.trim()) billToItems.push({ text: t.email.replace(/[：:]/g, ''), value: invoice.employeeEmail.trim(), fontSize: 10, isBold: false, isLabel: true } as any);
        if (invoice.employeeMobile?.trim()) billToItems.push({ text: t.phone.replace(/[：:]/g, ''), value: invoice.employeeMobile.trim(), fontSize: 10, isBold: false, isLabel: true } as any);
        if (invoice.employeeAddress?.trim()) {
            const addr = invoice.employeeAddress.replace(/\n/g, ', ').trim();
            billToItems.push({ text: t.address.replace(/[：:]/g, ''), value: language === 'ja' ? toKatakana(addr) : addr, fontSize: 10, isBold: false, isLabel: true } as any);
        }

        const billToLabelWidth = 25;
        const billToColonX = billToX + billToLabelWidth;
        const billToValueX = billToColonX + 4;

        const billToJobs = billToItems.map(async (item: any) => {
            if (item.value !== undefined) {
                const [lImg, cImg, vImg] = await Promise.all([
                    renderJapaneseText(item.text, item.fontSize, item.isBold ? 'bold' : 'normal', billToLabelWidth - 2, 'left'),
                    renderJapaneseText(':', item.fontSize, 'normal', 5, 'left'),
                    renderJapaneseText(item.value, item.fontSize, 'normal', rightColWidth - (billToValueX - billToX), 'left')
                ]);
                return { isRow: true, lImg, cImg, vImg };
            } else {
                const img = await renderJapaneseText(item.text, item.fontSize, item.isBold ? 'bold' : 'normal', rightColWidth, 'left');
                return { isRow: false, img };
            }
        });

        const billToRendered = await Promise.all(billToJobs);
        const s = 0.2645833 / 2;

        for (const item of billToRendered) {
            if (item.isRow) {
                const draw = (imgData: string, x: number, y: number, maxW: number) => {
                    const img = new Image(); img.src = imgData;
                    let w = img.width * s; let h = img.height * s;
                    if (w > maxW) { h = h * (maxW / w); w = maxW; }
                    targetDoc.addImage(imgData, 'PNG', x, y - 1.8, w, h, '', 'FAST');
                    return h;
                };
                const hL = draw(item.lImg!, billToX, billToY, billToLabelWidth - 2);
                draw(item.cImg!, billToColonX, billToY, 5);
                const hV = draw(item.vImg!, billToValueX, billToY, rightColWidth - (billToValueX - billToX));
                billToY += Math.max(hL, hV) + 2;
            } else {
                const img = new Image(); img.src = item.img!;
                let w = img.width * s; let h = img.height * s;
                if (w > rightColWidth) { h = h * (rightColWidth / w); w = rightColWidth; }
                targetDoc.addImage(item.img!, 'PNG', billToX, billToY - 1.8, w, h, '', 'FAST');
                billToY += h + (item.isRow ? 2 : 3);
            }
        }
    }

    // Align PO Number (Left) and Due Date (Right) strictly opposite to each other
    // Calculate the starting Y for this row, ensuring it's below both From and Bill To sections
    let commonRowY = Math.max(fromY, billToY) + 3; // Add gap
    let maxRowH = 0;

    // PO Number (Left Side)
    if (invoice.poNumber && invoice.poNumber.trim()) {
        const poLabelWidth = 25;
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
        const dueDateLabelWidth = 25;
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

    // Parallelize all service row image rendering to maximize download speed
    const serviceJobs = invoice.services.map(async (service, index) => {
        const amount = Math.round((service.hours * service.rate) * 100) / 100;
        const descWidth = colX[2] - colX[1] - 4;
        const descLines = doc.splitTextToSize(service.description || '-', descWidth);
        const rowHeight = Math.max(12, descLines.length * 5 + 4);

        const formattedHours = Number(service.hours).toLocaleString(undefined, {
            minimumFractionDigits: 0, maximumFractionDigits: 2
        });
        const formattedUnitPrice = formatAmount(service.rate, false);
        const formattedAmount = formatAmount(amount, false);

        // Pre-render all cell images for this row in parallel using optimized scale
        const [idImg, hoursImg, rateImg, amountImg, descImgs] = await Promise.all([
            renderJapaneseText(String(index + 1), 10, 'normal', (colX[1] - colX[0]) - 2, 'center'),
            renderJapaneseText(formattedHours, 10, 'normal', (colX[3] - colX[2]) - 2, 'right'),
            renderJapaneseText(formattedUnitPrice, 10, 'normal', (colX[4] - colX[3]) - 2, 'right'),
            renderJapaneseText(formattedAmount, 10, 'normal', (colX[5] - colX[4]) - 2, 'right'),
            Promise.all(descLines.map(line => {
                const displayLine = language === 'ja' ? toKatakana(line) : line;
                return renderJapaneseText(displayLine, 10, 'normal', descWidth, 'left');
            }))
        ]);

        return { index, rowHeight, descLines, idImg, hoursImg, rateImg, amountImg, descImgs };
    });

    const renderedRows = await Promise.all(serviceJobs);
    const s = 0.2645833 / 2; // Scale 2 factor

    for (const row of renderedRows) {
        if (yPosition + row.rowHeight > 265) {
            doc.addPage();
            await drawPageHeader(doc, 9);
            yPosition = 55;
            doc.line(colX[0], yPosition, colX[5], yPosition);
            doc.line(colX[0], yPosition + 10, colX[5], yPosition + 10);
            yPosition += 10;
        }

        for (const x of colX) {
            doc.line(x, yPosition, x, yPosition + row.rowHeight);
        }

        const rowTextY = yPosition + (row.rowHeight - 3.5) / 2;

        const drawCell = (img: string, x: number, y: number, maxW: number, align: 'left' | 'center' | 'right') => {
            const i = new Image(); i.src = img;
            let w = i.width * s; let h = i.height * s;
            if (w > maxW) { h = h * (maxW / w); w = maxW; }
            let finalX = x;
            if (align === 'center') finalX = x - w/2;
            else if (align === 'right') finalX = x - w;
            doc.addImage(img, 'PNG', finalX, y - 1.8, w, h, '', 'FAST');
        };

        drawCell(row.idImg, (colX[0] + colX[1]) / 2, rowTextY, (colX[1] - colX[0]) - 2, 'center');
        drawCell(row.hoursImg, colX[3] - 4, rowTextY, (colX[3] - colX[2]) - 2, 'right');
        drawCell(row.rateImg, colX[4] - 4, rowTextY, (colX[4] - colX[3]) - 2, 'right');
        drawCell(row.amountImg, colX[5] - 4, rowTextY, (colX[5] - colX[4]) - 2, 'right');

        let lineY = rowTextY - (row.descLines.length > 1 ? 2 : 0);
        for (const img of row.descImgs) {
            drawCell(img, colX[1] + 2, lineY, colX[2] - colX[1] - 4, 'left');
            lineY += 5;
        }

        doc.line(colX[0], yPosition + row.rowHeight, colX[5], yPosition + row.rowHeight);
        yPosition += row.rowHeight;
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