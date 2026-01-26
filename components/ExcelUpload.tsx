import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { parseExcelToInvoices, generateExcelTemplate } from '../services/excelService';
import { Invoice } from '../types';

interface ExcelUploadProps {
    onInvoicesParsed: (invoices: Invoice[]) => void;
    onError: (error: string) => void;
}

export const ExcelUpload: React.FC<ExcelUploadProps> = ({ onInvoicesParsed, onError }) => {
    const { t } = useTranslation();
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file type
            const validExtensions = ['.xlsx', '.xls', '.csv'];
            const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
            
            if (!validExtensions.includes(fileExtension)) {
                onError('Please select a valid Excel file (.xlsx, .xls, or .csv)');
                return;
            }
            
            setSelectedFile(file);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            onError('Please select a file first');
            return;
        }

        setIsProcessing(true);
        try {
            const invoices = await parseExcelToInvoices(selectedFile);
            onInvoicesParsed(invoices);
            setSelectedFile(null);
            // Reset file input
            const fileInput = document.getElementById('excel-file-input') as HTMLInputElement;
            if (fileInput) fileInput.value = '';
        } catch (error) {
            onError(error instanceof Error ? error.message : 'Failed to parse Excel file');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownloadTemplate = () => {
        try {
            generateExcelTemplate();
        } catch (error) {
            onError('Failed to generate template file');
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Upload Excel File</h2>
                <button
                    onClick={handleDownloadTemplate}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                    Download Template
                </button>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
                Upload an Excel file to generate invoices. The file should contain invoice data with columns for Invoice Number, Employee Name, Description, Hours, Rate, etc.
            </p>

            <div className="space-y-4">
                <div>
                    <label htmlFor="excel-file-input" className="block text-sm font-medium text-gray-700 mb-2">
                        Select Excel File
                    </label>
                    <input
                        id="excel-file-input"
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleFileSelect}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        disabled={isProcessing}
                    />
                    {selectedFile && (
                        <p className="mt-2 text-sm text-gray-600">
                            Selected: <span className="font-medium">{selectedFile.name}</span>
                        </p>
                    )}
                </div>

                <button
                    onClick={handleUpload}
                    disabled={!selectedFile || isProcessing}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                    {isProcessing ? (
                        <>
                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing...
                        </>
                    ) : (
                        'Process Excel File'
                    )}
                </button>
            </div>

            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-800 font-medium mb-1">Expected Excel Format:</p>
                <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
                    <li>First row: Column headers</li>
                    <li>Required columns: Invoice Number, Employee Name, Description, Hours, Rate</li>
                    <li>Optional columns: Date, Due Date, Employee ID, Email, Address, Mobile, Tax Rate, CGST Rate, SGST Rate</li>
                    <li>Multiple rows with same Invoice Number will be grouped as one invoice with multiple services</li>
                </ul>
            </div>
        </div>
    );
};

