package com.invoiceapp.service;

import com.invoiceapp.dto.InvoiceDTO;
import com.itextpdf.io.font.constants.StandardFonts;
import com.itextpdf.io.image.ImageData;
import com.itextpdf.io.image.ImageDataFactory;
import com.itextpdf.io.font.PdfEncodings;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.kernel.pdf.*;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Image;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.HorizontalAlignment;
import com.itextpdf.layout.properties.VerticalAlignment;
import com.itextpdf.layout.properties.UnitValue;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Text;
import com.itextpdf.layout.borders.Border;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.colors.ColorConstants;
import org.springframework.stereotype.Service;

import java.io.*;
import java.text.DecimalFormat;
import java.text.SimpleDateFormat;
import java.util.Base64;
import java.util.Date;
import java.util.Locale;

@Service
public class PdfService {

        private static final float PAGE_HEIGHT = 841.89f;

        public byte[] generateInvoicePdf(InvoiceDTO invoice) throws IOException {

                ByteArrayOutputStream baos = new ByteArrayOutputStream();

                System.out.println("Generating PDF for Invoice: " + invoice.getInvoiceNumber());
                System.out.println("PDF generation - From Email: " + invoice.getFromEmail());
                System.out.println("PDF generation - PO Number: " + invoice.getPoNumber());
                System.out.println("PDF generation - Due Date: " + invoice.getDueDate());

                // ✅ ENABLE MAX COMPRESSION & OPTIMIZATIONS
                WriterProperties props = new WriterProperties()
                                .setCompressionLevel(CompressionConstants.BEST_COMPRESSION) // Use maximum compression
                                .useSmartMode()
                                .setFullCompressionMode(true)
                                .addXmpMetadata() // Add XMP metadata for better compression
                                .setPdfVersion(PdfVersion.PDF_2_0); // Use latest PDF version for better compression

                PdfWriter pdfWriter = new PdfWriter(baos, props);
                PdfDocument pdfDoc = new PdfDocument(pdfWriter);
                Document document = new Document(pdfDoc);

                try {
                        // Document compression is handled by WriterProperties

                        // Load Fonts with Unicode Support (Essential for Rupee Symbol)
                        PdfFont boldFont;
                        PdfFont regularFont;
                        try {
                                // Priority 1: Meiryo (Windows Standard for CJK + English consistency)
                                String meiryoPath = "C:/Windows/Fonts/meiryo.ttc";
                                String meiryoBoldPath = "C:/Windows/Fonts/meiryob.ttc";
                                String msGothicPath = "C:/Windows/Fonts/msgothic.ttc";

                                System.out.println("Attempting to load fonts...");

                                if (new File(meiryoPath).exists() && new File(meiryoBoldPath).exists()) {
                                        System.out.println("Loading Meiryo fonts...");
                                        boldFont = PdfFontFactory.createFont(meiryoBoldPath + ",0",
                                                        PdfEncodings.IDENTITY_H);
                                        regularFont = PdfFontFactory.createFont(meiryoPath + ",0",
                                                        PdfEncodings.IDENTITY_H);
                                } else if (new File(msGothicPath).exists()) {
                                        System.out.println("Meiryo not found. Loading MS Gothic...");
                                        // MS Gothic doesn't have a separate bold file usually, so we use the same for
                                        // both or let iText simulate (not ideal)
                                        // Or use index 0 and hope for the best.
                                        regularFont = PdfFontFactory.createFont(msGothicPath + ",0",
                                                        PdfEncodings.IDENTITY_H);
                                        boldFont = regularFont; // Fallback: everything regular if no bold
                                } else {
                                        // Priority 2: Linux Common Unicode Fonts
                                        System.out.println("Windows fonts not found. Checking Linux fonts...");
                                        String[] fontPaths = {
                                                        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
                                                        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
                                                        "C:/Windows/Fonts/arialbd.ttf" // Fallback
                                        };
                                        String fontPath = null;
                                        for (String path : fontPaths) {
                                                if (new File(path).exists()) {
                                                        fontPath = path;
                                                        break;
                                                }
                                        }

                                        if (fontPath != null) {
                                                boldFont = PdfFontFactory.createFont(fontPath, PdfEncodings.IDENTITY_H);
                                                String regularPath = fontPath.replace("-Bold", "").replace("bd", "");
                                                regularFont = PdfFontFactory.createFont(regularPath,
                                                                PdfEncodings.IDENTITY_H);
                                        } else {
                                                System.out.println(
                                                                "No Unicode fonts found. Falling back to Helvetica.");
                                                boldFont = PdfFontFactory.createFont(StandardFonts.HELVETICA_BOLD);
                                                regularFont = PdfFontFactory.createFont(StandardFonts.HELVETICA);
                                        }
                                }
                        } catch (Exception e) {
                                System.err.println("Font loading failed: " + e.getMessage());
                                boldFont = PdfFontFactory.createFont(StandardFonts.HELVETICA_BOLD);
                                regularFont = PdfFontFactory.createFont(StandardFonts.HELVETICA);
                        }

                        String formattedDate = formatDate(invoice.getDate());
                        float yPos = convertMmToPoints(18);

                        /*
                         * ======================================================
                         * ✅ STATIC STAMP/LOGO ABOVE SIGNATURE
                         * ======================================================
                         */
                        // Removed header logo to match requested professional layout if needed,
                        // but keeping it for now if it was intended.
                        // The user specifically asked for the logo ABOVE SIGNATURE.

                        com.invoiceapp.dto.CompanyInfoDTO company = invoice.getCompanyInfo();
                        String cName = (company != null && company.getCompanyName() != null) ? company.getCompanyName()
                                        : "Your Company";
                        String cAddress = (company != null && company.getCompanyAddress() != null)
                                        ? company.getCompanyAddress()
                                        : "";

                        // ✅ TOP LOGO (Robust Loading)
                        boolean isVisionAI = "Vision AI LLC".equalsIgnoreCase(cName);

                        // ✅ TOP LOGO (Robust Loading)
                        if (company != null) {
                                try {
                                        ImageData logoData = null;

                                        // Try to load custom logo if Base64 or URL is provided
                                        if (company.getCompanyLogoUrl() != null
                                                        && !company.getCompanyLogoUrl().isEmpty()) {
                                                String logoPath = company.getCompanyLogoUrl();

                                                if (logoPath.startsWith("data:image")) {
                                                        String base64 = logoPath.substring(logoPath.indexOf(",") + 1);
                                                        logoData = ImageDataFactory
                                                                        .create(Base64.getDecoder().decode(base64));
                                                } else {
                                                        // Strategy 1: Check local uploads directory (stripped of URL)
                                                        String filename = logoPath;
                                                        if (filename.contains("/uploads/")) {
                                                                filename = filename
                                                                                .substring(filename.indexOf("/uploads/")
                                                                                                + 9);
                                                        } else if (filename.contains("/")) {
                                                                filename = filename.substring(
                                                                                filename.lastIndexOf("/") + 1);
                                                        }

                                                        File localFile = new File("uploads/" + filename);
                                                        if (localFile.exists()) {
                                                                logoData = ImageDataFactory
                                                                                .create(localFile.getAbsolutePath());
                                                        }
                                                        // Strategy 2: Try absolute path if provided
                                                        else if (new File(logoPath).exists()) {
                                                                logoData = ImageDataFactory.create(logoPath);
                                                        }
                                                        // Strategy 3: Try URL
                                                        else {
                                                                try {
                                                                        logoData = ImageDataFactory.create(logoPath);
                                                                } catch (Exception ignored) {
                                                                        // URL fetch failed
                                                                }
                                                        }
                                                }
                                        }

                                        // Fallback to default Vision AI logo if no custom logo loaded AND it is Vision
                                        // AI
                                        if (logoData == null && isVisionAI) {
                                                try {
                                                        java.net.URL resource = getClass()
                                                                        .getResource("/vision-ai-logo.png");
                                                        if (resource != null) {
                                                                logoData = ImageDataFactory.create(resource);
                                                        }
                                                } catch (Exception e) {
                                                        System.err.println("Could not load default Vision AI logo: "
                                                                        + e.getMessage());
                                                }
                                        }

                                        // Add logo to document if loaded
                                        if (logoData != null) {
                                                Image logoImg = new Image(logoData);
                                                logoImg.setHeight(convertMmToPoints(20));
                                                logoImg.setAutoScale(true);

                                                document.add(logoImg.setFixedPosition(convertMmToPoints(14),
                                                                PAGE_HEIGHT - convertMmToPoints(20),
                                                                convertMmToPoints(50)));
                                        }
                                } catch (Exception e) {
                                        System.err.println("Could not load company logo: " + e.getMessage());
                                }
                        }

                        // Check if logo was actually added (heuristic: assume VisionAI has logo or
                        // custom logo loaded)
                        // Actually, we can just check if we entered the block above.
                        // For simplicity, let's offset for VisionAI or if logo url is present.
                        boolean hasLogo = isVisionAI || (company != null && company.getCompanyLogoUrl() != null
                                        && !company.getCompanyLogoUrl().isEmpty());
                        float headerX = hasLogo ? convertMmToPoints(50) : convertMmToPoints(14); // Offset if logo
                                                                                                 // likely exists

                        Paragraph companyHeader = new Paragraph()
                                        .add(new Text(cName + "\n").setFont(boldFont).setFontSize(11))
                                        .add(new Text(cAddress + "\n").setFont(regularFont).setFontSize(9));

                        if (getValue(invoice.getFromEmail()) != null && !getValue(invoice.getFromEmail()).isEmpty()) {
                                companyHeader.add(new Text("Email: " + getValue(invoice.getFromEmail()))
                                                .setFont(regularFont).setFontSize(9));
                        }

                        if (getValue(invoice.getPoNumber()) != null && !getValue(invoice.getPoNumber()).isEmpty()) {
                                companyHeader.add(new Text("\nPO #: " + getValue(invoice.getPoNumber()))
                                                .setFont(boldFont).setFontSize(11));
                        }

                        companyHeader.setFixedPosition(headerX,
                                        PAGE_HEIGHT - convertMmToPoints(35), // Lowered slightly to 35mm bottom to allow
                                                                             // growth upwards without hitting top edge
                                                                             // too soon
                                        convertMmToPoints(100));
                        document.add(companyHeader);

                        // ✅ MOVED STAMP: Beside Invoice Number/Date (Left of it)
                        // Stamp moved to bottom right above signature

                        float rightX = convertMmToPoints(160);
                        yPos = convertMmToPoints(18);

                        document.add(new Paragraph("Invoice #: " + invoice.getInvoiceNumber())
                                        .setFont(boldFont)
                                        .setFontSize(11)
                                        .setFixedPosition(rightX, PAGE_HEIGHT - yPos, convertMmToPoints(50))
                                        .setTextAlignment(TextAlignment.RIGHT));

                        yPos += convertMmToPoints(7);

                        document.add(new Paragraph("Date: " + formattedDate)
                                        .setFont(boldFont)
                                        .setFontSize(11)
                                        .setFixedPosition(rightX, PAGE_HEIGHT - yPos, convertMmToPoints(50))
                                        .setTextAlignment(TextAlignment.RIGHT));

                        yPos += convertMmToPoints(7);

                        // Add Due Date
                        if (getValue(invoice.getDueDate()) != null && !getValue(invoice.getDueDate()).isEmpty()) {
                                String formattedDueDate = formatDate(invoice.getDueDate());
                                document.add(new Paragraph("Due Date: " + formattedDueDate)
                                                .setFont(boldFont)
                                                .setFontSize(11)
                                                .setFixedPosition(rightX, PAGE_HEIGHT - yPos, convertMmToPoints(50))
                                                .setTextAlignment(TextAlignment.RIGHT));
                        }

                        // ==================== Bill To Section ====================
                        float startY = PAGE_HEIGHT - yPos - convertMmToPoints(10);

                        // Employee/Client Info with uniform label alignment
                        Paragraph toPara = new Paragraph()
                                        .add(new Text("Bill To:\n").setFont(boldFont).setFontSize(10))
                                        .add(new Text(getValue(invoice.getEmployeeName()) + "\n").setFont(regularFont)
                                                        .setFontSize(10));

                        // Use tab-like spacing or specific cell structure for perfect alignment
                        // For a simple fix, we'll ensure labels are tracked.
                        if (getValue(invoice.getEmployeeEmail()) != null
                                        && !getValue(invoice.getEmployeeEmail()).isEmpty()) {
                                String label = "japan".equalsIgnoreCase(invoice.getCountry()) ? "メールアドレス : "
                                                : "Email:        ";
                                toPara.add(new Text(label).setFont(regularFont).setFontSize(10))
                                                .add(new Text(getValue(invoice.getEmployeeEmail()) + "\n")
                                                                .setFont(regularFont).setFontSize(10));
                        }
                        if (getValue(invoice.getEmployeeMobile()) != null
                                        && !getValue(invoice.getEmployeeMobile()).isEmpty()) {
                                String label = "japan".equalsIgnoreCase(invoice.getCountry()) ? "電話番号       : "
                                                : "Phone:        ";
                                toPara.add(new Text(label).setFont(regularFont).setFontSize(10))
                                                .add(new Text(getValue(invoice.getEmployeeMobile()) + "\n")
                                                                .setFont(regularFont).setFontSize(10));
                        }
                        if (getValue(invoice.getEmployeeAddress()) != null
                                        && !getValue(invoice.getEmployeeAddress()).isEmpty()) {
                                String addr = getValue(invoice.getEmployeeAddress()).replace("\n", ", ");
                                String label = "japan".equalsIgnoreCase(invoice.getCountry()) ? "住所           : "
                                                : "Address:    ";
                                toPara.add(new Text(label).setFont(regularFont).setFontSize(10))
                                                .add(new Text(addr).setFont(regularFont).setFontSize(10));
                        }

                        document.add(toPara.setFixedPosition(convertMmToPoints(14), startY - convertMmToPoints(25),
                                        convertMmToPoints(90)));
                        // ... Code omitted until Bank Details ...

                        // Logic for Bank Details at lines ~385
                        // I need to use multi_replace for this because the chunks are far apart.
                        // I will cancel this tool call and use multi_replace.

                        yPos += convertMmToPoints(45);

                        // ==================== Services Table ====================
                        // Adjusted to 5 columns with SNO and better widths for large amounts (T3)
                        // Sync with frontend: { 8, 33, 10, 24.5, 24.5 } approx
                        Table table = new Table(UnitValue.createPercentArray(new float[] { 8, 33, 12, 23.5f, 23.5f }))
                                        .setWidth(UnitValue.createPercentValue(100))
                                        .setMarginTop(convertMmToPoints(10));

                        // Header
                        String[] headers = { "SNO", "Description", "Hours", "Rate", "Amount" };
                        for (String header : headers) {
                                table.addCell(new Cell()
                                                .add(new Paragraph(header).setFont(boldFont)
                                                                .setFontColor(ColorConstants.WHITE))
                                                .setBackgroundColor(new DeviceRgb(6, 81, 237)) // Brand Blue
                                                .setTextAlignment(TextAlignment.CENTER)
                                                .setPadding(6)
                                                .setFontSize(10));
                        }

                        double subtotal = 0;
                        // Rows
                        if (invoice.getServices() != null) {
                                int sno = 1;
                                for (com.invoiceapp.entity.ServiceItem item : invoice.getServices()) {
                                        table.addCell(new Cell()
                                                        .add(new Paragraph(String.valueOf(sno++)).setFont(regularFont))
                                                        .setTextAlignment(TextAlignment.CENTER)
                                                        .setPadding(6)
                                                        .setFontSize(10));

                                        table.addCell(new Cell()
                                                        .add(new Paragraph(item.getDescription()).setFont(regularFont))
                                                        .setTextAlignment(TextAlignment.LEFT)
                                                        .setPadding(6)
                                                        .setFontSize(10));

                                        // Format hours using DecimalFormat to allow up to 2 decimal places (T4)
                                        DecimalFormat hoursFormat = new DecimalFormat("0.##");
                                        table.addCell(new Cell()
                                                        .add(new Paragraph(hoursFormat.format(item.getHours()))
                                                                        .setFont(regularFont))
                                                        .setTextAlignment(TextAlignment.CENTER)
                                                        .setPadding(6)
                                                        .setFontSize(10));

                                        table.addCell(new Cell()
                                                        .add(new Paragraph(formatCurrency(item.getRate(),
                                                                        invoice.getCountry(), false))
                                                                        .setFont(regularFont))
                                                        .setTextAlignment(TextAlignment.RIGHT)
                                                        .setPadding(6)
                                                        .setFontSize(10));

                                        // Round amount to 2 decimal places for consistent calculation (T5)
                                        double amount = Math.round((item.getHours() * item.getRate()) * 100.0) / 100.0;
                                        subtotal += amount;
                                        table.addCell(new Cell()
                                                        .add(new Paragraph(
                                                                        formatCurrency(amount, invoice.getCountry(),
                                                                                        false))
                                                                        .setFont(regularFont))
                                                        .setTextAlignment(TextAlignment.RIGHT)
                                                        .setPadding(6)
                                                        .setFontSize(10));
                                }
                        }
                        document.add(table);

                        // ==================== Totals Section ====================
                        Table totalTable = new Table(UnitValue.createPercentArray(new float[] { 70, 30 }))
                                        .setWidth(UnitValue.createPercentValue(50))
                                        .setHorizontalAlignment(HorizontalAlignment.RIGHT)
                                        .setMarginTop(20);

                        boolean showTax = !"japan".equalsIgnoreCase(invoice.getCountry())
                                        || (invoice.getShowConsumptionTax() != null && invoice.getShowConsumptionTax());
                        double taxRate = showTax ? (invoice.getTaxRate() != null ? invoice.getTaxRate() : 0.0) : 0.0;
                        double tax = Math.round((subtotal * (taxRate / 100.0)) * 100.0) / 100.0;
                        double grandTotal = subtotal + tax;

                        totalTable.addCell(createTotalCell("SubTotal", regularFont, 11));
                        totalTable.addCell(createTotalCell(formatCurrency(subtotal, invoice.getCountry(), false),
                                        regularFont,
                                        11));

                        if (showTax) {
                                String taxLabel = "japan".equalsIgnoreCase(invoice.getCountry())
                                                ? String.format("Consumption Tax (%.0f%%)", taxRate)
                                                : String.format("Tax (%.0f%%)", taxRate);

                                totalTable.addCell(createTotalCell(taxLabel, regularFont, 11));
                                totalTable.addCell(createTotalCell(formatCurrency(tax, invoice.getCountry(), false),
                                                regularFont, 11));
                        }

                        totalTable.addCell(createTotalCell("Grand Total", boldFont, 12)
                                        .setBackgroundColor(new DeviceRgb(245, 245, 245))
                                        .setPadding(8));
                        totalTable.addCell(
                                        createTotalCell(formatCurrency(grandTotal, invoice.getCountry(), true),
                                                        boldFont, 12)
                                                        .setBackgroundColor(new DeviceRgb(245, 245, 245))
                                                        .setPadding(8));

                        document.add(totalTable);

                        // ==================== Footer: Bank Details & Signature ====================
                        Table footerTable = new Table(UnitValue.createPercentArray(new float[] { 60, 40 }))
                                        .setWidth(UnitValue.createPercentValue(100))
                                        .setMarginTop(50);

                        com.invoiceapp.dto.BankDetailsDTO bank = (company != null) ? company.getBankDetails() : null;

                        if (bank != null) {
                                String bName = getValue(bank.getBankName());
                                String bAcc = getValue(bank.getAccountNumber());
                                String bHolder = getValue(bank.getAccountHolderName());
                                String bBranch = getValue(bank.getBranchName());
                                String bBranchCode = getValue(bank.getBranchCode());
                                String bAccType = getValue(bank.getAccountType());

                                Cell bankCell = new Cell().setBorder(Border.NO_BORDER);
                                bankCell.add(new Paragraph("Bank Details:").setFont(boldFont).setFontSize(10)
                                                .setMarginBottom(5));

                                float lineSpacing = 16.0f; // Fixed leading for uniform, non-cramped spacing

                                if (!bName.isEmpty())
                                        bankCell.add(new Paragraph()
                                                        .add(new Text("Bank Name: ").setFont(boldFont).setFontSize(13))
                                                        .add(new Text(bName).setFont(regularFont).setFontSize(13))
                                                        .setFixedLeading(lineSpacing).setMargin(0));
                                if (!bBranch.isEmpty())
                                        bankCell.add(new Paragraph()
                                                        .add(new Text("Branch: ").setFont(boldFont).setFontSize(13))
                                                        .add(new Text(bBranch).setFont(regularFont).setFontSize(13))
                                                        .setFixedLeading(lineSpacing).setMargin(0));
                                if (!bBranchCode.isEmpty())
                                        bankCell.add(new Paragraph()
                                                        .add(new Text("Branch Code: ").setFont(boldFont)
                                                                        .setFontSize(11))
                                                        .add(new Text(bBranchCode).setFont(regularFont).setFontSize(11))
                                                        .setFixedLeading(lineSpacing).setMargin(0));
                                if (!bAccType.isEmpty())
                                        bankCell.add(new Paragraph()
                                                        .add(new Text("Account Type: ").setFont(boldFont)
                                                                        .setFontSize(11))
                                                        .add(new Text(bAccType).setFont(regularFont).setFontSize(11))
                                                        .setFixedLeading(lineSpacing).setMargin(0));
                                if (!bAcc.isEmpty())
                                        bankCell.add(new Paragraph()
                                                        .add(new Text("Account No: ").setFont(boldFont).setFontSize(11))
                                                        .add(new Text(bAcc).setFont(regularFont).setFontSize(11))
                                                        .setFixedLeading(lineSpacing).setMargin(0));
                                if (!bHolder.isEmpty())
                                        bankCell.add(new Paragraph()
                                                        .add(new Text("Account Holder: ").setFont(boldFont)
                                                                        .setFontSize(13)) // Using fontSize 13 matching
                                                                                          // original
                                                        .add(new Text(bHolder).setFont(regularFont).setFontSize(13))
                                                        .setFixedLeading(lineSpacing).setMargin(0));

                                boolean isJapan = "japan".equalsIgnoreCase(invoice.getCountry());
                                String swiftCode = getValue(bank.getSwiftCode());
                                String ifscCode = getValue(bank.getIfscCode());

                                if (isJapan || !swiftCode.isEmpty()) {
                                        // Prefer Swift Code if available or if Japan
                                        String codeLabel = "Swift Code: ";
                                        String codeValue = !swiftCode.isEmpty() ? swiftCode : ifscCode; // Fallback to
                                                                                                        // IFSC field if
                                                                                                        // Swift is
                                                                                                        // empty
                                        if (!codeValue.isEmpty()) {
                                                bankCell.add(new Paragraph()
                                                                .add(new Text(codeLabel).setFont(boldFont)
                                                                                .setFontSize(11))
                                                                .add(new Text(codeValue).setFont(regularFont)
                                                                                .setFontSize(11))
                                                                .setFixedLeading(lineSpacing).setMargin(0));
                                        }
                                } else {
                                        // Default to IFSC for others
                                        if (!ifscCode.isEmpty()) {
                                                bankCell.add(new Paragraph()
                                                                .add(new Text("IFSC Code: ").setFont(boldFont)
                                                                                .setFontSize(11))
                                                                .add(new Text(ifscCode).setFont(regularFont)
                                                                                .setFontSize(11))
                                                                .setFixedLeading(lineSpacing).setMargin(0));
                                        }
                                }

                                footerTable.addCell(bankCell);
                        } else {
                                footerTable.addCell(new Cell().setBorder(Border.NO_BORDER));
                        }

                        // Authorized Signature Section (Right)
                        // This cell will contain the signature line and stamp
                        Cell signatureCell = new Cell().setBorder(Border.NO_BORDER);
                        signatureCell.setTextAlignment(TextAlignment.CENTER);
                        signatureCell.setVerticalAlignment(VerticalAlignment.BOTTOM);
                        signatureCell.setPaddingBottom(5); // Align with the bottom row of bank details

                        // Add Vision AI Stamp OR Custom Signature above signature line
                        if (isVisionAI) {
                                try (InputStream stampStream = getClass().getClassLoader()
                                                .getResourceAsStream("visionai-stamp.png")) {
                                        if (stampStream != null) {
                                                ImageData stampData = ImageDataFactory
                                                                .create(stampStream.readAllBytes());
                                                Image stamp = new Image(stampData);
                                                float stampSize = convertMmToPoints(25); // Increased size
                                                stamp.setWidth(stampSize);
                                                signatureCell.add(
                                                                stamp.setHorizontalAlignment(HorizontalAlignment.CENTER)
                                                                                .setMarginBottom(10));
                                        }
                                } catch (Exception e) {
                                        System.err.println("Could not load stamp for signature: " + e.getMessage());
                                }
                        } else if (invoice.getSignatureUrl() != null && !invoice.getSignatureUrl().isEmpty()) {
                                // For non-VisionAI, load custom signature if signatureUrl is present
                                try {
                                        String sigData = invoice.getSignatureUrl();
                                        if (sigData.startsWith("data:image")) {
                                                sigData = sigData.substring(sigData.indexOf(",") + 1);
                                        }
                                        byte[] decoded = Base64.getDecoder().decode(sigData);
                                        ImageData sigImageData = ImageDataFactory.create(decoded);
                                        Image signature = new Image(sigImageData);
                                        // Increased width for better visibility
                                        signature.setWidth(convertMmToPoints(40));
                                        signatureCell.add(signature.setHorizontalAlignment(HorizontalAlignment.CENTER)
                                                        .setMarginBottom(5));
                                } catch (Exception e) {
                                        System.err.println("Could not load custom signature: " + e.getMessage());
                                }
                        } else if (invoice.getCompanyInfo() != null
                                        && invoice.getCompanyInfo().getCompanyLogoUrl() != null
                                        && !invoice.getCompanyInfo().getCompanyLogoUrl().isEmpty()) {
                                // Fallback to company logo if no specific signature is provided
                                try {
                                        String logoUrl = invoice.getCompanyInfo().getCompanyLogoUrl();
                                        ImageData logoData = null;
                                        if (logoUrl.startsWith("data:image")) {
                                                String base64 = logoUrl.substring(logoUrl.indexOf(",") + 1);
                                                logoData = ImageDataFactory.create(Base64.getDecoder().decode(base64));
                                        } else {
                                                logoData = ImageDataFactory.create(logoUrl);
                                        }
                                        if (logoData != null) {
                                                Image logoAsSig = new Image(logoData);
                                                logoAsSig.setWidth(convertMmToPoints(30));
                                                signatureCell.add(logoAsSig
                                                                .setHorizontalAlignment(HorizontalAlignment.CENTER)
                                                                .setMarginBottom(5));
                                        }
                                } catch (Exception ignored) {
                                }
                        }

                        signatureCell.add(new Paragraph("__________________________")
                                        .setFont(boldFont)
                                        .setMarginTop(0));
                        signatureCell.add(new Paragraph("Authorised Signature")
                                        .setFont(boldFont)
                                        .setFontSize(10));

                        footerTable.addCell(signatureCell);

                        document.add(footerTable);

                        document.close();

                } catch (Exception e) {
                        throw new IOException("Failed to generate PDF", e);
                }

                return baos.toByteArray();
        }

        // Helper to avoid null values
        private String getValue(String value) {
                return value != null ? value : "";
        }

        // Helper for clean total rows
        private Cell createTotalCell(String text, PdfFont font, float fontSize) {
                return new Cell()
                                .add(new Paragraph(text)
                                                .setFont(font)
                                                .setFontSize(fontSize)
                                                .setMargin(0)) // Remove margins to prevent overlap
                                .setBorder(Border.NO_BORDER)
                                .setTextAlignment(TextAlignment.RIGHT)
                                .setPadding(8); // Increase padding for clearance
        }

        // Helper for dynamic currency formatting
        private String formatCurrency(double amount, String country, boolean includeSymbol) {
                String formatted;
                if ("japan".equalsIgnoreCase(country)) {
                        formatted = String.format(Locale.US, "%,.2f", amount);
                        return includeSymbol ? "¥ " + formatted : formatted;
                } else {
                        // Default to India/Rupee
                        formatted = String.format(Locale.US, "%,.2f", amount);
                        return includeSymbol ? "₹ " + formatted : formatted;
                }
        }

        private float convertMmToPoints(float mm) {
                return mm * 2.83465f;
        }

        private String formatDate(String dateStr) {
                try {
                        SimpleDateFormat in = new SimpleDateFormat("yyyy-MM-dd", Locale.ENGLISH);
                        SimpleDateFormat out = new SimpleDateFormat("dd/MM/yyyy", Locale.ENGLISH);
                        Date d = in.parse(dateStr);
                        return out.format(d);
                } catch (Exception e) {
                        return dateStr;
                }
        }
}
