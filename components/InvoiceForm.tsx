import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { createInvoice, updateInvoice, getNextInvoiceNumber } from '../services/apiService';
import { Invoice, ServiceItem } from '../types';
import { useCountry } from '../contexts/CountryContext';
import { calculateTax, getCurrencySymbol, formatCurrency } from '../services/countryPreferenceService';
import { useAuth } from '../contexts/AuthContext';

interface InvoiceFormProps {
    onSave: (invoice: Invoice) => void;
    selectedInvoice?: Invoice | null;
    clearSelection: () => void;
    invoicesCount: number;
}

export const InvoiceForm: React.FC<InvoiceFormProps> = ({
    onSave,
    selectedInvoice,
    clearSelection,
    invoicesCount
}) => {
    const { t } = useTranslation();
    const { country } = useCountry();

    const { companyInfo, user } = useAuth(); // Ensure user is available

    const [formData, setFormData] = useState<Partial<Invoice>>({
        invoiceNumber: '',
        date: new Date().toISOString().split('T')[0],
        dueDate: '',
        company: '',
        employeeName: '',
        employeeId: '',
        employeeEmail: '',
        employeeAddress: '',
        employeeMobile: '',
        services: [],
        taxRate: 10,
        country: country
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    // Generate invoice number if creating new invoice
    useEffect(() => {
        const fetchNextNumber = async () => {
            if (!selectedInvoice && user?.id) {
                try {
                    const nextNum = await getNextInvoiceNumber(user.id);
                    setFormData(prev => ({ ...prev, invoiceNumber: nextNum }));
                } catch (error) {
                    console.error('Failed to fetch next invoice number:', error);
                    // Fallback to count-based if API fails (optional)
                    const invoiceNumber = `INV-${String(invoicesCount + 1).padStart(4, '0')}`;
                    setFormData(prev => ({ ...prev, invoiceNumber }));
                }
            }
        };

        fetchNextNumber();
    }, [selectedInvoice, user?.id, invoicesCount]);

    // Load selected invoice data
    useEffect(() => {
        if (selectedInvoice) {
            setFormData({
                ...selectedInvoice,
                country: selectedInvoice.country || country
            });
        }
    }, [selectedInvoice, country]);

    // Update country when it changes
    useEffect(() => {
        setFormData(prev => ({ ...prev, country }));
    }, [country]);

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

            // Apply defensive rounding to numeric fields to avoid floating point artifacts (e.g., 2000 -> 1999.96)
            let processedValue = value;
            if ((field === 'hours' || field === 'rate') && typeof value === 'number') {
                // Rounding to 4 decimal places should be more than enough for precision while clearing noise
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
                {
                    id: `service-${Date.now()}`,
                    description: '',
                    hours: 0,
                    rate: 0
                }
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

        if (!formData.employeeName?.trim()) {
            newErrors.employeeName = t('form.required');
        }
        if (!formData.employeeId?.trim()) {
            newErrors.employeeId = t('form.required');
        }
        if (!formData.employeeEmail?.trim()) {
            newErrors.employeeEmail = t('form.required');
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.employeeEmail)) {
            newErrors.employeeEmail = t('form.invalidEmail');
        }
        if (!formData.employeeAddress?.trim()) {
            newErrors.employeeAddress = t('form.required');
        }
        if (!formData.employeeMobile?.trim()) {
            newErrors.employeeMobile = t('form.required');
        }
        if (!formData.date) {
            newErrors.date = t('form.required');
        }
        if (!formData.services || formData.services.length === 0) {
            newErrors.services = 'At least one service is required';
        } else {
            formData.services.forEach((service, index) => {
                if (!service.description?.trim()) {
                    newErrors[`service-${index}-description`] = 'Description is required';
                }
                if (service.hours <= 0) {
                    newErrors[`service-${index}-hours`] = 'Hours must be greater than 0';
                }
                if (service.rate <= 0) {
                    newErrors[`service-${index}-rate`] = 'Rate must be greater than 0';
                }
            });
        }
        if (formData.taxRate === undefined || formData.taxRate < 0) {
            newErrors.taxRate = 'Tax rate is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) {
            return;
        }

        // Calculate Due Date (Date + 45 days)
        const invoiceDate = new Date(formData.date || new Date().toISOString().split('T')[0]);
        const dueDate = new Date(invoiceDate);
        dueDate.setDate(dueDate.getDate() + 45);
        const formattedDueDate = dueDate.toISOString().split('T')[0];

        const invoice: Invoice = {
            id: selectedInvoice?.id || `invoice-${Date.now()}`,
            invoiceNumber: formData.invoiceNumber || `INV-${String(invoicesCount + 1).padStart(4, '0')}`,
            date: formData.date || new Date().toISOString().split('T')[0],
            dueDate: formattedDueDate, // Auto-calculated
            company: formData.company || companyInfo?.companyName || '',
            employeeName: formData.employeeName || '',
            employeeId: formData.employeeId || '',
            employeeEmail: formData.employeeEmail || '',
            employeeAddress: formData.employeeAddress || '',
            employeeMobile: formData.employeeMobile || '',
            services: formData.services || [],
            taxRate: formData.taxRate || 0,
            country: formData.country || country,
            // Snapshot Isolation Data
            userId: user?.id,
            companyInfo: companyInfo || undefined, // Store snapshot
        };

        onSave(invoice);
    };

    // Calculate totals
    const subTotal = (formData.services || []).reduce((sum, s) => sum + (s.hours * s.rate), 0);
    const taxCalculation = calculateTax(subTotal, formData.taxRate || 0, formData.country || country);
    const grandTotal = taxCalculation.grandTotal;

    const inputClasses = (hasError: boolean) => `
        block w-full rounded-xl border-0 py-3 px-4 text-gray-900 shadow-sm ring-1 ring-inset 
        ${hasError
            ? 'ring-red-300 placeholder:text-red-300 focus:ring-red-500 bg-red-50/50'
            : 'ring-gray-200 placeholder:text-gray-400 focus:ring-indigo-500 bg-gray-50/50 hover:bg-white'} 
        focus:ring-2 focus:ring-inset focus:bg-white sm:text-sm sm:leading-6 transition-all duration-200 ease-in-out
    `;

    const labelClasses = "block text-sm font-medium leading-6 text-gray-900 mb-1";

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            {/* Invoice Header Card */}
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 overflow-hidden ring-1 ring-white/60">
                <div className="px-8 py-5 border-b border-gray-100 flex items-center gap-3">
                    <div className="h-8 w-1 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full"></div>
                    <h3 className="text-lg font-bold text-gray-900 tracking-tight">Invoice Details</h3>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className={labelClasses}>Invoice Number</label>
                        <input
                            type="text"
                            name="invoiceNumber"
                            value={formData.invoiceNumber || ''}
                            readOnly={true} // Strict read-only
                            className={`${inputClasses(false)} bg-gray-100 cursor-not-allowed`} // Visually indicate disabled
                        />
                    </div>
                    <div>
                        <label className={labelClasses}>{t('invoice.date')} *</label>
                        <input
                            type="date"
                            name="date"
                            value={formData.date || ''}
                            onChange={handleChange}
                            className={inputClasses(!!errors.date)}
                            required
                        />
                        {errors.date && <p className="mt-1 text-xs text-red-500">{errors.date}</p>}
                    </div>
                    <div>
                        <label className={labelClasses}>Due Date (Auto: +45 days)</label>
                        <input
                            type="text"
                            value={formData.date ? new Date(new Date(formData.date).setDate(new Date(formData.date).getDate() + 45)).toISOString().split('T')[0] : ''}
                            readOnly
                            className={`${inputClasses(false)} bg-gray-100 text-gray-500 cursor-not-allowed`}
                        />
                    </div>
                </div>
            </div>

            {/* Client/Employee Info Card */}
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 overflow-hidden ring-1 ring-white/60">
                <div className="px-8 py-5 border-b border-gray-100 flex items-center gap-3">
                    <div className="h-8 w-1 bg-gradient-to-b from-emerald-400 to-teal-500 rounded-full"></div>
                    <h3 className="text-lg font-bold text-gray-900 tracking-tight">Client Information</h3>
                </div>
                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className={labelClasses}>Employee Name *</label>
                        <input
                            type="text"
                            name="employeeName"
                            value={formData.employeeName || ''}
                            onChange={handleChange}
                            className={inputClasses(!!errors.employeeName)}
                            required
                        />
                        {errors.employeeName && <p className="mt-1 text-xs text-red-500">{errors.employeeName}</p>}
                    </div>
                    <div>
                        <label className={labelClasses}>{t('invoice.employeeId')} *</label>
                        <input
                            type="text"
                            name="employeeId"
                            value={formData.employeeId || ''}
                            onChange={handleChange}
                            className={inputClasses(!!errors.employeeId)}
                            required
                        />
                        {errors.employeeId && <p className="mt-1 text-xs text-red-500">{errors.employeeId}</p>}
                    </div>
                    <div>
                        <label className={labelClasses}>{t('invoice.email')} *</label>
                        <input
                            type="email"
                            name="employeeEmail"
                            value={formData.employeeEmail || ''}
                            onChange={handleChange}
                            className={inputClasses(!!errors.employeeEmail)}
                            required
                        />
                        {errors.employeeEmail && <p className="mt-1 text-xs text-red-500">{errors.employeeEmail}</p>}
                    </div>
                    <div>
                        <label className={labelClasses}>{t('invoice.phone')} *</label>
                        <input
                            type="tel"
                            name="employeeMobile"
                            value={formData.employeeMobile || ''}
                            onChange={handleChange}
                            className={inputClasses(!!errors.employeeMobile)}
                            required
                        />
                        {errors.employeeMobile && <p className="mt-1 text-xs text-red-500">{errors.employeeMobile}</p>}
                    </div>
                    <div className="md:col-span-2">
                        <label className={labelClasses}>{t('invoice.address')} *</label>
                        <textarea
                            name="employeeAddress"
                            value={formData.employeeAddress || ''}
                            onChange={handleChange}
                            rows={3}
                            className={inputClasses(!!errors.employeeAddress)}
                            required
                        />
                        {errors.employeeAddress && <p className="mt-1 text-xs text-red-500">{errors.employeeAddress}</p>}
                    </div>
                </div>
            </div>

            {/* Services Card */}
            <div className="bg-white rounded-xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 overflow-hidden">
                <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center bg-white">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-1 bg-purple-500 rounded-full"></div>
                        <h3 className="text-lg font-semibold text-gray-900 tracking-tight">Services & Items</h3>
                    </div>
                    <button
                        type="button"
                        onClick={addService}
                        className="rounded-lg bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 transition-colors flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Item
                    </button>
                </div>
                <div className="p-8">
                    {errors.services && <p className="mb-4 text-sm text-red-500 text-center bg-red-50 p-2 rounded">{errors.services}</p>}

                    <div className="space-y-4">
                        {(formData.services || []).map((service, index) => (
                            <div key={service.id || index} className="group relative rounded-xl border border-gray-100 p-6 hover:border-blue-200 hover:bg-blue-50/30 transition-all duration-200">
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                                    <div className="md:col-span-6">
                                        <label className={labelClasses}>Description *</label>
                                        <input
                                            type="text"
                                            value={service.description}
                                            onChange={(e) => handleServiceChange(index, 'description', e.target.value)}
                                            className={inputClasses(!!errors[`service-${index}-description`])}
                                            required
                                            placeholder="e.g. Frontend Development"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className={labelClasses}>Hours *</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            min="0"
                                            value={service.hours || ''}
                                            onChange={(e) => handleServiceChange(index, 'hours', parseFloat(e.target.value) || 0)}
                                            onFocus={(e) => e.target.select()}
                                            className={inputClasses(!!errors[`service-${index}-hours`])}
                                            required
                                            placeholder="0.0"
                                        />
                                    </div>
                                    <div className="md:col-span-3">
                                        <label className={labelClasses}>Rate *</label>
                                        <div className="relative">
                                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                                <span className="text-gray-500 sm:text-sm">{getCurrencySymbol(country)}</span>
                                            </div>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={service.rate || ''}
                                                onChange={(e) => handleServiceChange(index, 'rate', parseFloat(e.target.value) || 0)}
                                                onFocus={(e) => e.target.select()}
                                                className={`${inputClasses(!!errors[`service-${index}-rate`])} pl-7`}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="md:col-span-1 flex justify-end pt-8">
                                        <button
                                            type="button"
                                            onClick={() => removeService(index)}
                                            className="text-gray-400 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-50"
                                            title="Remove Item"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {(formData.services?.length === 0) && (
                            <div className="text-center py-12 bg-gray-50/50 border-2 border-dashed border-gray-200 rounded-xl">
                                <div className="text-gray-400 mb-2">
                                    <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                                    </svg>
                                </div>
                                <p className="text-gray-500 font-medium">No items added yet</p>
                                <p className="text-gray-400 text-sm">Click "Add Item" to start adding services to this invoice</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Totals & Tax Card */}
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 overflow-hidden ring-1 ring-white/60">
                <div className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <div className="h-6 w-1 bg-orange-500 rounded-full"></div>
                                <h3 className="text-lg font-semibold text-gray-900 tracking-tight">Tax Configuration</h3>
                            </div>
                            <label className={labelClasses}>Tax Rate (%)</label>
                            <div className="relative mt-2">
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    name="taxRate"
                                    value={formData.taxRate || 0}
                                    onChange={handleChange}
                                    className={`${inputClasses(!!errors.taxRate)} pr-8`}
                                    required
                                />
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                                    <span className="text-gray-400">%</span>
                                </div>
                            </div>
                            <p className="mt-2 text-sm text-gray-500">
                                {country === 'india' ? 'Applicable GST rate' : 'Applicable Consumption Tax rate'}
                            </p>
                        </div>
                        <div className="bg-slate-50/80 rounded-2xl p-6 space-y-4 border border-slate-100">
                            <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 border-b border-gray-200 pb-2">Payment Summary</h4>

                            <div className="flex justify-between text-sm text-gray-600">
                                <span>Subtotal</span>
                                <span className="font-semibold text-gray-900 font-mono">{formatCurrency(subTotal, country)}</span>
                            </div>

                            {country === 'japan' ? (
                                taxCalculation.consumptionTaxRate && taxCalculation.consumptionTaxRate > 0 && (
                                    <div className="flex justify-between text-sm text-gray-600">
                                        <span>Consumption Tax ({taxCalculation.consumptionTaxRate.toFixed(2)}%)</span>
                                        <span className="font-semibold text-gray-900 font-mono">{formatCurrency(taxCalculation.consumptionTaxAmount || 0, country)}</span>
                                    </div>
                                )
                            ) : (
                                <>
                                    {taxCalculation.cgstRate && taxCalculation.cgstRate > 0 && (
                                        <div className="flex justify-between text-sm text-gray-600">
                                            <span>CGST ({taxCalculation.cgstRate.toFixed(2)}%)</span>
                                            <span className="font-semibold text-gray-900 font-mono">{formatCurrency(taxCalculation.cgstAmount || 0, country)}</span>
                                        </div>
                                    )}
                                    {taxCalculation.sgstRate && taxCalculation.sgstRate > 0 && (
                                        <div className="flex justify-between text-sm text-gray-600">
                                            <span>SGST ({taxCalculation.sgstRate.toFixed(2)}%)</span>
                                            <span className="font-semibold text-gray-900 font-mono">{formatCurrency(taxCalculation.sgstAmount || 0, country)}</span>
                                        </div>
                                    )}
                                </>
                            )}

                            <div className="pt-4 border-t border-gray-200 flex justify-between items-center">
                                <span className="text-lg font-bold text-gray-900">Grand Total</span>
                                <span className="text-2xl font-bold text-blue-600 tracking-tight">{formatCurrency(grandTotal, country)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-x-4 pt-4">
                {selectedInvoice && (
                    <button
                        type="button"
                        onClick={clearSelection}
                        className="rounded-lg px-6 py-2.5 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-colors"
                    >
                        {t('app.actions.cancel')}
                    </button>
                )}
                <button
                    type="submit"
                    className="rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-8 py-3 text-sm font-bold text-white shadow-lg hover:shadow-indigo-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                >
                    {selectedInvoice ? t('app.actions.save') : 'Create Invoice'}
                </button>
            </div>
        </form >
    );
};
