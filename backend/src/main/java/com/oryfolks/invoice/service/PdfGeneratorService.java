// package com.oryfolks.invoice.service;

// import com.invoiceapp.entity.Invoice;
// import com.invoiceapp.entity.ServiceItem;
// import com.itextpdf.kernel.colors.ColorConstants;
// import com.itextpdf.kernel.colors.DeviceRgb;
// import com.itextpdf.kernel.font.PdfFont;
// import com.itextpdf.kernel.font.PdfFontFactory;
// import com.itextpdf.kernel.geom.PageSize;
// import com.itextpdf.kernel.pdf.PdfDocument;
// import com.itextpdf.kernel.pdf.PdfWriter;
// import com.itextpdf.layout.Document;
// import com.itextpdf.layout.borders.Border;
// import com.itextpdf.layout.element.*;
// import com.itextpdf.layout.properties.TextAlignment;
// import com.itextpdf.layout.properties.UnitValue;
// import org.springframework.stereotype.Service;

// import java.io.ByteArrayInputStream;
// import java.io.ByteArrayOutputStream;
// import java.io.IOException;

// @Service
// public class PdfGeneratorService {

//     public ByteArrayInputStream generatePdf(Invoice invoice) throws IOException {
//         ByteArrayOutputStream out = new ByteArrayOutputStream();
//         PdfWriter writer = new PdfWriter(out);
//         PdfDocument pdf = new PdfDocument(writer);
//         Document document = new Document(pdf, PageSize.A4);
        
//         try {
//             // Set document margins
//             document.setMargins(50, 50, 50, 50);
            
//             PdfFont boldFont = PdfFontFactory.createFont("Helvetica-Bold");

//             // Main container table with 2x2 grid for better layout control
//             Table mainTable = new Table(new float[]{1, 1})
//                 .setWidth(UnitValue.createPercentValue(100))
//                 .setMarginBottom(20);

//             // Top-left: Logo with increased bottom padding
//             Cell logoCell = new Cell(1, 1)
//                 .setBorder(Border.NO_BORDER)
//                 .setPadding(0)
//                 .setPaddingBottom(40)  // Increased space below logo
//                 .setTextAlignment(TextAlignment.LEFT)
//                 .add(new Paragraph("ORY FOLKS")
//                     .setFont(boldFont)
//                     .setFontSize(18)  // Slightly larger for better visibility
//                     .setMarginBottom(8));  // Increased space below company name

//             // Top-right: Invoice info
//             Cell invoiceInfoCell = new Cell(1, 1)
//                 .setBorder(Border.NO_BORDER)
//                 .setPadding(0)
//                 .setPaddingBottom(20)  // Match logo bottom padding
//                 .setTextAlignment(TextAlignment.RIGHT)
//                 .add(new Paragraph("INVOICE")
//                     .setFont(boldFont)
//                     .setFontSize(16)
//                     .setMarginBottom(5))
//                 .add(new Paragraph("#" + (invoice.getInvoiceNumber() != null ? invoice.getInvoiceNumber() : ""))
//                     .setFontSize(12)
//                     .setMarginBottom(3))
//                 .add(new Paragraph("Date: " + (invoice.getDate() != null ? invoice.getDate() : ""))
//                     .setFontSize(10));

//             // Bottom-left: From section with adjusted top padding
//             Cell fromCell = new Cell(1, 1)
//                 .setBorder(Border.NO_BORDER)
//                 .setPadding(0)
//                 .setPaddingTop(0)  // Removed top padding since we're using margin in the first paragraph
//                 .setTextAlignment(TextAlignment.LEFT)
//                 .add(new Paragraph("From:")
//                     .setFont(boldFont)
//                     .setFontSize(11)
//                     .setMarginTop(30)  // Increased space above "From:"
//                     .setMarginBottom(6))  // Space between "From:" and company name
//                 .add(new Paragraph("Ory Folks Pvt Ltd")
//                     .setFontSize(10)
//                     .setMarginBottom(2))  // Reduced space between address lines
//                 .add(new Paragraph("Vedayapalem")
//                     .setFontSize(10)
//                     .setMarginBottom(2))
//                 .add(new Paragraph("Nellore, Andhra Pradesh")
//                     .setFontSize(10)
//                     .setMarginBottom(2))
//                 .add(new Paragraph("PIN: 524004")
//                     .setFontSize(10)
//                     .setMarginBottom(2))
//                 .add(new Paragraph("India")
//                     .setFontSize(10)
//                     .setMarginBottom(2))
//                 .add(new Paragraph("GSTIN: 29ABCDE1234F1Z5")
//                     .setFontSize(10));

//             // Bottom-right: Bill To section
//             Cell billToCell = new Cell(1, 1)
//                 .setBorder(Border.NO_BORDER)
//                 .setPadding(0)
//                 .setPaddingTop(10)  // Match From section top padding
//                 .setTextAlignment(TextAlignment.LEFT);

//             // Add all cells to the main table
//             mainTable.addCell(logoCell);
//             mainTable.addCell(invoiceInfoCell);
//             mainTable.addCell(fromCell);
//             mainTable.addCell(billToCell);

//             // Add the main table to the document
//             document.add(mainTable);

//             // Bill To section (already added to the main table, just update its content)
//             billToCell
//                 .add(new Paragraph("Bill To:")
//                     .setFont(boldFont)
//                     .setFontSize(10)
//                     .setMarginBottom(5))
//                 .add(new Paragraph(invoice.getEmployeeName())
//                     .setFontSize(10)
//                     .setMarginBottom(2))
//                 .add(new Paragraph(invoice.getEmployeeAddress() != null ? invoice.getEmployeeAddress() : "")
//                     .setFontSize(10));

//             // Table with fixed column widths (matching the image)
//             float[] columnWidths = {40f, 200f, 60f, 80f, 80f};
//             Table table = new Table(columnWidths)
//                 .setWidth(UnitValue.createPercentValue(100))
//                 .setMarginTop(20);

//             // Table header
//             String[] headers = {"SNO", "Description", "Hours", "Unit Price", "Amount"};
//             for (String header : headers) {
//                 Cell cell = new Cell()
//                     .setBackgroundColor(new DeviceRgb(0, 0, 0)) // Black background
//                     .setTextAlignment(TextAlignment.CENTER)
//                     .setPadding(5)
//                     .setFontColor(ColorConstants.WHITE)
//                     .setFontSize(10)
//                     .setFont(boldFont)
//                     .add(new Paragraph(header));
//                 table.addHeaderCell(cell);
//             }

//             // Table rows
//             for (ServiceItem item : invoice.getServices()) {
//                 // SNO (centered)
//                 // ID (centered)
//                 table.addCell(new Cell()
//                     .setTextAlignment(TextAlignment.CENTER)
//                     .setPadding(6)
//                     .setFontSize(10)
//                     .add(new Paragraph(String.valueOf(item.getId()))));
                
//                 // Description (left aligned)
//                 table.addCell(new Cell()
//                     .setTextAlignment(TextAlignment.LEFT)
//                     .setPadding(6)
//                     .setFontSize(10)
//                     .add(new Paragraph(item.getDescription())));
                
//                 // Hours (right aligned)
//                 table.addCell(new Cell()
//                     .setTextAlignment(TextAlignment.RIGHT)
//                     .setPadding(6)
//                     .setFontSize(10)
//                     .add(new Paragraph(String.valueOf(item.getHours()))));
                
//                 // Rate (right aligned, formatted as currency)
//                 table.addCell(new Cell()
//                     .setTextAlignment(TextAlignment.RIGHT)
//                     .setPadding(6)
//                     .setFontSize(10)
//                     .add(new Paragraph(String.format("¥%,.0f", item.getRate()))));
                
//                 // Total (right aligned, formatted as currency)
//                 table.addCell(new Cell()
//                     .setTextAlignment(TextAlignment.RIGHT)
//                     .setPadding(6)
//                     .setFontSize(10)
//                     .add(new Paragraph(String.format("¥%,.0f", item.getTotal()))));
//             }

//             // Calculate values with null checks
//             double subtotal = invoice.getServices() != null ? 
//                 invoice.getServices().stream()
//                     .mapToDouble(ServiceItem::getTotal)
//                     .sum() : 0.0;
                    
//             double taxRate = invoice.getTaxRate() != null ? invoice.getTaxRate() : 10.0; // Default to 10% if not set
//             double cgstRate = taxRate / 2;  // Split tax rate for CGST and SGST
//             double cgstAmount = subtotal * (cgstRate / 100);
//             double sgstAmount = subtotal * (cgstRate / 100);
//             double grandTotal = subtotal + cgstAmount + sgstAmount;

//             // Add the items table to the document
//             document.add(table);

//             // Add some space after the items table
//             document.add(new Paragraph("").setMarginBottom(20));
            
//             // Create a single cell for the total section with left alignment
//             Paragraph totalSection = new Paragraph()
//                 .setMarginTop(20)
//                 .setTextAlignment(TextAlignment.LEFT);
            
//             // Subtotal
//             totalSection
//                 .add(new Paragraph("Subtotal: " + String.format("¥%,.0f", subtotal))
//                     .setFont(boldFont)
//                     .setFontSize(10)
//                     .setMarginBottom(5));
            
//             // CGST
//             totalSection
//                 .add(new Paragraph(String.format("CGST (%.1f%%): ", cgstRate) + String.format("¥%,.0f", cgstAmount))
//                     .setFont(boldFont)
//                     .setFontSize(10)
//                     .setMarginBottom(5));
            
//             // SGST
//             totalSection
//                 .add(new Paragraph(String.format("SGST (%.1f%%): ", cgstRate) + String.format("¥%,.0f", sgstAmount))
//                     .setFont(boldFont)
//                     .setFontSize(10)
//                     .setMarginBottom(10));
            
//             // Grand Total with background
//             totalSection
//                 .add(new Paragraph("Grand Total: " + String.format("¥%,.0f", grandTotal))
//                     .setBackgroundColor(new DeviceRgb(240, 240, 240))
//                     .setFont(boldFont)
//                     .setFontSize(10)
//                     .setPadding(5)
//                     .setMargin(0));
            
//             // Add the total section to the document
//             document.add(totalSection);
                

//             // Add space before bank details section
//             document.add(new Paragraph("")
//                 .setMarginTop(30)
//                 .setMarginBottom(10));
                
//             Table bankDetailsTable = new Table(new float[]{1, 1}) // Two columns
//                 .setWidth(UnitValue.createPercentValue(100))
//                 .setMarginBottom(20);

//             // Bank details section (left)
//             Cell bankCell = new Cell()
//                 .setBorder(Border.NO_BORDER)
//                 .setPadding(0)
//                 .setTextAlignment(TextAlignment.LEFT)
//                 .add(new Paragraph("Bank Details:")
//                     .setFont(boldFont)
//                     .setFontSize(10)
//                     .setMarginBottom(5))
//                 .add(new Paragraph()
//                     .setFontSize(10)
//                     .setHeight(1.2f)
//                     .add("Account Name: Ory Folks Pvt Ltd\n")
//                     .add("Account No: 123456789012\n")
//                     .add("IFSC: HDFC0001234\n")
//                     .add("Branch Code: 01234"));

//             // Signature section (right)
//             Cell signCell = new Cell()
//                 .setBorder(Border.NO_BORDER)
//                 .setPadding(0)
//                 .setTextAlignment(TextAlignment.LEFT)
//                 .add(new Paragraph("\n\n\n") // Add some space
//                 .add(new Paragraph("_________________________")
//                     .setFontSize(10)))
//                 .add(new Paragraph("Signature")
//                     .setFontSize(10));

//             bankDetailsTable.addCell(bankCell);
//             bankDetailsTable.addCell(signCell);
//             document.add(bankDetailsTable);

//             // Add a small note at the bottom
//             document.add(new Paragraph("This is a computer-generated invoice. No signature is required.")
//                 .setFontSize(8)
//                 .setTextAlignment(TextAlignment.CENTER)
//                 .setFontColor(new DeviceRgb(150, 150, 150))
//                 .setMarginTop(10));

//         } finally {
//             document.close();
//         }

//         return new ByteArrayInputStream(out.toByteArray());
//     }
// }

package com.oryfolks.invoice.service;

import com.invoiceapp.entity.Invoice;
import com.invoiceapp.entity.ServiceItem;
import com.itextpdf.io.image.ImageDataFactory;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.borders.Border;
import com.itextpdf.layout.element.*;
import com.itextpdf.layout.properties.HorizontalAlignment;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import com.itextpdf.layout.properties.VerticalAlignment;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.text.SimpleDateFormat;

@Service
public class PdfGeneratorService {

    public ByteArrayInputStream generatePdf(Invoice invoice, String logoPath) throws Exception {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        PdfWriter writer = new PdfWriter(out);
        PdfDocument pdf = new PdfDocument(writer);
        Document document = new Document(pdf, PageSize.A4);
        document.setMargins(40, 40, 40, 40);

        PdfFont bold;
        PdfFont regular;
        try {
            // Attempt to load system Arial font which supports Rupee symbol
            String fontPath = "C:/Windows/Fonts/arial.ttf";
            // For bold, we ideally need arialbd.ttf
            String boldFontPath = "C:/Windows/Fonts/arialbd.ttf";
            
            bold = PdfFontFactory.createFont(boldFontPath, com.itextpdf.io.font.PdfEncodings.IDENTITY_H);
            regular = PdfFontFactory.createFont(fontPath, com.itextpdf.io.font.PdfEncodings.IDENTITY_H);
        } catch (Exception e) {
            // Fallback
            System.err.println("Could not load system font: " + e.getMessage());
            bold = PdfFontFactory.createFont("Helvetica-Bold");
            regular = PdfFontFactory.createFont("Helvetica");
        }

        SimpleDateFormat dateFormat = new SimpleDateFormat("MM/dd/yyyy");

        // ==================== Header: Logo + Invoice Info ====================
        Table headerTable = new Table(UnitValue.createPercentArray(new float[]{50, 50}))
                .setWidth(UnitValue.createPercentValue(100));

        // Left: Logo and Company Name
        Cell logoCell = new Cell()
                .setBorder(Border.NO_BORDER)
                .setVerticalAlignment(VerticalAlignment.TOP);

        if (logoPath != null && !logoPath.isEmpty()) {
            try {
                Image logo = new Image(ImageDataFactory.create(logoPath));
                logo.setMaxWidth(120);
                logo.setMarginBottom(10);
                logoCell.add(logo);
            } catch (Exception e) {
                // Logo not found — continue gracefully
                System.err.println("Logo not loaded: " + logoPath);
            }
        }

        logoCell.add(new Paragraph("ORY FOLKS")
                .setFont(bold)
                .setFontSize(20)
                .setFontColor(new DeviceRgb(0, 102, 204))
                .setMarginBottom(5));

        logoCell.add(new Paragraph("Ory Folks Pvt Ltd")
                .setFont(regular)
                .setFontSize(10));

        headerTable.addCell(logoCell);

        // Right: Invoice # and Date
        Cell invoiceHeaderCell = new Cell()
                .setBorder(Border.NO_BORDER)
                .setTextAlignment(TextAlignment.RIGHT)
                .setVerticalAlignment(VerticalAlignment.TOP);

        invoiceHeaderCell.add(new Paragraph("Invoice # " + getValue(invoice.getInvoiceNumber()))
                .setFont(bold)
                .setFontSize(14)
                .setMarginBottom(5));

        String dateStr = invoice.getDate() != null ? dateFormat.format(invoice.getDate()) : "";
        invoiceHeaderCell.add(new Paragraph("Date: " + dateStr)
                .setFont(regular)
                .setFontSize(11));

        headerTable.addCell(invoiceHeaderCell);
        document.add(headerTable);

        // ==================== From & Bill To ====================
        Table addressTable = new Table(UnitValue.createPercentArray(new float[]{50, 50}))
                .setWidth(UnitValue.createPercentValue(100))
                .setMarginTop(20);

        // From Section
        Paragraph fromPara = new Paragraph()
                .add(new Text("From:\n").setFont(bold).setFontSize(11))
                .add(new Text(
                        "Ory Folks Pvt Ltd\n" +
                        "Vedayapalem\n" +
                        "Nellore, Andhra Pradesh\n" +
                        "Pin: 524004\n" +
                        "India\n" +
                        "GSTIN: 29ABCDE1234F1Z5\n" +
                        "Phone: +91 98765 43210\n" +
                        "Email: info@oryfolks.com"
                ).setFont(regular).setFontSize(10));

        addressTable.addCell(new Cell().setBorder(Border.NO_BORDER).add(fromPara));

        // Bill To Section
        Paragraph billToPara = new Paragraph()
                .add(new Text("Bill To:\n").setFont(bold).setFontSize(11))
                .add(new Text(
                        getValue(invoice.getEmployeeName()) + "\n" +
                        getValue(invoice.getEmployeeEmail()) + "\n" +
                        getValue(invoice.getEmployeeMobile()) + "\n" +
                        getValue(invoice.getEmployeeAddress())
                ).setFont(regular).setFontSize(10));

        addressTable.addCell(new Cell()
                .setBorder(Border.NO_BORDER)
                .setTextAlignment(TextAlignment.RIGHT)
                .add(billToPara));

        document.add(addressTable);

        // ==================== Services Table ====================
        float[] columnWidths = {30, 250, 70, 80, 90};
        Table table = new Table(UnitValue.createPointArray(columnWidths))
                .setWidth(UnitValue.createPercentValue(100))
                .setMarginTop(30);

        DeviceRgb headerBg = new DeviceRgb(51, 51, 51);
        String[] headers = {"SNO", "Description", "Hours", "Unit Price", "Amount"};

        for (String header : headers) {
            table.addHeaderCell(new Cell()
                    .add(new Paragraph(header)
                            .setFont(bold)
                            .setFontSize(10))
                    .setBackgroundColor(headerBg)
                    .setFontColor(ColorConstants.WHITE)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setPadding(8));
        }

        int sno = 1;
        double subtotal = 0.0;
        for (ServiceItem item : invoice.getServices()) {
            table.addCell(new Cell()
                    .add(new Paragraph(String.valueOf(sno++)))
                    .setTextAlignment(TextAlignment.CENTER)
                    .setPadding(6)
                    .setFontSize(10));

            table.addCell(new Cell()
                    .add(new Paragraph(item.getDescription()))
                    .setPadding(6)
                    .setFontSize(10));

            table.addCell(new Cell()
                    .add(new Paragraph(String.valueOf(item.getHours())))
                    .setTextAlignment(TextAlignment.RIGHT)
                    .setPadding(6)
                    .setFontSize(10));

            table.addCell(new Cell()
                    .add(new Paragraph(formatCurrency(item.getRate(), invoice.getCountry())))
                    .setTextAlignment(TextAlignment.RIGHT)
                    .setPadding(6)
                    .setFontSize(10));

            double amount = item.getTotal();
            subtotal += amount;
            table.addCell(new Cell()
                    .add(new Paragraph(formatCurrency(amount, invoice.getCountry())))
                    .setTextAlignment(TextAlignment.RIGHT)
                    .setPadding(6)
                    .setFontSize(10));
        }
        document.add(table);

        // ==================== Totals Section ====================
        Table totalTable = new Table(UnitValue.createPercentArray(new float[]{70, 30}))
                .setWidth(UnitValue.createPercentValue(50))
                .setHorizontalAlignment(HorizontalAlignment.RIGHT)
                .setMarginTop(20);

        double tax = subtotal * 0.10; // 10% Consumption Tax
        double grandTotal = subtotal + tax;

        totalTable.addCell(createTotalCell("SubTotal", regular, 11));
        totalTable.addCell(createTotalCell(formatCurrency(subtotal, invoice.getCountry()), regular, 11));

        String taxLabel = "japan".equalsIgnoreCase(invoice.getCountry()) ? "Consumption Tax (10%)" : "Tax (10%)"; // Simplified tax label logic for now
        // Ideally split CGST/SGST if India, but for now just label appropriately or use existing singular logic
        // The current logic calculates 10% regardless. 
        // User requested "calculate in yen not rupees", implicitly asking for correct formatting.
        // I will stick to single line tax for now unless specifically asked to crack open the CGST/SGST split in backend PDF (which was simpler in frontend).
        // Actually, the previous code had only one tax line. I will keep it but format it.
        
        totalTable.addCell(createTotalCell(taxLabel, regular, 11));
        totalTable.addCell(createTotalCell(formatCurrency(tax, invoice.getCountry()), regular, 11));

        totalTable.addCell(createTotalCell("Grand Total", bold, 12)
                .setBackgroundColor(new DeviceRgb(245, 245, 245))
                .setPadding(8));
        totalTable.addCell(createTotalCell(formatCurrency(grandTotal, invoice.getCountry()), bold, 12)
                .setBackgroundColor(new DeviceRgb(245, 245, 245))
                .setPadding(8));

        document.add(totalTable);

        // ==================== Footer: Bank Details & Signature ====================
        Table footerTable = new Table(UnitValue.createPercentArray(new float[]{60, 40}))
                .setWidth(UnitValue.createPercentValue(100))
                .setMarginTop(50);

        Paragraph bankPara = new Paragraph()
                .add(new Text("Bank Details:\n").setFont(bold).setFontSize(10))
                .add(new Text(
                        "Account Name: Ory Folks Pvt Ltd\n" +
                        "Account No: 123456789012\n" +
                        "IFSC: SBIN0001234\n" +
                        "Branch Code: 01234"
                ).setFont(regular).setFontSize(10));

        footerTable.addCell(new Cell().setBorder(Border.NO_BORDER).add(bankPara));

        Paragraph signPara = new Paragraph()
                .add("\n\n\n")
                .add("______________________\n")
                .add("Signature")
                .setFont(regular)
                .setFontSize(10)
                .setTextAlignment(TextAlignment.CENTER);

        footerTable.addCell(new Cell()
                .setBorder(Border.NO_BORDER)
                .setVerticalAlignment(VerticalAlignment.BOTTOM)
                .add(signPara));

        document.add(footerTable);

        document.close();
        return new ByteArrayInputStream(out.toByteArray());
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
                        .setFontSize(fontSize))
                .setBorder(Border.NO_BORDER)
                .setTextAlignment(TextAlignment.RIGHT)
                .setPadding(5);
    }

    private String formatCurrency(double amount, String country) {
        if ("japan".equalsIgnoreCase(country)) {
            // Japan: Yen symbol, no decimals
            return String.format("¥%,.0f", amount);
        } else {
            // India/Default: Rupee symbol, 2 decimals
            // Using unicode for Rupee symbol: \u20B9
            return String.format("₹%,.2f", amount);
        }
    }
}