import * as XLSX from 'xlsx';
import { Invoice, ServiceItem } from '../types';

/**
 * Parse Excel file and convert to Invoice array
 * Expected Excel format:
 * - First row: Headers
 * - Columns: Invoice Number, Date, Due Date, Employee Name, Employee ID, Employee Email, 
 *            Employee Address, Employee Mobile, Description, Hours, Rate, Tax Rate (optional)
 */
export const parseExcelToInvoices = async (file: File): Promise<Invoice[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                
                // Get the first sheet
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                
                // Convert to JSON
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
                    header: 1,
                    defval: '' 
                }) as any[][];
                
                if (jsonData.length < 2) {
                    reject(new Error('Excel file must have at least a header row and one data row'));
                    return;
                }
                
                // Get headers (first row)
                const headers = jsonData[0].map((h: any) => String(h).toLowerCase().trim());
                
                // Find column indices
                const getColumnIndex = (possibleNames: string[]): number => {
                    for (const name of possibleNames) {
                        const index = headers.findIndex(h => 
                            h.includes(name.toLowerCase()) || name.toLowerCase().includes(h)
                        );
                        if (index !== -1) return index;
                    }
                    return -1;
                };
                
                const invoiceNumberIdx = getColumnIndex(['invoice', 'invoice number', 'invoice#', 'inv no', 'inv number']);
                const dateIdx = getColumnIndex(['date', 'invoice date', 'issue date']);
                const dueDateIdx = getColumnIndex(['due date', 'due', 'payment due']);
                const employeeNameIdx = getColumnIndex(['employee name', 'name', 'employee', 'client name']);
                const employeeIdIdx = getColumnIndex(['employee id', 'employeeid', 'id', 'emp id', 'employee id']);
                const employeeEmailIdx = getColumnIndex(['email', 'e-mail', 'employee email', 'mail']);
                const employeeAddressIdx = getColumnIndex(['address', 'employee address', 'location']);
                const employeeMobileIdx = getColumnIndex(['mobile', 'phone', 'contact', 'employee mobile']);
                const descriptionIdx = getColumnIndex(['description', 'service', 'item', 'work description']);
                const hoursIdx = getColumnIndex(['hours', 'hour', 'hrs', 'hr', 'time', 'quantity', 'qty', 'hours worked', 'total hours']);
                const rateIdx = getColumnIndex(['rate', 'price', 'unit price', 'unit rate', 'cost', 'amount', 'hourly rate']);
                const taxRateIdx = getColumnIndex(['tax rate', 'tax', 'tax%', 'gst']);
                const cgstRateIdx = getColumnIndex(['cgst', 'cgst rate', 'cgst%']);
                const sgstRateIdx = getColumnIndex(['sgst', 'sgst rate', 'sgst%']);
                
                // Validate required columns (hours and rate are optional as they can be set later)
                if (invoiceNumberIdx === -1 || employeeNameIdx === -1 || descriptionIdx === -1) {
                    reject(new Error('Missing required columns. Required: Invoice Number, Employee Name, Description'));
                    return;
                }
                
                // Log found column indices for debugging
                console.log('Excel column indices:', {
                    invoiceNumber: invoiceNumberIdx,
                    employeeName: employeeNameIdx,
                    description: descriptionIdx,
                    hours: hoursIdx,
                    rate: rateIdx,
                    date: dateIdx,
                    employeeId: employeeIdIdx,
                    email: employeeEmailIdx,
                    address: employeeAddressIdx,
                    mobile: employeeMobileIdx
                });
                
                // Collect all valid rows for a SINGLE invoice
                const validRows: any[] = [];
                
                for (let i = 1; i < jsonData.length; i++) {
                    const row = jsonData[i];
                    // Skip completely empty rows
                    if (!row || row.length === 0 || row.every(cell => !cell || String(cell).trim() === '')) continue;
                    
                    // Check if row has at least description or hours
                    const desc = String(row[descriptionIdx] || '').trim();
                    const hours = parseFloat(String(row[hoursIdx] || '0'));
                    if (desc || hours > 0) {
                        validRows.push(row);
                    }
                }
                
                if (validRows.length === 0) {
                    reject(new Error('No valid data rows found in Excel file'));
                    return;
                }
                
                // Create a SINGLE invoice from all rows
                const invoices: Invoice[] = [];
                const firstRow = validRows[0];
                
                // Get invoice number from first row, or generate one
                let invoiceNumber = String(firstRow[invoiceNumberIdx] || '').trim();
                if (!invoiceNumber) {
                    const empName = String(firstRow[employeeNameIdx] || '').trim();
                    invoiceNumber = empName 
                        ? `INV-${empName.replace(/\s+/g, '-').substring(0, 10)}-${Date.now()}`
                        : `INV-${Date.now()}`;
                }
                    
                    // Parse date (handle various formats)
                    const parseDate = (dateValue: any): string => {
                        if (!dateValue) return new Date().toISOString().split('T')[0];
                        if (dateValue instanceof Date) {
                            return dateValue.toISOString().split('T')[0];
                        }
                        if (typeof dateValue === 'number') {
                            // Excel date serial number
                            const excelEpoch = new Date(1899, 11, 30);
                            const date = new Date(excelEpoch.getTime() + dateValue * 86400000);
                            return date.toISOString().split('T')[0];
                        }
                        const dateStr = String(dateValue);
                        // Try to parse common date formats
                        const parsed = new Date(dateStr);
                        if (!isNaN(parsed.getTime())) {
                            return parsed.toISOString().split('T')[0];
                        }
                        return new Date().toISOString().split('T')[0];
                    };
                    
                // Helper function to parse numeric values from Excel cells
                const parseNumericValue = (value: any, defaultValue: number = 0): number => {
                    if (value === null || value === undefined || value === '') {
                        return defaultValue;
                    }
                    // Handle Excel date serial numbers that might be confused with hours
                    if (typeof value === 'number') {
                        // If it's a very large number, it might be a date serial
                        if (value > 100000) {
                            return defaultValue;
                        }
                        return value;
                    }
                    // Convert to string and clean
                    const strValue = String(value).trim().replace(/,/g, '');
                    const parsed = parseFloat(strValue);
                    return isNaN(parsed) ? defaultValue : parsed;
                };
                
                // Build services array from ALL valid rows - create ONE invoice
                const services: ServiceItem[] = validRows
                    .filter((row, index) => {
                        // Filter out completely empty service rows
                        const desc = String(row[descriptionIdx] || '').trim();
                        const hours = hoursIdx !== -1 ? parseNumericValue(row[hoursIdx]) : 0;
                        return desc || hours > 0;
                    })
                    .map((row, index) => {
                        const hours = hoursIdx !== -1 ? parseNumericValue(row[hoursIdx], 0) : 0;
                        const rate = rateIdx !== -1 ? parseNumericValue(row[rateIdx], 0) : 0;
                        
                        console.log(`Row ${index + 1}:`, {
                            description: String(row[descriptionIdx] || '').trim(),
                            hours: hours,
                            rate: rate,
                            rawHours: row[hoursIdx],
                            rawRate: row[rateIdx]
                        });
                        
                        return {
                        id: `service-${invoiceNumber}-${index}`,
                        description: String(row[descriptionIdx] || '').trim() || 'Service',
                            hours: hours,
                            rate: rate,
                        };
                    });
                
                // If no services with valid data, create at least one service
                if (services.length === 0 && validRows.length > 0) {
                    const firstRow = validRows[0];
                    services.push({
                        id: `service-${invoiceNumber}-0`,
                        description: String(firstRow[descriptionIdx] || '').trim() || 'Service',
                        hours: hoursIdx !== -1 ? parseNumericValue(firstRow[hoursIdx], 0) : 0,
                        rate: rateIdx !== -1 ? parseNumericValue(firstRow[rateIdx], 0) : 0,
                    });
                }
                
                console.log(`Created ${services.length} service(s) for single invoice:`, services);
                
                // Get employee details - try to find the first row with employee info
                let employeeName = '';
                let employeeId = '';
                let employeeEmail = '';
                let employeeAddress = '';
                let employeeMobile = '';
                
                for (const row of validRows) {
                    const name = String(row[employeeNameIdx] || '').trim();
                    if (name) {
                        employeeName = name;
                        employeeId = employeeIdIdx !== -1 ? String(row[employeeIdIdx] || '').trim() : '';
                        employeeEmail = employeeEmailIdx !== -1 ? String(row[employeeEmailIdx] || '').trim() : '';
                        employeeAddress = employeeAddressIdx !== -1 ? String(row[employeeAddressIdx] || '').trim() : '';
                        employeeMobile = employeeMobileIdx !== -1 ? String(row[employeeMobileIdx] || '').trim() : '';
                        break; // Use first row with employee name
                    }
                }
                
                // If still no employee name, try first row
                if (!employeeName && firstRow) {
                    employeeName = String(firstRow[employeeNameIdx] || '').trim();
                    employeeId = employeeIdIdx !== -1 ? String(firstRow[employeeIdIdx] || '').trim() : '';
                    employeeEmail = employeeEmailIdx !== -1 ? String(firstRow[employeeEmailIdx] || '').trim() : '';
                    employeeAddress = employeeAddressIdx !== -1 ? String(firstRow[employeeAddressIdx] || '').trim() : '';
                    employeeMobile = employeeMobileIdx !== -1 ? String(firstRow[employeeMobileIdx] || '').trim() : '';
                }
                    
                    const invoice: Invoice = {
                        id: `excel-${invoiceNumber}-${Date.now()}`,
                        invoiceNumber: invoiceNumber,
                        date: parseDate(firstRow[dateIdx]),
                        dueDate: dueDateIdx !== -1 ? parseDate(firstRow[dueDateIdx]) : '',
                        company: 'Ory Folks Pvt Ltd',
                    employeeName: employeeName || 'N/A',
                    employeeId: employeeId,
                    employeeEmail: employeeEmail,
                    employeeAddress: employeeAddress,
                    employeeMobile: employeeMobile,
                        services: services,
                        taxRate: taxRateIdx !== -1 ? parseFloat(String(firstRow[taxRateIdx] || '0')) || undefined : undefined,
                        cgstRate: cgstRateIdx !== -1 ? parseFloat(String(firstRow[cgstRateIdx] || '0')) || undefined : undefined,
                        sgstRate: sgstRateIdx !== -1 ? parseFloat(String(firstRow[sgstRateIdx] || '0')) || undefined : undefined,
                    };
                    
                // Set country from preference if not in invoice
                const country = invoice.country || getCountryPreference();
                invoice.country = country;
                
                // Calculate and log totals for verification using country-based calculation
                const subTotal = services.reduce((sum, s) => sum + (s.hours * s.rate), 0);
                const taxRate = invoice.taxRate || 0;
                const taxCalculation = calculateTax(subTotal, taxRate, country);
                
                console.log('Single Invoice Created:', {
                    invoiceNumber: invoice.invoiceNumber,
                    employeeName: invoice.employeeName,
                    country: country,
                    servicesCount: services.length,
                    totalHours: services.reduce((sum, s) => sum + s.hours, 0),
                    subTotal: subTotal.toFixed(2),
                    taxCalculation: {
                        cgstAmount: taxCalculation.cgstAmount?.toFixed(2) || '0.00',
                        sgstAmount: taxCalculation.sgstAmount?.toFixed(2) || '0.00',
                        consumptionTaxAmount: taxCalculation.consumptionTaxAmount?.toFixed(2) || '0.00',
                        grandTotal: taxCalculation.grandTotal.toFixed(2)
                    },
                    services: services.map(s => ({
                        description: s.description,
                        hours: s.hours,
                        rate: s.rate,
                        amount: (s.hours * s.rate).toFixed(2)
                    }))
                });
                
                invoices.push(invoice);
                
                if (invoices.length === 0) {
                    reject(new Error('No valid invoices found in Excel file'));
                    return;
                }
                
                resolve(invoices);
            } catch (error) {
                reject(new Error(`Error parsing Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`));
            }
        };
        
        reader.onerror = () => {
            reject(new Error('Error reading Excel file'));
        };
        
        reader.readAsArrayBuffer(file);
    });
};

/**
 * Generate sample Excel template
 */
export const generateExcelTemplate = (): void => {
    const templateData = [
        ['Invoice Number', 'Date', 'Due Date', 'Employee Name', 'Employee ID', 'Employee Email', 
         'Employee Address', 'Employee Mobile', 'Description', 'Hours', 'Rate', 'Tax Rate', 'CGST Rate', 'SGST Rate'],
        ['OF-INV-01', '2024-01-15', '2024-01-30', 'John Doe', 'EMP001', 'john@example.com', 
         '123 Main St, City', '1234567890', 'Web Development', '40', '50', '10', '5', '5'],
        ['OF-INV-01', '2024-01-15', '2024-01-30', 'John Doe', 'EMP001', 'john@example.com', 
         '123 Main St, City', '1234567890', 'UI Design', '20', '60', '10', '5', '5'],
        ['OF-INV-02', '2024-01-16', '2024-01-31', 'Jane Smith', 'EMP002', 'jane@example.com', 
         '456 Oak Ave, Town', '0987654321', 'Consulting', '30', '75', '10', '5', '5'],
    ];
    
    const ws = XLSX.utils.aoa_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Invoices');
    
    XLSX.writeFile(wb, 'invoice_template.xlsx');
};

