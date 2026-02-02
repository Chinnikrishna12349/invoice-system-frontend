import { Invoice, CompanyInfo } from '../types';
import { calculateTax, Country } from '../services/countryPreferenceService';
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

    if (hasJapanese || language === 'ja') {
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
                        const targetHeight = fontSize * 0.3527 * 1.5;

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
                            adjustedY = y - finalHeight / 1.5; // Center vertically relative to baseline approx
                        } else if (align === 'center') {
                            adjustedX = x - finalWidth / 2;
                            adjustedY = y - finalHeight / 1.5;
                        } else {
                            // Left alignment
                            adjustedY = y - finalHeight / 1.5;
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
    let yPosition = 18;

    // Use passed company info
    const companyInfoToUse = companyInfo;
    const effectiveCountry = language === 'ja' ? 'japan' : (invoice.country || 'india');

    const formatAmount = (value: number) => {
        const isJapan = effectiveCountry === 'japan';
        const symbol = isJapan ? 'Yen ' : 'Rs. ';

        // Manual formatting to avoid hidden characters from toLocaleString
        const fixedValue = isJapan ? Math.round(value).toString() : value.toFixed(2);
        const parts = fixedValue.split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        const formattedNumber = parts.join('.');

        return `${symbol}${formattedNumber}`;
    };

    // Format date as DD/MM/YYYY
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    // Add logo at top left
    // Fallback to base64-encoded Vision AI logo if no custom logo uploaded
    const isVisionAI = companyInfoToUse?.companyName === 'Vision AI LLC';
    const logoToUse = isVisionAI ? (companyInfoToUse?.companyLogoUrl || VISION_AI_LOGO_BASE64) : null;
    await addLogoToPdf(doc, 14, yPosition, logoToUse, 50);

    // Right Column Start Position (Aligned for Header and Bill To)
    const rightColX = 120;
    const rightColWidth = 196 - rightColX;

    // Invoice # and Date (top right)
    // Aligned to right column start
    // Adjusted Y (yPosition + 5) to align text baseline/visual top with image top
    let headerTextY = yPosition + 5;

    await addTextToPdf(doc, `${t.invoiceNo} ${invoice.invoiceNumber}`, rightColX, headerTextY, {
        fontSize: 11,
        fontStyle: 'bold',
        align: 'left',
        language,
        maxWidth: rightColWidth
    });
    headerTextY += 6;

    await addTextToPdf(doc, `${t.date} ${formatDate(invoice.date)}`, rightColX, headerTextY, {
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



        // Email
        if (invoice.employeeEmail && invoice.employeeEmail.trim()) {
            await addTextToPdf(doc, `${t.email}: ${invoice.employeeEmail.trim()}`, billToX, billToY, {
                fontSize: 10,
                align: 'left',
                language,
                maxWidth: rightColWidth
            });
            billToY += 5;
        }

        // Phone
        if (invoice.employeeMobile && invoice.employeeMobile.trim()) {
            await addTextToPdf(doc, `${t.phone}: ${invoice.employeeMobile.trim()}`, billToX, billToY, {
                fontSize: 10,
                align: 'left',
                language,
                maxWidth: rightColWidth
            });
            billToY += 5;
        }

        // Address
        if (invoice.employeeAddress && invoice.employeeAddress.trim()) {
            const addressLabel = `${t.address}:`;
            const fullAddress = `${addressLabel} ${invoice.employeeAddress.replace(/\n/g, ', ')}`;

            await addTextToPdf(doc, fullAddress, billToX, billToY, {
                fontSize: 10,
                align: 'left',
                language,
                maxWidth: rightColWidth
            });
            const approxLines = Math.ceil(doc.getTextWidth(fullAddress) / rightColWidth);
            billToY += (approxLines * 5) + 5;
        }
    }

    // Due Date (Always display, below Bill To section)
    if (invoice.dueDate) {
        // Ensure "Due Date: DD/MM/YYYY" format with Bold Label AND Value
        await addTextToPdf(doc, `${t.dueDate}: ${formatDate(invoice.dueDate)}`, billToX, billToY, {
            fontSize: 10,
            fontStyle: 'bold', // Requirement: Label and value must be in bold
            align: 'left',
            language,
            maxWidth: rightColWidth
        });
        billToY += 5;
    }

    yPosition = Math.max(fromY, billToY) + 15;

    // Services Table
    const colX = [14, 30, 110, 135, 165, 196];
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
        const amount = service.hours * service.rate;
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

        // Hours (Right Aligned)
        doc.text(service.hours.toFixed(0), colX[3] - 4, rowTextY, { align: 'right' });

        // Unit Price WITH CURRENCY (Right Aligned)
        const formattedRate = formatAmount(service.rate);
        await addTextToPdf(doc, formattedRate, colX[4] - 4, rowTextY, {
            align: 'right', language, fontSize: 10, maxWidth: (colX[4] - colX[3]) - 2
        });

        // Amount WITH CURRENCY (Right Aligned)
        const formattedAmount = formatAmount(amount);
        await addTextToPdf(doc, formattedAmount, colX[5] - 4, rowTextY, {
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
    const subTotal = invoice.services.reduce((acc, s) => acc + (s.hours * s.rate), 0);
    const taxRate = invoice.taxRate || 0;

    // Only calculate tax if it's India OR Japanese Consumption Tax toggle is ON
    const shouldCalculateTax = effectiveCountry === 'india' || (effectiveCountry === 'japan' && invoice.showConsumptionTax);

    const taxCalculation = calculateTax(subTotal, shouldCalculateTax ? taxRate : 0, effectiveCountry, invoice.cgstRate, invoice.sgstRate);
    const { grandTotal, consumptionTaxRate, consumptionTaxAmount, cgstRate, sgstRate, cgstAmount, sgstAmount } = taxCalculation;

    const drawTotalRow = async (label: string, value: string, isBold: boolean = false) => {
        const rowH = 8;
        doc.line(colX[0], yPosition, colX[0], yPosition + rowH);
        doc.line(colX[4], yPosition, colX[4], yPosition + rowH);
        doc.line(colX[5], yPosition, colX[5], yPosition + rowH);

        doc.line(colX[0], yPosition + rowH, colX[5], yPosition + rowH);

        const fontStyle = isBold ? 'bold' : 'normal';
        const fontSize = 10;

        await addTextToPdf(doc, label, colX[0] + 2, yPosition + 5, {
            fontSize, fontStyle: isBold ? 'bold' : 'normal', align: 'left', language
        });

        doc.setFont('helvetica', isBold ? 'bold' : 'normal');
        doc.setFontSize(fontSize);
        // Correctly right-align value at the end of the table
        doc.text(value, colX[5] - 4, yPosition + 5, { align: 'right' });

        yPosition += rowH;
    };

    // SubTotal
    await drawTotalRow(t.subtotal, formatAmount(subTotal), true);

    // Tax
    if (effectiveCountry === 'japan') {
        if (invoice.showConsumptionTax && consumptionTaxRate !== undefined) {
            await drawTotalRow(`${t.consumptionTax} (${consumptionTaxRate}%)`, formatAmount(consumptionTaxAmount || 0), true);
        }
    } else {
        // Use cgstRate/sgstRate from invoice if available, else fall back to calculation
        const effectiveCgstRate = invoice.cgstRate ?? cgstRate;
        const effectiveSgstRate = invoice.sgstRate ?? sgstRate;

        const effectiveCgstAmount = invoice.cgstRate !== undefined ? (subTotal * (invoice.cgstRate / 100)) : (cgstAmount || 0);
        const effectiveSgstAmount = invoice.sgstRate !== undefined ? (subTotal * (invoice.sgstRate / 100)) : (sgstAmount || 0);

        if (effectiveCgstRate) await drawTotalRow(`CGST (${effectiveCgstRate}%)`, formatAmount(effectiveCgstAmount), true);
        if (effectiveSgstRate) await drawTotalRow(`SGST (${effectiveSgstRate}%)`, formatAmount(effectiveSgstAmount), true);
    }

    // Grand Total
    const finalGrandTotal = shouldCalculateTax ? grandTotal : subTotal;
    await drawTotalRow(t.grandTotal, formatAmount(finalGrandTotal), true);

    yPosition += 15;

    // Footer: Bank Details (Left) and Signature (Right)

    if (isVisionAI) {
        const bankY = yPosition;

        await addTextToPdf(doc, 'Bank Details:', 14, bankY, { fontSize: 10, fontStyle: 'bold' });
        doc.setFont('helvetica', 'normal');

        const details = [
            `Bank Name: ${companyInfoToUse?.bankDetails?.bankName || ''}`,
            `Branch: ${companyInfoToUse?.bankDetails?.branchName || ''}`,
            `Branch Code: ${companyInfoToUse?.bankDetails?.branchCode || ''}`,
            `Account Type: ${companyInfoToUse?.bankDetails?.accountType || ''}`,
            `Account No: ${companyInfoToUse?.bankDetails?.accountNumber || ''}`,
            `Account Holder: ${companyInfoToUse?.bankDetails?.accountHolderName || ''}`,
            `IFSC Code: ${companyInfoToUse?.bankDetails?.ifscCode || ''}`,
        ].filter(detail => {
            const parts = detail.split(': ');
            return parts.length > 1 && parts[1].trim().length > 0;
        });

        let curY = bankY + 7;
        for (const d of details) {
            await addTextToPdf(doc, d, 14, curY, { fontSize: 11, fontStyle: 'bold' });
            curY += 7;
        }

        // Add Static VisionAI Logo/Stamp above Signature
        const stampX = 160;
        const stampY = bankY - 8;
        const stampSize = 25;

        await addStaticStampToPdf(doc, stampX, stampY, visionAiStamp, stampSize, stampSize);

        await addTextToPdf(doc, 'Authorised Signature', stampX, bankY + 24, {
            fontSize: 10, fontStyle: 'bold', align: 'left'
        });
    } else {
        // For other companies, just show signature line
        const sigX = 160;
        const sigY = yPosition + 15;
        await addTextToPdf(doc, 'Authorised Signature', sigX, sigY, {
            fontSize: 10, fontStyle: 'bold', align: 'left'
        });
    }
};




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

        // Save
        const langSuffix = language === 'ja' ? '_ja' : '';
        const fileName = language === 'ja'
            ? `請求書_${invoice.invoiceNumber}.pdf`
            : `invoice_${invoice.invoiceNumber}.pdf`;

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