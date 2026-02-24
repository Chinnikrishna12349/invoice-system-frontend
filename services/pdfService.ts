import { Invoice, CompanyInfo } from '../types';
import { calculateTax, Country, formatCurrency, formatDate } from '../services/countryPreferenceService';
import jsPDF from 'jspdf';
import i18n from '../src/i18n/i18n';
import { configureJapaneseFont, renderJapaneseText } from './japaneseFontSupport';
import { getCompanyInfo } from './authService';
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
    } = {}
): Promise<void> => {
    const { fontSize = 10, fontStyle = 'normal', align = 'left', language = 'en', maxWidth = 100 } = options;

    // Check for Japanese characters OR specific currency symbols (¥, ₹)
    const hasJapanese = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\u00A5\u20B9]/.test(text);
    const isPureAscii = /^[\u0020-\u007E]*$/.test(text); // Check for printable ASCII

    if (hasJapanese || (language === 'ja' && !isPureAscii)) {
        // Use html2canvas for Japanese text
        try {
            const imageData = await renderJapaneseText(text, fontSize, fontStyle, maxWidth, align);
            if (imageData && imageData !== 'data:,') {
                // Get image dimensions
                const img = new Image();
                await new Promise<void>((resolve) => {
                    img.onload = () => {
                        const aspectRatio = img.width / img.height;

                        // Calculate target height in mm based on font size (pt to mm conversion: 1pt ≈ 0.3527mm)
                        // Add a small buffer factor because html2canvas might have padding
                        const targetHeight = fontSize * 0.3527 * 1.6;

                        // Calculate natural width based on aspect ratio
                        let finalWidth = targetHeight * aspectRatio;
                        let finalHeight = targetHeight;

                        // Constrain by maxWidth if necessary
                        if (finalWidth > maxWidth) {
                            finalWidth = maxWidth;
                            finalHeight = finalWidth / aspectRatio;
                        }

                        // Adjust positions based on alignment
                        let adjustedX = x;
                        let adjustedY = y;

                        if (align === 'right') {
                            // For right alignment, x is the right edge
                            adjustedX = x - finalWidth;
                            adjustedY = y - finalHeight; // Adjusted to move image bottom to baseline
                        } else if (align === 'center') {
                            adjustedX = x - finalWidth / 2;
                            adjustedY = y - finalHeight;
                        } else {
                            // Left alignment
                            adjustedX = x - 1; // Corrected alignment offset as requested
                            adjustedY = y - finalHeight;
                        }

                        // Add image with calculated dimensions
                        doc.addImage(imageData, 'PNG', adjustedX, adjustedY, finalWidth, finalHeight, '', 'FAST');
                        resolve();
                    };
                    img.onerror = () => {
                        console.warn('Image load failed, using fallback');
                        resolve();
                    };
                    img.src = imageData;
                });
            } else {
                // Fallback to regular text if rendering fails
                doc.setFont('helvetica', fontStyle);
                doc.setFontSize(fontSize);
                doc.text(text, x, y, { align, maxWidth });
            }
        } catch (error) {
            console.warn('Error rendering Japanese text, using fallback:', error);
            doc.setFont('helvetica', fontStyle);
            doc.setFontSize(fontSize);
            doc.text(text, x, y, { align, maxWidth });
        }
    } else {
        // Use regular jsPDF text for English
        doc.setFont('helvetica', fontStyle);
        doc.setFontSize(fontSize);
        doc.text(text, x, y, { align, maxWidth });
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
        invoice: language === 'ja' ? '請求書' : 'INVOICE',
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
        thankYouMessage: language === 'ja' ? '今後ともご愛顧のほどよろしくお願い申し上げます。' : i18n.t('invoice.thankYou'),
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
        companyEmail: i18n.t('company.email')
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
    let yPosition = 10;

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

    await addLogoToPdf(doc, 14, yPosition, logoToUse, 50);

    // Right Column Start Position (Aligned for Header and Bill To)
    const rightColX = 120;
    const rightColWidth = 196 - rightColX;

    // Invoice # and Date (top right)
    // Aligned to right column start
    // Adjusted Y (yPosition + 5) to align text baseline/visual top with image top
    let headerTextY = yPosition + 5;

    // Stamp moved to bottom right as requested

    await addTextToPdf(doc, `${t.invoiceNo} ${invoice.invoiceNumber}`, rightColX, headerTextY, {
        fontSize: 11,
        fontStyle: 'bold',
        align: 'left',
        language,
        maxWidth: rightColWidth
    });
    headerTextY += 6;

    await addTextToPdf(doc, `${t.date} ${formatDateInPdf(invoice.date)}`, rightColX, headerTextY, {
        fontSize: 11,
        fontStyle: 'bold',
        align: 'left',
        language,
        maxWidth: rightColWidth
    });

    // Set yPosition for content start
    // Ensure we clear the logo (25mm height) + header and add sufficient padding (12mm)
    // Logo Y: 18, Height: 25 -> Bottom: 43.
    // New Y targets: 18 + 37 = 55. Gap = 12mm.
    yPosition += 37;

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
    await addTextToPdf(doc, companyInfoToUse?.companyName || invoice.company || t.companyName, 14, fromY, {
        fontSize: 10,
        fontStyle: 'bold',
        language,
        maxWidth: 90
    });
    fromY += 8; // Increased gap after bold company name

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
            await addTextToPdf(doc, line.trim(), 14, fromY, {
                fontSize: 10,
                language,
                maxWidth: 90
            });
            fromY += 5;
        }
    }

    // From Email (From Sender) - Added as requested with label and fallback
    const senderEmail = invoice.fromEmail || (invoice as any).gmail;
    if (senderEmail && senderEmail.trim()) {
        console.log('PDF Generator: Drawing From Email:', senderEmail);
        await addTextToPdf(doc, `${t.email || 'Email'}: ${senderEmail.trim()}`, 14, fromY + 2, {
            fontSize: 10,
            language,
            maxWidth: 90
        });
        fromY += 7;
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
            maxWidth: rightColWidth
        });
        billToY = fromStartY + 6;

        await addTextToPdf(doc, invoice.employeeName.trim(), billToX, billToY, {
            fontSize: 10,
            fontStyle: 'bold',
            align: 'left',
            language,
            maxWidth: rightColWidth
        });
        billToY += 8; // Increased gap after bold client name



        // Bill To: email, phone and address field labels rendered with uniform width for alignment
        const labelWidth = 18; // mm for uniform label space

        // Email
        if (invoice.employeeEmail && invoice.employeeEmail.trim()) {
            const label = language === 'ja' ? `${t.email} : ` : `${t.email}: `;
            await addTextToPdf(doc, label, billToX, billToY, {
                fontSize: 10,
                fontStyle: 'normal',
                align: 'left',
                language
            });
            await addTextToPdf(doc, invoice.employeeEmail.trim(), billToX + labelWidth + 2, billToY, {
                fontSize: 10,
                align: 'left',
                language,
                maxWidth: rightColWidth - labelWidth - 2
            });
            billToY += 7;
        }

        // Phone
        if (invoice.employeeMobile && invoice.employeeMobile.trim()) {
            const label = language === 'ja' ? `${t.phone} : ` : `${t.phone}: `;
            await addTextToPdf(doc, label, billToX, billToY, {
                fontSize: 10,
                fontStyle: 'normal',
                align: 'left',
                language
            });
            await addTextToPdf(doc, invoice.employeeMobile.trim(), billToX + labelWidth + 2, billToY, {
                fontSize: 10,
                align: 'left',
                language,
                maxWidth: rightColWidth - labelWidth - 2
            });
            billToY += 7;
        }

        // Address
        if (invoice.employeeAddress && invoice.employeeAddress.trim()) {
            const label = language === 'ja' ? `${t.address} : ` : `${t.address}: `;
            await addTextToPdf(doc, label, billToX, billToY, {
                fontSize: 10,
                fontStyle: 'normal',
                align: 'left',
                language
            });
            await addTextToPdf(doc, invoice.employeeAddress.replace(/\n/g, ', ').trim(), billToX + labelWidth + 2, billToY, {
                fontSize: 10,
                align: 'left',
                language,
                maxWidth: rightColWidth - labelWidth - 2
            });
            billToY += 7;
        }
    }

    // Align PO Number (Left) and Due Date (Right) strictly opposite to each other
    // Calculate the starting Y for this row, ensuring it's below both From and Bill To sections
    let commonRowY = Math.max(fromY, billToY) + 3; // Add gap

    // PO Number (Left Side)
    if (invoice.poNumber && invoice.poNumber.trim()) {
        await addTextToPdf(doc, `PO Number: ${invoice.poNumber.trim()}`, 14, commonRowY, {
            fontSize: 10,
            fontStyle: 'bold',
            language,
            maxWidth: 90
        });
    }

    // Due Date (Right Side)
    if (invoice.dueDate) {
        await addTextToPdf(doc, `${t.dueDate}: ${formatDateInPdf(invoice.dueDate)}`, billToX, commonRowY, {
            fontSize: 10,
            fontStyle: 'bold',
            align: 'left',
            language,
            maxWidth: rightColWidth
        });
    }

    // Update Y position for the table start, based on this new row
    yPosition = commonRowY + 15;



    // Services Table
    // Adjusted widths to prevent layout breaks for large amounts (T3)
    // Original: [14, 25, 95, 120, 158, 196]
    // Refined: [14, 25, 90, 115, 155, 196] (Gives more space to Rate and Amount)
    const colX = [14, 25, 90, 115, 155, 196];
    const tableStartY = yPosition;

    doc.setDrawColor(0);
    doc.setLineWidth(0.1);

    // Header Row
    doc.line(colX[0], tableStartY, colX[5], tableStartY);

    const headerHeight = 10;
    const textY = tableStartY + 6;

    // SNO
    await addTextToPdf(doc, 'SNO', (colX[0] + colX[1]) / 2, textY, {
        fontSize: 10, fontStyle: 'bold', align: 'center', language
    });
    // Description
    await addTextToPdf(doc, t.description, (colX[1] + colX[2]) / 2, textY, {
        fontSize: 10, fontStyle: 'bold', align: 'center', language
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

        for (const x of colX) {
            doc.line(x, yPosition, x, yPosition + rowHeight);
        }

        const rowTextY = yPosition + (rowHeight / 2) + 1;

        // SNO
        doc.text(String(index + 1), (colX[0] + colX[1]) / 2, rowTextY, { align: 'center' });

        // Description
        if (descLines.length === 1) {
            // Check for Japanese in description too
            await addTextToPdf(doc, descLines[0], (colX[1] + colX[2]) / 2, rowTextY, {
                align: 'center', language, maxWidth: descWidth, fontSize: 10
            });
        } else {
            // For multi-line, we might need a loop or simple text if no Japanese.
            // If description has Japanese, doc.splitTextToSize might behave oddly if it doesn't support the font.
            // But assuming split works or we just print lines:
            let lineY = yPosition + 4;
            for (const line of descLines) {
                await addTextToPdf(doc, line, (colX[1] + colX[2]) / 2, lineY, {
                    align: 'center', language, maxWidth: descWidth, fontSize: 10
                });
                lineY += 5;
            }
        }

        // Hours (Right Aligned) - Formatted specifically for T4/T5
        const formattedHours = Number(service.hours).toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        });
        doc.text(formattedHours, colX[3] - 4, rowTextY, { align: 'right' });

        // Unit Price WITH CURRENCY (Right Aligned)
        const formattedRate = formatAmount(service.rate, false);
        await addTextToPdf(doc, formattedRate, colX[4] - 4, rowTextY, {
            align: 'right', language, fontSize: 10, maxWidth: (colX[4] - colX[3]) - 2
        });

        // Amount WITH CURRENCY (Right Aligned)
        // Use the same rounded amount for consistency
        const formattedItemAmount = formatAmount(amount, false);
        await addTextToPdf(doc, formattedItemAmount, colX[5] - 4, rowTextY, {
            align: 'right', language, fontSize: 10, maxWidth: (colX[5] - colX[4]) - 2
        });

        doc.line(colX[0], yPosition + rowHeight, colX[5], yPosition + rowHeight);

        yPosition += rowHeight;


        if (yPosition > 250) {
            doc.addPage();
            yPosition = 20;
            // Draw header again on new page? (Optional, but good for production ready)
        }
    }

    // Totals Section
    const subTotal = invoice.services.reduce((acc, s) => acc + Math.round((s.hours * s.rate) * 100) / 100, 0);
    const taxRate = invoice.taxRate || 0;

    // Only calculate tax if it's India OR Japanese Consumption Tax toggle is ON
    const shouldCalculateTax = effectiveCountry === 'india' || (effectiveCountry === 'japan' && invoice.showConsumptionTax);

    const taxCalculation = calculateTax(subTotal, shouldCalculateTax ? taxRate : 0, effectiveCountry, invoice.cgstRate, invoice.sgstRate);
    const { grandTotal, consumptionTaxRate, consumptionTaxAmount, cgstRate, sgstRate, cgstAmount, sgstAmount } = taxCalculation;

    const drawTotalRow = async (label: string, value: string, isBold: boolean = false) => {
        const rowH = 10; // Increased height to prevent overlap
        doc.line(colX[0], yPosition, colX[0], yPosition + rowH);
        doc.line(colX[4], yPosition, colX[4], yPosition + rowH);
        doc.line(colX[5], yPosition, colX[5], yPosition + rowH);

        doc.line(colX[0], yPosition + rowH, colX[5], yPosition + rowH);

        const fontSize = 10;
        const textY = yPosition + 7; // Adjusted baseline for better vertical centering

        await addTextToPdf(doc, label, colX[0] + 2, textY, {
            fontSize, fontStyle: isBold ? 'bold' : 'normal', align: 'left', language
        });

        doc.setFont('helvetica', isBold ? 'bold' : 'normal');
        doc.setFontSize(fontSize);
        // Correctly right-align value at the end of the table
        doc.text(value, colX[5] - 4, textY, { align: 'right' });

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

        if (effectiveCgstRate) await drawTotalRow(`CGST (${effectiveCgstRate}%)`, formatAmount(effectiveCgstAmount, false, false), true);
        if (effectiveSgstRate) await drawTotalRow(`SGST (${effectiveSgstRate}%)`, formatAmount(effectiveSgstAmount, false, false), true);
    }

    // Round Off (if exists)
    if (invoice.roundOff !== undefined && invoice.roundOff !== 0) {
        await drawTotalRow('Round Off', formatAmount(invoice.roundOff, false, false), true);
    }

    // Grand Total (Currency in label, amount without symbol)
    // Use stored finalAmount if available, otherwise calculated
    const currencyCode = effectiveCountry === 'japan' ? 'JPY' : 'INR';
    const finalGrandTotal = invoice.finalAmount !== undefined ? invoice.finalAmount : (shouldCalculateTax ? grandTotal : subTotal);

    await drawTotalRow(`${t.grandTotal} (${currencyCode})`, formatAmount(finalGrandTotal, false, true), true);

    yPosition += 15;

    // Footer: Bank Details (Left) and Signature (Right)
    const hasBankDetails = companyInfoToUse?.bankDetails &&
        Object.values(companyInfoToUse.bankDetails).some(v => v && v.toString().trim().length > 0);

    if (hasBankDetails) {
        const bankY = yPosition;

        await addTextToPdf(doc, 'Bank Details:', 14, bankY, { fontSize: 11, fontStyle: 'bold' });
        doc.setFont('helvetica', 'normal');

        const details = [
            { label: 'Bank Name:', value: companyInfoToUse?.bankDetails?.bankName },
            { label: 'Branch:', value: companyInfoToUse?.bankDetails?.branchName },
            { label: 'Branch Code:', value: companyInfoToUse?.bankDetails?.branchCode },
            { label: 'Account Type:', value: companyInfoToUse?.bankDetails?.accountType },
            { label: 'Account No:', value: companyInfoToUse?.bankDetails?.accountNumber }, // Matched Preview 'Account No'
            { label: 'Account Holder:', value: companyInfoToUse?.bankDetails?.accountHolderName },
        ];

        // Add IFSC or Swift Code based on logic matching InvoiceLayout
        const swift = companyInfoToUse?.bankDetails?.swiftCode?.trim();
        const ifsc = companyInfoToUse?.bankDetails?.ifscCode?.trim();
        const isJapan = effectiveCountry === 'japan';

        if (isJapan || (swift && swift.length > 0)) {
            if (swift || ifsc) {
                details.push({ label: 'Swift Code:', value: (swift && swift.length > 0) ? swift : ifsc });
            }
        } else if (ifsc && ifsc.length > 0) {
            details.push({ label: 'IFSC Code:', value: ifsc });
        }

        const validDetails = details.filter(item => item.value && item.value.trim().length > 0);

        let curY = bankY + 10;
        let accountIdY = bankY + 10; // Default vertical alignment point

        for (const item of validDetails) {
            // Label
            await addTextToPdf(doc, item.label, 14, curY, {
                fontSize: 10,
                fontStyle: 'normal'
            });

            // Value (Offset by 45mm for alignment)
            await addTextToPdf(doc, item.value || '', 58, curY, {
                fontSize: 10,
                fontStyle: 'normal'
            });

            // Capture Y of Account Holder for horizontal alignment of signature
            if (item.label === 'Account Holder:') {
                accountIdY = curY;
            }

            curY += 10;
        }

        // Authorized Signature (Right) - Aligned with Account Holder row
        const signatureX = rightColX + (rightColWidth / 2);
        const signatureY = accountIdY;

        // Add Vision AI Stamp if applicable (above signature)
        if (isVisionAI) {
            const stampSize = 18;
            await addStaticStampToPdf(doc, rightColX + (rightColWidth / 2) - (stampSize / 2), signatureY - 20, visionAiStamp, stampSize, stampSize);
        }

        doc.setDrawColor(0);
        doc.setLineWidth(0.2);
        doc.line(rightColX + 5, signatureY, colX[5] - 5, signatureY);

        await addTextToPdf(doc, t.authorisedSignature || 'Authorised Signature', rightColX + (rightColWidth / 2), signatureY + 5, {
            fontSize: 10,
            fontStyle: 'bold',
            align: 'center',
            language
        });
    }
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