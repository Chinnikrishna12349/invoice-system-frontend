import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getNextInvoiceNumber } from '../services/apiService';
import { Invoice, ServiceItem, BankDetails } from '../types';
import { useCountry } from '../contexts/CountryContext';
import { calculateTax, getCurrencySymbol, formatCurrency } from '../services/countryPreferenceService';
import { useAuth } from '../contexts/AuthContext';
import { FROM_COMPANIES, TO_COMPANIES, DummyCompany, DummyClient } from '../src/data/dummyCompanies';
import { BankDetailsForm } from './BankDetailsForm';

interface InvoiceFormProps {
    onSave: (invoice: Invoice) => void;
    selectedInvoice?: Invoice | null;
    clearSelection: () => void;
    invoices: Invoice[];
}
export const InvoiceForm: React.FC<InvoiceFormProps> = ({
    onSave,
    selectedInvoice,
    clearSelection,
    invoices
}) => {
    const { t } = useTranslation();
    const { country, setCountry } = useCountry();
    const { user } = useAuth();

    // Dropdown States
    const [selectedFromId, setSelectedFromId] = useState<string>('');
    const [selectedToId, setSelectedToId] = useState<string>('');
    const [isOtherFrom, setIsOtherFrom] = useState(false);
    const [isOtherTo, setIsOtherTo] = useState(false);

    // Bank Details State (Editable, defaults to From Company's bank)
    const [bankDetails, setBankDetails] = useState<BankDetails>({
        bankName: '',
        accountNumber: '',
        accountHolderName: '',
        ifscCode: '',
        branchName: '',
        accountType: ''
    });

    const [formData, setFormData] = useState<Partial<Invoice>>({
        invoiceNumber: '',
        date: new Date().toISOString().split('T')[0],
        dueDate: '',
        company: '', // Will be populated from dropdown
        employeeName: '', // Will be populated from To Dropdown
        employeeEmail: '',
        employeeAddress: '',
        employeeMobile: '',
        services: [],
        taxRate: 10,
        cgstRate: 10,
        sgstRate: 10,
        country: country,
        showConsumptionTax: false
    });

    const [showTaxToggle, setShowTaxToggle] = useState(false);

    const [errors, setErrors] = useState<Record<string, string>>({});

    // Initialize/Reset Logic
    useEffect(() => {
        if (!selectedInvoice) {
            // Default to first companies if available
            if (FROM_COMPANIES.length > 0 && !selectedFromId) {
                handleFromCompanyChange(FROM_COMPANIES[0].id);
            }
        } else {
            // Load from selected invoice
            setFormData({ ...selectedInvoice });
            if (selectedInvoice.companyInfo?.bankDetails) {
                setBankDetails(selectedInvoice.companyInfo.bankDetails);
            }
            // Logic to reverse-match dropdowns could go here, but omitted for simplicity
        }
    }, [selectedInvoice]);

    // Generate invoice number
    useEffect(() => {
        const fetchNextNumber = () => {
            if (!selectedInvoice) {
                const prefix = formData.companyInfo?.invoiceFormat || 'INV-';

                // Find all invoices with this prefix
                const relevantInvoices = invoices.filter(inv =>
                    inv.invoiceNumber && inv.invoiceNumber.startsWith(prefix)
                );

                let nextNum = 1;
                if (relevantInvoices.length > 0) {
                    // Extract numbers and find the max
                    const numbers = relevantInvoices.map(inv => {
                        const match = inv.invoiceNumber.match(/\d+$/);
                        return match ? parseInt(match[0], 10) : 0;
                    });
                    nextNum = Math.max(...numbers) + 1;
                }

                const finalNum = `${prefix}${nextNum}`;
                setFormData(prev => ({ ...prev, invoiceNumber: finalNum }));
            }
        };
        fetchNextNumber();
    }, [selectedInvoice, invoices, formData.companyInfo?.invoiceFormat]);

    // Handle "From" Company Change
    const handleFromCompanyChange = (companyId: string) => {
        if (companyId === 'other') {
            setIsOtherFrom(true);
            setSelectedFromId('other');
            setFormData(prev => ({
                ...prev,
                company: '',
                companyInfo: {
                    ...prev.companyInfo,
                    companyName: '',
                    companyAddress: '',
                    companyLogoUrl: '',
                    invoiceFormat: 'INV-',
                    bankDetails: {
                        bankName: '',
                        accountNumber: '',
                        accountHolderName: '',
                        ifscCode: '',
                        branchName: '',
                        accountType: ''
                    }
                }
            }));
            return;
        }

        setIsOtherFrom(false);
        setSelectedFromId(companyId);
        const company = FROM_COMPANIES.find(c => c.id === companyId);
        if (company) {
            // Update currency/country context based on company
            if (company.currency === 'JPY') setCountry('japan');
            else setCountry('india'); // Default to India for INR/USD for now

            // Update Bank Details
            setBankDetails({ ...company.bankDetails });

            // Update formData immediately for reactivity (Logo, Address, Company Name)
            setFormData(prev => {
                // Determine new invoice number with company-specific prefix
                let newInvoiceNumber = prev.invoiceNumber;
                if (company.invoiceFormat) {
                    // Extract existing number (matches any digits at the end)
                    const match = prev.invoiceNumber.match(/\d+$/);
                    const currentNum = match ? match[0] : '0001';
                    newInvoiceNumber = `${company.invoiceFormat}${currentNum}`;
                }

                return {
                    ...prev,
                    invoiceNumber: newInvoiceNumber,
                    company: company.companyName,
                    country: company.currency === 'JPY' ? 'japan' : 'india',
                    companyInfo: {
                        id: company.id,
                        companyName: company.companyName,
                        companyAddress: company.companyAddress,
                        companyLogoUrl: company.companyLogoUrl,
                        invoiceFormat: company.invoiceFormat,
                        bankDetails: company.bankDetails
                    }
                };
            });
        }
    };

    // Handle "To" Client Change
    const handleToClientChange = (clientId: string) => {
        if (clientId === 'other') {
            setIsOtherTo(true);
            setSelectedToId('other');
            setFormData(prev => ({
                ...prev,
                employeeName: '',
                employeeEmail: '',
                employeeAddress: '',
                employeeMobile: '',
            }));
            return;
        }

        setIsOtherTo(false);
        setSelectedToId(clientId);
        const client = TO_COMPANIES.find(c => c.id === clientId);
        if (client) {
            setFormData(prev => ({
                ...prev,
                employeeName: client.companyName,
                employeeEmail: client.email,
                employeeAddress: client.address,
                employeeMobile: client.phone,
                // Also update country if client is Japanese
                country: client.country === 'japan' ? 'japan' : prev.country
            }));
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const handleServiceChange = (index: number, field: keyof ServiceItem, value: string | number) => {
        setFormData(prev => {
            const services = [...(prev.services || [])];
            let processedValue = value;
            if ((field === 'hours' || field === 'rate') && typeof value === 'number') {
                processedValue = Math.round((value + Number.EPSILON) * 10000) / 10000;
            }
            services[index] = { ...services[index], [field]: processedValue as any };
            return { ...prev, services };
        });
    };

    const addService = () => {
        setFormData(prev => ({
            ...prev,
            services: [
                ...(prev.services || []),
                { id: `service-${Date.now()}`, description: '', hours: 0, rate: 0 }
            ]
        }));
    };

    const removeService = (index: number) => {
        setFormData(prev => {
            const services = [...(prev.services || [])];
            services.splice(index, 1);
            return { ...prev, services };
        });
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!selectedFromId && !selectedInvoice) newErrors.fromCompany = "Please select a sender company";
        if (!formData.employeeName?.trim()) newErrors.employeeName = "Client is required";
        if (!formData.employeeEmail?.trim()) newErrors.employeeEmail = "Email is required";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.employeeEmail)) newErrors.employeeEmail = "Invalid email format";
        if (!formData.date) newErrors.date = t('form.required');

        if (!formData.services || formData.services.length === 0) {
            newErrors.services = 'At least one service is required';
        } else {
            formData.services.forEach((service, index) => {
                if (!service.description?.trim()) newErrors[`service-${index}-description`] = 'Description required';
                if (service.hours <= 0) newErrors[`service-${index}-hours`] = 'Hours > 0';
                if (service.rate <= 0) newErrors[`service-${index}-rate`] = 'Rate > 0';
            });
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        const invoiceDate = new Date(formData.date || new Date().toISOString().split('T')[0]);
        const dueDate = new Date(invoiceDate);
        dueDate.setDate(dueDate.getDate() + 45);

        // Final Construct (ensure bankDetails snapshot is the LATEST editable one)
        const invoice: Invoice = {
            ...formData as Invoice,
            id: selectedInvoice?.id || `invoice-${Date.now()}`,
            invoiceNumber: formData.invoiceNumber || 'INV-DRAFT',
            dueDate: dueDate.toISOString().split('T')[0],
            userId: user?.id, // CRITICAL: Pass userId for backend isolation
            showConsumptionTax: country === 'japan' ? showTaxToggle : false,
            companyInfo: formData.companyInfo ? {
                ...formData.companyInfo,
                bankDetails: bankDetails // Ensure the latest (possibly edited) bank details are used
            } : undefined
        };

        onSave(invoice);
    };

    // Calculation Logic
    const subTotal = (formData.services || []).reduce((sum, s) => sum + (s.hours * s.rate), 0);
    const taxCalculation = calculateTax(
        subTotal,
        formData.taxRate || 0,
        country,
        formData.cgstRate,
        formData.sgstRate
    );
    const grandTotal = taxCalculation.grandTotal;

    const inputClasses = (hasError: boolean) => `block w-full rounded-xl border-0 py-3 px-4 text-gray-900 shadow-sm ring-1 ring-inset ${hasError ? 'ring-red-300 bg-red-50' : 'ring-gray-200 bg-gray-50 focus:bg-white'} focus:ring-2 focus:ring-indigo-500 transition-all`;
    const labelClasses = "block text-sm font-medium leading-6 text-gray-900 mb-1";

    return (
        <form onSubmit={handleSubmit} className="space-y-8">

            {/* 0. Invoice Meta (Date, Number) - Moved to Top */}
            <div className="bg-white rounded-3xl border border-gray-100 p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                    <label className={labelClasses}>Invoice Number</label>
                    <input type="text" value={formData.invoiceNumber || ''} readOnly className={`${inputClasses(false)} bg-gray-100 text-gray-500`} />
                </div>
                <div>
                    <label className={labelClasses}>Date</label>
                    <input type="date" name="date" value={formData.date || ''} onChange={handleChange} className={inputClasses(!!errors.date)} />
                </div>
                <div>
                    <label className={labelClasses}>Due Date</label>
                    <input type="text" value={formData.date ? new Date(new Date(formData.date).setDate(new Date(formData.date).getDate() + 45)).toISOString().split('T')[0] : ''} readOnly className={`${inputClasses(false)} bg-gray-100 text-gray-500`} />
                </div>
            </div>

            {/* 1. Header & Configuration */}
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-8 py-5 border-b border-gray-100 flex items-center gap-3">
                    <div className="h-8 w-1 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full"></div>
                    <h3 className="text-lg font-bold text-gray-900">Invoice Configuration</h3>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* FROM Dropdown */}
                    <div>
                        <label className={labelClasses}>From (Sender Company) <span className="text-red-500">*</span></label>
                        <select
                            value={selectedFromId}
                            onChange={(e) => handleFromCompanyChange(e.target.value)}
                            className={inputClasses(!!errors.fromCompany)}
                        >
                            <option value="">Select Company...</option>
                            {FROM_COMPANIES.map(c => (
                                <option key={c.id} value={c.id}>{c.companyName} ({c.currency})</option>
                            ))}
                            <option value="other">Others...</option>
                        </select>

                        {/* Manual entry for FROM if "Other" is selected */}
                        {isOtherFrom && (
                            <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">Company Name</label>
                                    <input
                                        type="text"
                                        placeholder="Enter company name"
                                        className={inputClasses(false)}
                                        value={formData.company}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setFormData(prev => ({
                                                ...prev,
                                                company: val,
                                                companyInfo: {
                                                    ...prev.companyInfo!,
                                                    companyName: val
                                                }
                                            }));
                                        }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">Company Address</label>
                                    <textarea
                                        placeholder="Enter company address"
                                        className={inputClasses(false)}
                                        rows={2}
                                        value={formData.companyInfo?.companyAddress}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setFormData(prev => ({
                                                ...prev,
                                                companyInfo: {
                                                    ...prev.companyInfo!,
                                                    companyAddress: val
                                                }
                                            }));
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                        {/* Company Info & Logo Preview */}
                        {selectedFromId && (() => {
                            const selectedCompany = FROM_COMPANIES.find(c => c.id === selectedFromId);
                            return (
                                <div className="mt-3 bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-start gap-3">
                                    {selectedCompany?.companyLogoUrl && (
                                        <div className="w-16 h-16 flex-shrink-0 bg-white rounded border border-gray-200 p-1 flex items-center justify-center overflow-hidden">
                                            <img
                                                src={selectedCompany.companyLogoUrl}
                                                alt="Company Logo"
                                                className="max-w-full max-h-full object-contain"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                }}
                                            />
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-sm font-semibold text-gray-800">{selectedCompany?.companyName}</p>
                                        <p className="text-xs text-gray-500 mt-1 whitespace-pre-wrap">{selectedCompany?.companyAddress}</p>
                                    </div>
                                </div>
                            );
                        })()}
                        {errors.fromCompany && <p className="mt-1 text-xs text-red-500">{errors.fromCompany}</p>}
                    </div>

                    {/* TO Dropdown */}
                    <div>
                        <label className={labelClasses}>To (Client) <span className="text-red-500">*</span></label>
                        <select
                            value={selectedToId}
                            onChange={(e) => handleToClientChange(e.target.value)}
                            className={inputClasses(false)}
                        >
                            <option value="">Select Client...</option>
                            {TO_COMPANIES.map(c => (
                                <option key={c.id} value={c.id}>{c.companyName} ({c.country})</option>
                            ))}
                            <option value="other">Others...</option>
                        </select>

                        {/* Manual entry for TO if "Other" is selected */}
                        {isOtherTo && (
                            <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">Client Name</label>
                                    <input
                                        type="text"
                                        name="employeeName"
                                        placeholder="Enter client name"
                                        className={inputClasses(!!errors.employeeName)}
                                        value={formData.employeeName}
                                        onChange={handleChange}
                                    />
                                    {errors.employeeName && <p className="mt-1 text-xs text-red-500">{errors.employeeName}</p>}
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">Client Email</label>
                                    <input
                                        type="email"
                                        name="employeeEmail"
                                        placeholder="Enter client email"
                                        className={inputClasses(!!errors.employeeEmail)}
                                        value={formData.employeeEmail}
                                        onChange={handleChange}
                                    />
                                    {errors.employeeEmail && <p className="mt-1 text-xs text-red-500">{errors.employeeEmail}</p>}
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">Client Address</label>
                                    <textarea
                                        name="employeeAddress"
                                        placeholder="Enter client address"
                                        className={inputClasses(false)}
                                        rows={2}
                                        value={formData.employeeAddress}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">Client Phone</label>
                                    <input
                                        type="text"
                                        name="employeeMobile"
                                        placeholder="Enter client phone"
                                        className={inputClasses(false)}
                                        value={formData.employeeMobile}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        )}
                        {formData.employeeName && !isOtherTo && (
                            <div className="mt-3 space-y-3">
                                <p className="text-xs text-gray-500 px-1">
                                    {formData.employeeAddress}
                                </p>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 px-1">Recipient Email (Mandatory)</label>
                                    <input
                                        type="email"
                                        name="employeeEmail"
                                        value={formData.employeeEmail || ''}
                                        onChange={handleChange}
                                        placeholder="Enter recipient email"
                                        className={inputClasses(!!errors.employeeEmail)}
                                    />
                                    {errors.employeeEmail && <p className="mt-1 text-xs text-red-500">{errors.employeeEmail}</p>}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 2. Bank Details (Editable) */}
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-8 py-5 border-b border-gray-100 flex items-center gap-3">
                    <div className="h-8 w-1 bg-gradient-to-b from-green-500 to-emerald-600 rounded-full"></div>
                    <h3 className="text-lg font-bold text-gray-900">Bank Details</h3>
                </div>
                <div className="p-6">
                    <BankDetailsForm
                        data={{ ...bankDetails, branchName: bankDetails.branchName || '', branchCode: bankDetails.branchCode || '', accountType: bankDetails.accountType || '' }}
                        onChange={(newData) => setBankDetails({
                            ...newData,
                            branchName: newData.branchName || '',
                            accountType: newData.accountType || ''
                        })}
                        errors={{}} // Validation handled loosely for now as per request
                    />
                    <p className="text-xs text-gray-400 mt-4 px-2">
                        * These details are auto-filled from the selected "From" company but can be edited for this invoice.
                    </p>
                </div>
            </div>



            {/* 4. Services */}
            <div className="bg-white rounded-3xl border border-gray-100 p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-gray-900">Services</h3>
                    <button type="button" onClick={addService} className="text-blue-600 font-semibold text-sm hover:underline">+ Add Item</button>
                </div>
                {formData.services?.map((service, index) => (
                    <div key={service.id || index} className="grid grid-cols-12 gap-4 mb-4 items-end border-b border-gray-50 pb-4 last:border-0">
                        <div className="col-span-6">
                            <label className={labelClasses}>Description</label>
                            <input type="text" value={service.description} onChange={(e) => handleServiceChange(index, 'description', e.target.value)} className={inputClasses(!!errors[`service-${index}-description`])} />
                        </div>
                        <div className="col-span-2">
                            <label className={labelClasses}>Hours</label>
                            <input type="number" step="0.1" value={service.hours} onChange={(e) => handleServiceChange(index, 'hours', parseFloat(e.target.value))} className={inputClasses(!!errors[`service-${index}-hours`])} />
                        </div>
                        <div className="col-span-3">
                            <label className={labelClasses}>Rate ({getCurrencySymbol(country)})</label>
                            <input type="number" value={service.rate} onChange={(e) => handleServiceChange(index, 'rate', parseFloat(e.target.value))} className={inputClasses(!!errors[`service-${index}-rate`])} />
                        </div>
                        <div className="col-span-1 pb-2">
                            <button type="button" onClick={() => removeService(index)} className="text-red-500 hover:bg-red-50 p-2 rounded-full">🗑️</button>
                        </div>
                    </div>
                ))}
                {(formData.services?.length === 0) && <p className="text-center text-gray-400 py-4">No items added.</p>}
            </div>

            {/* 5. Totals */}
            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100">
                <div className="flex justify-between items-center mb-4">
                    <div className="w-2/3 grid grid-cols-1 md:grid-cols-3 gap-4">
                        {country === 'india' ? (
                            <>
                                <div>
                                    <label className={labelClasses}>CGST (%)</label>
                                    <input type="number" name="cgstRate" value={formData.cgstRate} onChange={handleChange} className={inputClasses(false)} />
                                </div>
                                <div>
                                    <label className={labelClasses}>SGST (%)</label>
                                    <input type="number" name="sgstRate" value={formData.sgstRate} onChange={handleChange} className={inputClasses(false)} />
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-100 shadow-sm w-fit">
                                    <span className={`text-sm font-medium ${!showTaxToggle ? 'text-blue-600' : 'text-gray-400'}`}>No Tax</span>
                                    <button
                                        type="button"
                                        onClick={() => setShowTaxToggle(!showTaxToggle)}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${showTaxToggle ? 'bg-gradient-to-r from-blue-500 to-indigo-600' : 'bg-gray-200'}`}
                                        role="switch"
                                        aria-checked={showTaxToggle}
                                    >
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${showTaxToggle ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                    <span className={`text-sm font-medium ${showTaxToggle ? 'text-blue-600' : 'text-gray-400'}`}>Add Consumption Tax</span>
                                </div>

                                {showTaxToggle && (
                                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                        <label className={labelClasses}>Consumption Tax (%)</label>
                                        <input
                                            type="number"
                                            name="taxRate"
                                            value={formData.taxRate}
                                            onChange={handleChange}
                                            className={inputClasses(false)}
                                            placeholder="Enter tax rate manually"
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-gray-600">Subtotal: {formatCurrency(subTotal, country)}</p>
                        {country === 'india' ? (
                            <>
                                <p className="text-sm text-gray-500">CGST ({formData.cgstRate}%): {formatCurrency(subTotal * ((formData.cgstRate || 0) / 100), country)}</p>
                                <p className="text-sm text-gray-500">SGST ({formData.sgstRate}%): {formatCurrency(subTotal * ((formData.sgstRate || 0) / 100), country)}</p>
                            </>
                        ) : (
                            showTaxToggle ? (
                                <p className="text-sm text-gray-500">Tax ({formData.taxRate}%): {formatCurrency(subTotal * ((formData.taxRate || 0) / 100), country)}</p>
                            ) : null
                        )}
                        <p className="text-2xl font-bold text-blue-600 mt-2">Total: {formatCurrency(showTaxToggle || country === 'india' ? grandTotal : subTotal, country)}</p>
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-4">
                {selectedInvoice && <button type="button" onClick={clearSelection} className="px-6 py-2 border rounded-xl">Cancel</button>}
                <button type="submit" className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all">
                    {selectedInvoice ? 'Save Changes' : 'Create Invoice'}
                </button>
            </div>
        </form>
    );
};
