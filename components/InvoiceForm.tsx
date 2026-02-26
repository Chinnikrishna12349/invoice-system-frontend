import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { getNextInvoiceNumber } from '../services/apiService';
import { Invoice, ServiceItem, BankDetails, CompanyInfo } from '../types';
import { useCountry } from '../contexts/CountryContext';
import { calculateTax, getCurrencySymbol, formatCurrency } from '../services/countryPreferenceService';
import { useAuth } from '../contexts/AuthContext';
import { FROM_COMPANIES, TO_COMPANIES, TO_EMPLOYEES, DummyCompany, DummyClient } from '../src/data/dummyCompanies';
import { BankDetailsForm } from './BankDetailsForm';
import { CustomDropdown } from './CustomDropdown';
import { getHiddenSenders, getHiddenClients, hideSender, hideClient } from '../src/utils/companyStorage';
import InvoiceLayout from '../src/components/InvoiceLayout';
import { ImageUpload } from './ImageUpload';
import { bankAccountService, BankAccount } from '../services/bankAccountService';
import visionAiStamp from '../src/assets/visionai-stamp.png';
import { VISION_AI_LOGO_BASE64 } from '../src/assets/visionAiLogoBase64';

interface InvoiceFormProps {
    onSave: (invoice: Invoice) => Promise<void>;
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
    const { user, companyInfo } = useAuth();

    // Dropdown States
    const [selectedFromId, setSelectedFromId] = useState<string>('');
    const [selectedToId, setSelectedToId] = useState<string>('');
    const [isOtherFrom, setIsOtherFrom] = useState(false);
    const [isOtherTo, setIsOtherTo] = useState(false);
    const [clientType, setClientType] = useState<'company' | 'employee'>('company'); // Added clientType

    // Bank Details State (Editable, defaults to From Company's bank)
    const [bankDetails, setBankDetails] = useState<BankDetails>({
        bankName: '',
        accountNumber: '',
        accountHolderName: '',
        ifscCode: '',
        branchName: '',
        accountType: ''
    });

    const [availableBankAccounts, setAvailableBankAccounts] = useState<BankAccount[]>([]);
    const [selectedBankAccountId, setSelectedBankAccountId] = useState<string>('');

    const getInitialFormData = (currentCountry: 'india' | 'japan') => ({
        invoiceNumber: '',
        date: new Date().toISOString().split('T')[0],
        dueDate: '',
        poNumber: '',
        fromEmail: '',
        company: '',
        employeeName: '',
        employeeEmail: '',
        employeeAddress: '',
        employeeMobile: '',
        services: [],
        taxRate: 0,
        cgstRate: 0,
        sgstRate: 0,
        country: currentCountry,
        showConsumptionTax: false,
        clientType: 'company' as const
    });

    const [formData, setFormData] = useState<Partial<Invoice>>(getInitialFormData(country));

    // Track hidden companies
    const [hiddenSenderIds, setHiddenSenderIds] = useState<string[]>([]);
    const [hiddenClientIds, setHiddenClientIds] = useState<string[]>([]);

    // Load hidden companies on mount
    useEffect(() => {
        setHiddenSenderIds(getHiddenSenders());
        setHiddenClientIds(getHiddenClients());
    }, []);

    // Derive Dynamic Lists from existing invoices
    const dynamicSenders = useMemo(() => {
        const senders: (CompanyInfo & { fromEmail?: string })[] = [];
        const seenNames = new Set(FROM_COMPANIES.map(c => c.companyName.toLowerCase()));

        invoices.forEach(inv => {
            if (inv.companyInfo && inv.companyInfo.companyName) {
                const nameLower = inv.companyInfo.companyName.toLowerCase();
                if (!seenNames.has(nameLower)) {
                    senders.push({ ...inv.companyInfo, fromEmail: inv.fromEmail });
                    seenNames.add(nameLower);
                }
            }
        });
        return senders;
    }, [invoices]);

    const { dynamicClientCompanies, dynamicClientEmployees } = useMemo(() => {
        const companies: DummyClient[] = [];
        const employees: DummyClient[] = [];

        // Sets to track duplicates
        const seenCompanies = new Set(TO_COMPANIES.map(c => c.companyName.toLowerCase()));
        const seenEmployees = new Set(TO_EMPLOYEES.map(c => c.companyName.toLowerCase()));

        invoices.forEach(inv => {
            if (inv.employeeName) {
                const nameLower = inv.employeeName.toLowerCase();
                const type = inv.clientType || 'company'; // Default to company for old invoices

                const clientObj: DummyClient = {
                    id: `dynamic-client-${nameLower}`,
                    companyName: inv.employeeName,
                    address: inv.employeeAddress || '',
                    email: inv.employeeEmail || '',
                    phone: inv.employeeMobile || '',
                    contactPerson: '',
                    country: (inv.country || 'india') as 'india' | 'japan',
                    // Extract bank details from the invoice's saved company info (which contains the bank details used)
                    bankDetails: inv.companyInfo?.bankDetails
                };

                if (type === 'company' && !seenCompanies.has(nameLower)) {
                    // Filter out unwanted companies as per request
                    if (nameLower !== 'pavan' && nameLower !== 'kamal') {
                        companies.push(clientObj);
                        seenCompanies.add(nameLower);
                    }
                } else if (type === 'employee' && !seenEmployees.has(nameLower)) {
                    employees.push(clientObj);
                    seenEmployees.add(nameLower);
                }
            }
        });
        return { dynamicClientCompanies: companies, dynamicClientEmployees: employees };
    }, [invoices]);

    // Filter out hidden companies
    const visibleFromCompanies = useMemo(() => {
        return FROM_COMPANIES.filter(c => !hiddenSenderIds.includes(c.id));
    }, [hiddenSenderIds]);

    const visibleDynamicSenders = useMemo(() => {
        return dynamicSenders.filter(c => !hiddenSenderIds.includes(`dynamic-from-${c.companyName}`));
    }, [dynamicSenders, hiddenSenderIds]);

    const visibleToCompanies = useMemo(() => {
        return TO_COMPANIES.filter(c => !hiddenClientIds.includes(c.id));
    }, [hiddenClientIds]);

    const visibleDynamicCompanies = useMemo(() => {
        return dynamicClientCompanies.filter(c => !hiddenClientIds.includes(c.id));
    }, [dynamicClientCompanies, hiddenClientIds]);

    const visibleDynamicEmployees = useMemo(() => {
        return dynamicClientEmployees.filter(c => !hiddenClientIds.includes(c.id));
    }, [dynamicClientEmployees, hiddenClientIds]);

    const [showTaxToggle, setShowTaxToggle] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);

    const [errors, setErrors] = useState<Record<string, string>>({});

    // State for custom logo and signature files
    const [customLogoFile, setCustomLogoFile] = useState<File | null>(null);
    const [customSignatureFile, setCustomSignatureFile] = useState<File | null>(null);

    // Load draft from localStorage on mount
    useEffect(() => {
        const savedDraft = localStorage.getItem('invoice_draft');
        if (savedDraft && !selectedInvoice) {
            try {
                const parsed = JSON.parse(savedDraft);
                setFormData(prev => ({ ...prev, ...parsed }));
            } catch (e) {
                console.error("Failed to load draft", e);
            }
        }
    }, [selectedInvoice]);

    // Fetch bank accounts from separate system
    useEffect(() => {
        const fetchBankAccounts = async () => {
            if (user?.id) {
                try {
                    const accounts = await bankAccountService.getAll(user.id);
                    setAvailableBankAccounts(accounts);
                } catch (err) {
                    console.error("Failed to fetch bank accounts", err);
                }
            }
        };
        fetchBankAccounts();
    }, [user?.id]);

    // Save draft to localStorage on change
    useEffect(() => {
        if (!selectedInvoice) {
            const timer = setTimeout(() => {
                const { companyLogoUrl, signatureUrl, ...rest } = formData as any;
                localStorage.setItem('invoice_draft', JSON.stringify(rest));
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [formData, selectedInvoice]);

    // Initialize/Reset Logic
    useEffect(() => {
        if (!selectedInvoice) {
            const savedData = localStorage.getItem('dashboard_autosave');
            if (savedData) {
                try {
                    const parsed = JSON.parse(savedData);
                    setFormData(parsed.formData);
                    setBankDetails(parsed.bankDetails);
                    setSelectedFromId(parsed.selectedFromId);
                    setSelectedToId(parsed.selectedToId);
                    setIsOtherFrom(parsed.isOtherFrom);
                    setIsOtherTo(parsed.isOtherTo);
                    setClientType(parsed.clientType || 'company');
                    if (parsed.showTaxToggle !== undefined) setShowTaxToggle(parsed.showTaxToggle);
                } catch (e) {
                    console.error("Failed to parse autosave data", e);
                    localStorage.removeItem('dashboard_autosave');
                }
            } else {
                setFormData(getInitialFormData(country));
                setBankDetails({
                    bankName: '',
                    accountNumber: '',
                    accountHolderName: '',
                    ifscCode: '',
                    branchName: '',
                    accountType: ''
                });
                setSelectedFromId('');
                setSelectedToId('');
                setIsOtherFrom(false);
                setIsOtherTo(false);
                setClientType('company');
            }
        } else {
            setFormData({ ...selectedInvoice });
            if (selectedInvoice.companyInfo?.bankDetails) {
                setBankDetails(selectedInvoice.companyInfo.bankDetails);
                if (selectedInvoice.companyInfo.id) setSelectedFromId(selectedInvoice.companyInfo.id);
            }
            const employeeMatch = TO_EMPLOYEES.find(c => c.companyName === selectedInvoice.employeeName) ||
                dynamicClientEmployees.find(c => c.companyName === selectedInvoice.employeeName);
            const companyMatch = TO_COMPANIES.find(c => c.companyName === selectedInvoice.employeeName) ||
                dynamicClientCompanies.find(c => c.companyName === selectedInvoice.employeeName);

            if (employeeMatch) {
                setClientType('employee');
                setSelectedToId(employeeMatch.id);
                setIsOtherTo(false);
            } else if (companyMatch) {
                setClientType('company');
                setSelectedToId(companyMatch.id);
                setIsOtherTo(false);
            } else {
                setClientType(selectedInvoice.clientType || 'company');
                setIsOtherTo(true);
                setSelectedToId('other');
            }

            const isJapan = selectedInvoice.country === 'japan';
            if (isJapan) {
                setShowTaxToggle(!!selectedInvoice.showConsumptionTax || (selectedInvoice.taxRate || 0) > 0);
            }

            if (selectedInvoice.country) {
                setCountry(selectedInvoice.country);
            }
        }
    }, [selectedInvoice, dynamicClientCompanies, dynamicClientEmployees]);

    // Auto-Save Effect
    useEffect(() => {
        if (!selectedInvoice) {
            const dataToSave = {
                formData,
                bankDetails,
                selectedFromId,
                selectedToId,
                isOtherFrom,
                isOtherTo,
                clientType,
                showTaxToggle
            };
            localStorage.setItem('dashboard_autosave', JSON.stringify(dataToSave));
        }
    }, [formData, bankDetails, selectedFromId, selectedToId, isOtherFrom, isOtherTo, clientType, showTaxToggle, selectedInvoice]);

    useEffect(() => {
        setFormData(prev => ({ ...prev, country: country }));
    }, [country]);

    const generateDynamicPrefix = (name: string): string => {
        if (!name.trim()) return 'INV-';
        const words = name.trim().split(/\s+/);
        let prefix = '';
        if (words.length >= 2) {
            prefix = (words[0][0] + words[1][0]).toUpperCase();
        } else {
            prefix = name.trim().substring(0, 3).toUpperCase();
        }
        return `INV-${prefix}-`;
    };

    useEffect(() => {
        const fetchNextNumber = () => {
            if (!selectedInvoice) {
                const prefix = formData.companyInfo?.invoiceFormat || 'INV-';
                const regex = new RegExp(`^${prefix}\\d+$`);
                const relevantInvoices = invoices.filter(inv =>
                    inv.invoiceNumber && regex.test(inv.invoiceNumber)
                );

                let nextNum = 1;
                if (relevantInvoices.length > 0) {
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

    const handleFromCompanyChange = (companyId: string) => {
        if (companyId === 'other') {
            setIsOtherFrom(true);
            setSelectedFromId('other');
            setFormData(prev => ({
                ...prev,
                company: companyInfo?.companyName || '',
                fromEmail: companyInfo?.fromEmail || '',
                companyInfo: {
                    ...prev.companyInfo,
                    companyName: companyInfo?.companyName || '',
                    companyAddress: companyInfo?.companyAddress || '',
                    companyLogoUrl: companyInfo?.companyLogoUrl || '',
                    invoiceFormat: companyInfo?.invoiceFormat || 'INV-',
                    bankDetails: companyInfo?.bankDetails || {
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

        const dynamicCompany = dynamicSenders.find(c => `dynamic-from-${c.companyName}` === companyId);
        if (dynamicCompany) {
            setIsOtherFrom(false);
            setSelectedFromId(companyId);
            const dynamicPrefix = generateDynamicPrefix(dynamicCompany.companyName);
            setBankDetails({ ...dynamicCompany.bankDetails });
            setFormData(prev => ({
                ...prev,
                company: dynamicCompany.companyName,
                fromEmail: dynamicCompany.fromEmail || '',
                country: dynamicCompany.bankDetails.ifscCode ? 'india' : 'japan',
                companyInfo: {
                    ...dynamicCompany,
                    invoiceFormat: dynamicPrefix
                }
            }));
            return;
        }

        setIsOtherFrom(false);
        setSelectedFromId(companyId);
        const company = FROM_COMPANIES.find(c => c.id === companyId);
        if (company) {
            if (company.currency === 'JPY') {
                setCountry('japan');
                setShowTaxToggle(true); // Default to true for Japan as per testing feedback
                setFormData(prev => ({ ...prev, taxRate: 10 })); // Default to 10% for Japan
            } else {
                setCountry('india');
            }
            setBankDetails({ ...company.bankDetails });
            setFormData(prev => {
                let newInvoiceNumber = prev.invoiceNumber;
                if (company.invoiceFormat) {
                    const match = prev.invoiceNumber.match(/\d+$/);
                    const currentNum = match ? match[0] : '0001';
                    newInvoiceNumber = `${company.invoiceFormat}${currentNum}`;
                }
                return {
                    ...prev,
                    invoiceNumber: newInvoiceNumber,
                    company: company.companyName,
                    fromEmail: (company as DummyCompany).fromEmail || '',
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

    const handleDeleteSender = (id: string) => {
        hideSender(id);
        setHiddenSenderIds(prev => [...prev, id]);
        if (selectedFromId === id) {
            setSelectedFromId('');
            setIsOtherFrom(false);
            setFormData(prev => ({ ...prev, company: '', companyInfo: undefined }));
        }
    };

    const handleDeleteClient = (id: string) => {
        hideClient(id);
        setHiddenClientIds(prev => [...prev, id]);
        if (selectedToId === id) {
            setSelectedToId('');
            setIsOtherTo(false);
            setFormData(prev => ({
                ...prev,
                employeeName: '',
                employeeEmail: '',
                employeeAddress: '',
                employeeMobile: ''
            }));
        }
    };

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
            if (clientType === 'employee') {
                setBankDetails({
                    bankName: '',
                    accountNumber: '',
                    accountHolderName: '',
                    ifscCode: '',
                    swiftCode: '',
                    branchName: '',
                    branchCode: '',
                    accountType: ''
                });
            }
            if (clientType === 'employee') {
                setCountry('japan');
                setShowTaxToggle(true);
                setFormData(prev => ({ ...prev, taxRate: 10 }));
            }
            return;
        }

        const dynamicClient = dynamicClientCompanies.find(c => c.id === clientId) ||
            dynamicClientEmployees.find(c => c.id === clientId);

        if (dynamicClient) {
            setIsOtherTo(false);
            setSelectedToId(clientId);
            setFormData(prev => ({
                ...prev,
                employeeName: dynamicClient.companyName,
                employeeEmail: dynamicClient.email,
                employeeAddress: dynamicClient.address,
                employeeMobile: dynamicClient.phone,
                country: dynamicClient.country || prev.country
            }));
            if (dynamicClient.bankDetails) {
                setBankDetails({ ...dynamicClient.bankDetails });
            }
            return;
        }

        setIsOtherTo(false);
        setSelectedToId(clientId);
        let client = TO_COMPANIES.find(c => c.id === clientId);
        if (!client) client = TO_EMPLOYEES.find(c => c.id === clientId);

        if (client) {
            setFormData(prev => ({
                ...prev,
                employeeName: client!.companyName,
                employeeEmail: client!.email,
                employeeAddress: client!.address,
                employeeMobile: client!.phone,
                country: client!.country === 'japan' ? 'japan' : prev.country
            }));
            if (client.bankDetails) setBankDetails({ ...client.bankDetails });
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        let processedValue = value;
        if (name === 'employeeMobile') {
            processedValue = value.replace(/\D/g, '');
            if (country === 'japan') {
                processedValue = processedValue.slice(0, 11);
            } else {
                processedValue = processedValue.slice(0, 15);
            }
        }
        setFormData(prev => ({ ...prev, [name]: processedValue }));

        // Auto-calculate tax if country is Japan and toggle is on
        if (name === 'taxRate' && country === 'japan' && showTaxToggle) {
            // Calculation is done in useMemo or render, just ensuring state updates
        }

        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
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

    const handleServiceChange = (index: number, field: keyof ServiceItem, value: any) => {
        const updatedServices = [...(formData.services || [])];
        let processedValue = value;
        if ((field === 'hours' || field === 'rate') && typeof value === 'number') {
            processedValue = field === 'hours' ? Math.round(value * 100) / 100 : Math.max(0, value);
        }
        updatedServices[index] = { ...updatedServices[index], [field]: processedValue };
        setFormData(prev => ({ ...prev, services: updatedServices }));
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
        if (!formData.poNumber?.trim()) newErrors.poNumber = "PO Number is required"; // Mandatory PO Number
        if (!formData.fromEmail?.trim()) newErrors.fromEmail = "From Email is required"; // Mandatory From Email

        if (!formData.employeeName?.trim()) newErrors.employeeName = "Client Name is required";
        if (!formData.employeeEmail?.trim()) newErrors.employeeEmail = "Email is required";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.employeeEmail)) newErrors.employeeEmail = "Invalid email format";

        if (!formData.employeeAddress?.trim()) newErrors.employeeAddress = "Address is required"; // Mandatory Address
        if (!formData.employeeMobile?.trim()) newErrors.employeeMobile = "Phone is required"; // Mandatory Phone

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

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (error) => reject(error);
        });
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (isSaving) {
            alert("invoice is getting created,please wait.");
            return;
        }

        if (!validate()) {
            alert("Please fill all the mandatory (*) fields.");
            return;
        }

        setIsSaving(true);

        let finalLogoUrl = formData.companyInfo?.companyLogoUrl || '';
        let finalSignatureUrl = formData.signatureUrl || '';

        try {
            if (customLogoFile) {
                finalLogoUrl = await fileToBase64(customLogoFile);
            }
            if (customSignatureFile) {
                finalSignatureUrl = await fileToBase64(customSignatureFile);
            }
        } catch (err) {
            console.error("Failed to convert image files", err);
            alert("Failed to process image files. Please try again.");
            setIsSaving(false);
            return;
        }

        const invoiceDate = new Date(formData.date || new Date().toISOString().split('T')[0]);
        const dueDate = new Date(invoiceDate);
        dueDate.setDate(dueDate.getDate() + 45);

        // Calculate Round Off and Final Amount
        const subTotal = (formData.services || []).reduce((sum, s) => sum + Math.round((s.hours * s.rate) * 100) / 100, 0);

        let taxAmount = 0;
        if (country === 'india') {
            const cgst = Math.round((subTotal * (formData.cgstRate || 0) / 100) * 100) / 100;
            const sgst = Math.round((subTotal * (formData.sgstRate || 0) / 100) * 100) / 100;
            taxAmount = cgst + sgst;
        } else if (country === 'japan' && (formData.showConsumptionTax || showTaxToggle)) { // Check both state and toggle
            taxAmount = Math.round((subTotal * ((formData.taxRate || 0) / 100)) * 100) / 100;
        }

        const totalBeforeRound = subTotal + taxAmount;
        const finalAmount = Math.round(totalBeforeRound);
        const roundOff = parseFloat((finalAmount - totalBeforeRound).toFixed(2));

        const invoice: Invoice = {
            ...formData as Invoice,
            id: selectedInvoice?.id || `invoice-${Date.now()}`,
            invoiceNumber: formData.invoiceNumber || 'INV-DRAFT',
            dueDate: dueDate.toISOString().split('T')[0],
            userId: user?.id, // CRITICAL: Pass userId for backend isolation
            country: country, // Force sync with global context to ensure Preview matches Toggle
            showConsumptionTax: country === 'japan' ? showTaxToggle : false,
            roundOff: roundOff,
            finalAmount: finalAmount,
            signatureUrl: finalSignatureUrl,
            companyInfo: formData.companyInfo ? {
                ...formData.companyInfo,
                companyLogoUrl: finalLogoUrl,
                bankDetails: bankDetails // Ensure the latest (possibly edited) bank details are used
            } : undefined
        };

        setPreviewInvoice(invoice);
        setShowPreview(true);
        setIsSaving(false); // RE-ENABLE button for the preview modal confirm step
    };

    const handleConfirmSave = async () => {
        if (!previewInvoice) return;

        setIsSaving(true);
        // Do NOT call setShowPreview(false) here, let the user see the "Saving..." state on the confirm button

        try {
            await onSave(previewInvoice);

            // Successfully saved!
            setShowPreview(false); // NOW close it

            // Reset Form Data after successful save (as requested)
            if (!selectedInvoice) {
                localStorage.removeItem('dashboard_autosave');
                setFormData(getInitialFormData(country));
                // Reset specialized states
                setSelectedToId('');
                setIsOtherTo(false);
                setSelectedFromId('');
                setIsOtherFrom(false);
                setClientType('company');
                setBankDetails({
                    bankName: '',
                    accountNumber: '',
                    accountHolderName: '',
                    ifscCode: '',
                    branchName: '',
                    accountType: ''
                });
                setShowTaxToggle(false);

                // Re-default From Company
                if (FROM_COMPANIES.length > 0) {
                    handleFromCompanyChange(FROM_COMPANIES[0].id);
                }
            } else {
                // If editing, clear selection to go back to "New" mode
                clearSelection();
            }
            setPreviewInvoice(null);
            setIsSaving(false);
        } catch (error) {
            setIsSaving(false);
            // Keep preview open so user can try again or go back to edit
            console.error("Save error:", error);
            // alert is handled by Dashboard/onSave usually, but we keep isSaving false to re-enable button
        }
    };

    // Calculation Logic
    const subTotal = (formData.services || []).reduce((sum, s) => sum + Math.round((s.hours * s.rate) * 100) / 100, 0);
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
            <div className="bg-white rounded-3xl border border-gray-100 p-6 grid grid-cols-1 md:grid-cols-4 gap-6 relative z-40">
                <div>
                    <label className={labelClasses}>Invoice Number</label>
                    <input type="text" value={formData.invoiceNumber || ''} readOnly className={`${inputClasses(false)} bg-gray-100 text-gray-500`} />
                </div>
                <div>
                    <label className={labelClasses}>PO Number <span className="text-red-500">*</span></label>
                    <input type="text" name="poNumber" value={formData.poNumber || ''} onChange={handleChange} className={inputClasses(!!errors.poNumber)} placeholder="Enter PO Number" />
                    {errors.poNumber && <p className="mt-1 text-xs text-red-500">{errors.poNumber}</p>}
                </div>
                <div>
                    <label className={labelClasses}>Date</label>
                    <input type="date" name="date" value={formData.date || ''} onChange={handleChange} className={inputClasses(!!errors.date)} />
                </div>
                <div>
                    <label className={labelClasses}>Due Date</label>
                    <input
                        type="date"
                        value={formData.date ? new Date(new Date(formData.date).setDate(new Date(formData.date).getDate() + 45)).toISOString().split('T')[0] : ''}
                        readOnly
                        className={`${inputClasses(false)} bg-gray-100 text-gray-500`}
                    />
                </div>
            </div>

            {/* 1. Header & Configuration */}
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-sm border border-gray-100 relative z-30">
                <div className="px-8 py-5 border-b border-gray-100 flex items-center gap-3">
                    <div className="h-8 w-1 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full"></div>
                    <h3 className="text-lg font-bold text-gray-900">Invoice Configuration</h3>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
                    {/* FROM Dropdown */}
                    <div>
                        <label className={labelClasses}>From (Sender Company) <span className="text-red-500">*</span></label>
                        <CustomDropdown
                            value={selectedFromId}
                            onChange={handleFromCompanyChange}
                            onDelete={handleDeleteSender}
                            placeholder="Select Company..."
                            className={inputClasses(!!errors.fromCompany)}
                            options={[
                                ...visibleFromCompanies.map(c => ({
                                    id: c.id,
                                    label: `${c.companyName} (${c.currency})`,
                                    group: ''
                                })),
                                ...visibleDynamicSenders.map(c => ({
                                    id: `dynamic-from-${c.companyName}`,
                                    label: c.companyName,
                                    group: ''
                                })),
                                { id: 'other', label: 'Others...', group: '' }
                            ]}
                            canDeleteIds={[
                                ...visibleFromCompanies.map(c => c.id),
                                ...visibleDynamicSenders.map(c => `dynamic-from-${c.companyName}`)
                            ]}
                        />

                        {/* Manual entry for FROM if "Other" or dynamic company is selected */}
                        {(isOtherFrom || (selectedFromId && selectedFromId.startsWith('dynamic-from-'))) && (
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
                                            const dynamicPrefix = generateDynamicPrefix(val);
                                            setFormData(prev => ({
                                                ...prev,
                                                company: val,
                                                companyInfo: {
                                                    ...prev.companyInfo!,
                                                    companyName: val,
                                                    invoiceFormat: dynamicPrefix
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
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <ImageUpload
                                        value={customLogoFile}
                                        onChange={(file) => {
                                            setCustomLogoFile(file);
                                            // Optional: handle immediate preview if needed, 
                                            // but state 'customLogoFile' is enough for save
                                        }}
                                        onRemoveExisting={() => {
                                            setFormData(prev => ({
                                                ...prev,
                                                companyInfo: prev.companyInfo ? {
                                                    ...prev.companyInfo,
                                                    companyLogoUrl: ''
                                                } : prev.companyInfo
                                            }));
                                        }}
                                        label="Company Logo"
                                        existingImageUrl={formData.companyInfo?.companyLogoUrl}
                                    />
                                    <ImageUpload
                                        value={customSignatureFile}
                                        onChange={setCustomSignatureFile}
                                        onRemoveExisting={() => {
                                            setFormData(prev => ({
                                                ...prev,
                                                signatureUrl: ''
                                            }));
                                        }}
                                        label="Authorized Signature"
                                        existingImageUrl={formData.signatureUrl}
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

                        {/* From Email Field - Added below From Company */}
                        <div className="mt-4">
                            <label className={labelClasses}>From Email <span className="text-red-500">*</span></label>
                            <input
                                type="email"
                                name="fromEmail"
                                value={formData.fromEmail || ''}
                                onChange={handleChange}
                                placeholder="Enter From Email address"
                                className={inputClasses(!!errors.fromEmail)}
                            />
                            {errors.fromEmail && <p className="mt-1 text-xs text-red-500">{errors.fromEmail}</p>}
                        </div>
                    </div>

                    {/* TO Dropdown */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className={labelClasses}>To (Client) <span className="text-red-500">*</span></label>
                            {/* Client Type Radio Buttons */}
                            <div className="flex gap-4">
                                <label className="inline-flex items-center cursor-pointer">
                                    <input
                                        type="radio"
                                        className="form-radio text-blue-600 h-4 w-4"
                                        name="clientType"
                                        value="company"
                                        checked={clientType === 'company'}
                                        onChange={() => {
                                            setClientType('company');

                                            // Check availability
                                            const available = [...visibleToCompanies, ...visibleDynamicCompanies];
                                            if (available.length === 0) {
                                                setSelectedToId('');
                                                setIsOtherTo(true); // Auto-show inputs
                                            } else {
                                                setSelectedToId('');
                                                setIsOtherTo(false); // Default to dropdown
                                            }

                                            // Reset to Sender defaults (including Bank Details)
                                            if (selectedFromId) {
                                                handleFromCompanyChange(selectedFromId);
                                                setFormData(prev => ({ ...prev, clientType: 'company' }));
                                            } else {
                                                setFormData(prev => ({ ...prev, country: 'india', clientType: 'company' }));
                                            }
                                        }}
                                    />
                                    <span className="ml-2 text-sm text-gray-700">Company</span>
                                </label>
                                <label className="inline-flex items-center cursor-pointer">
                                    <input
                                        type="radio"
                                        className="form-radio text-blue-600 h-4 w-4"
                                        name="clientType"
                                        value="employee"
                                        checked={clientType === 'employee'}
                                        onChange={() => {
                                            setClientType('employee');

                                            // Check availability (including dummy data)
                                            const available = [...TO_EMPLOYEES, ...visibleDynamicEmployees];
                                            if (available.length === 0) {
                                                setSelectedToId('');
                                                setIsOtherTo(true); // Auto-show inputs
                                            } else {
                                                setSelectedToId('');
                                                setIsOtherTo(false); // Default to dropdown
                                            }

                                            setFormData(prev => ({
                                                ...prev,
                                                employeeName: '',
                                                employeeEmail: '',
                                                employeeAddress: '',
                                                employeeMobile: '',
                                                country: 'japan',
                                                clientType: 'employee'
                                            }));
                                            setBankDetails({
                                                bankName: '',
                                                accountNumber: '',
                                                accountHolderName: '',
                                                ifscCode: '',
                                                swiftCode: '',
                                                branchName: '',
                                                branchCode: '',
                                                accountType: ''
                                            });
                                        }}
                                    />
                                    <span className="ml-2 text-sm text-gray-700">Employee</span>
                                </label>
                            </div>
                        </div>



                        {(() => {
                            const availableCompanies = [...visibleToCompanies, ...visibleDynamicCompanies.filter(c => clientType === 'company')];
                            const availableEmployees = [...TO_EMPLOYEES, ...visibleDynamicEmployees.filter(c => clientType === 'employee')];
                            const hasOptions = clientType === 'company' ? availableCompanies.length > 0 : availableEmployees.length > 0;

                            return (
                                <>
                                    {/* Dropdown - Show only if options exist */}
                                    {hasOptions && (
                                        <CustomDropdown
                                            value={selectedToId}
                                            onChange={handleToClientChange}
                                            onDelete={handleDeleteClient}
                                            placeholder={`Select ${clientType === 'company' ? 'Company' : 'Employee'}...`}
                                            className={inputClasses(false)}
                                            options={[
                                                ...(clientType === 'company' ? visibleToCompanies : TO_EMPLOYEES).map(c => ({
                                                    id: c.id,
                                                    label: c.companyName + (clientType === 'company' && (c as any).country ? ` (${(c as any).country})` : ''),
                                                    group: ''
                                                })),
                                                ...visibleDynamicCompanies.filter(c => clientType === 'company').map(c => ({
                                                    id: c.id,
                                                    label: c.companyName,
                                                    group: ''
                                                })),
                                                ...(clientType === 'employee' ? visibleDynamicEmployees : []).map(c => ({
                                                    id: c.id,
                                                    label: c.companyName,
                                                    group: ''
                                                })),
                                                { id: 'other', label: 'Others...', group: '' }
                                            ]}
                                            canDeleteIds={[
                                                ...visibleToCompanies.map(c => c.id),
                                                ...visibleDynamicCompanies.map(c => c.id),
                                                ...visibleDynamicEmployees.map(c => c.id)
                                            ]}
                                        />
                                    )}

                                    {/* Manual entry - Show if NO options exist OR "Other" is selected */}
                                    {(!hasOptions || isOtherTo) && (
                                        <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-500 mb-1">{clientType === 'company' ? 'Company Name' : 'Employee Name'}</label>
                                                <input
                                                    type="text"
                                                    name="employeeName"
                                                    placeholder={`Enter ${clientType === 'company' ? 'company' : 'employee'} name`}
                                                    className={inputClasses(!!errors.employeeName)}
                                                    value={formData.employeeName}
                                                    onChange={handleChange}
                                                />
                                                {errors.employeeName && <p className="mt-1 text-xs text-red-500">{errors.employeeName}</p>}
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-500 mb-1">{clientType === 'company' ? 'Company Email' : 'Employee Email'}</label>
                                                <input
                                                    type="email"
                                                    name="employeeEmail"
                                                    placeholder={`Enter ${clientType === 'company' ? 'company' : 'employee'} email`}
                                                    className={inputClasses(!!errors.employeeEmail)}
                                                    value={formData.employeeEmail}
                                                    onChange={handleChange}
                                                />
                                                {errors.employeeEmail && <p className="mt-1 text-xs text-red-500">{errors.employeeEmail}</p>}
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-500 mb-1">{clientType === 'company' ? 'Company Address' : 'Employee Address'} <span className="text-red-500">*</span></label>
                                                <textarea
                                                    name="employeeAddress"
                                                    placeholder={`Enter ${clientType === 'company' ? 'company' : 'employee'} address`}
                                                    className={inputClasses(!!errors.employeeAddress)}
                                                    rows={2}
                                                    value={formData.employeeAddress}
                                                    onChange={handleChange}
                                                />
                                                {errors.employeeAddress && <p className="mt-1 text-xs text-red-500">{errors.employeeAddress}</p>}
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-500 mb-1">{clientType === 'company' ? 'Company Phone' : 'Employee Phone'} <span className="text-red-500">*</span></label>
                                                <input
                                                    type="text"
                                                    name="employeeMobile"
                                                    placeholder={`Enter ${clientType === 'company' ? 'company' : 'employee'} phone`}
                                                    className={inputClasses(!!errors.employeeMobile)}
                                                    value={formData.employeeMobile}
                                                    onChange={handleChange}
                                                />
                                                {errors.employeeMobile && <p className="mt-1 text-xs text-red-500">{errors.employeeMobile}</p>}
                                            </div>
                                        </div>
                                    )}
                                </>
                            );
                        })()}
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

            {/* 2. Bank Details (Managed via Separate Screen) */}
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-sm border border-gray-100 relative z-20 overflow-hidden">
                <div className="px-8 py-5 border-b border-gray-100 flex items-center justify-between gap-3 bg-gray-50/50">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-1 bg-gradient-to-b from-green-500 to-emerald-600 rounded-full"></div>
                        <h3 className="text-lg font-bold text-gray-900">Bank Details</h3>
                    </div>
                    {availableBankAccounts.length > 0 && (
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-gray-600">Quick Select:</label>
                            <select
                                value={selectedBankAccountId}
                                onChange={(e) => {
                                    const accountId = e.target.value;
                                    setSelectedBankAccountId(accountId);
                                    const account = availableBankAccounts.find(a => a.id === accountId);
                                    if (account) {
                                        setBankDetails({
                                            bankName: account.bankName,
                                            accountNumber: account.accountNumber,
                                            accountHolderName: account.accountHolderName,
                                            ifscCode: account.ifscCode,
                                            swiftCode: account.swiftCode,
                                            branchName: account.branchName,
                                            branchCode: account.branchCode,
                                            accountType: account.accountType
                                        } as BankDetails);
                                    }
                                }}
                                className="text-sm border-gray-200 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 p-2 border bg-white shadow-sm"
                            >
                                <option value="">Select from my accounts...</option>
                                {availableBankAccounts.map(acc => (
                                    <option key={acc.id} value={acc.id}>{acc.bankName} - {acc.accountNumber}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
                <div className="p-6">
                    <BankDetailsForm
                        data={{ ...bankDetails, branchName: bankDetails.branchName || '', branchCode: bankDetails.branchCode || '', accountType: bankDetails.accountType || '' }}
                        onChange={(newData) => setBankDetails({
                            ...newData,
                            branchName: newData.branchName || '',
                            accountType: newData.accountType || ''
                        })}
                        errors={{}}
                        country={country}
                    />
                    <p className="text-xs text-gray-400 mt-4 px-2 italic">
                        * Use the Bank Accounts screen to manage and save these details for reuse across invoices.
                    </p>
                </div>
            </div>

            {/* 4. Services */}
            <div className="bg-white rounded-3xl border border-gray-100 p-6 relative z-10">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-gray-900">Services <span className="text-red-500">*</span></h3>
                    <button type="button" onClick={addService} className="text-blue-600 font-semibold text-sm hover:underline">+ Add Item</button>
                </div>
                {
                    formData.services?.map((service, index) => (
                        <div key={service.id || index} className="grid grid-cols-12 gap-4 mb-4 items-end border-b border-gray-50 pb-4 last:border-0">
                            <div className="col-span-6">
                                <label className={labelClasses}>Description <span className="text-red-500">*</span></label>
                                <input type="text" value={service.description} onChange={(e) => handleServiceChange(index, 'description', e.target.value)} className={inputClasses(!!errors[`service-${index}-description`])} />
                            </div>
                            <div className="col-span-2">
                                <label className={labelClasses}>Hours <span className="text-red-500">*</span></label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={service.hours}
                                    onWheel={(e) => (e.target as HTMLElement).blur()}
                                    onChange={(e) => handleServiceChange(index, 'hours', parseFloat(e.target.value))}
                                    className={inputClasses(!!errors[`service-${index}-hours`])}
                                />
                            </div>
                            <div className="col-span-3">
                                <label className={labelClasses}>Rate ({getCurrencySymbol(country)}) <span className="text-red-500">*</span></label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={service.rate}
                                    onWheel={(e) => (e.target as HTMLElement).blur()}
                                    onChange={(e) => handleServiceChange(index, 'rate', parseFloat(e.target.value))}
                                    className={inputClasses(!!errors[`service-${index}-rate`])}
                                />
                            </div>
                            <div className="col-span-1 pb-2">
                                <button type="button" onClick={() => removeService(index)} className="text-red-500 hover:bg-red-50 p-2 rounded-full">🗑️</button>
                            </div>
                        </div>
                    ))
                }
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
                                    <input type="number" name="cgstRate" value={formData.cgstRate} onWheel={(e) => (e.target as HTMLElement).blur()} onChange={handleChange} className={inputClasses(false)} />
                                </div>
                                <div>
                                    <label className={labelClasses}>SGST (%)</label>
                                    <input type="number" name="sgstRate" value={formData.sgstRate} onWheel={(e) => (e.target as HTMLElement).blur()} onChange={handleChange} className={inputClasses(false)} />
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-100 shadow-sm w-fit">
                                    <span className={`text-sm font-medium ${!showTaxToggle ? 'text-blue-600' : 'text-gray-400'}`}>No Tax</span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const newState = !showTaxToggle;
                                            setShowTaxToggle(newState);
                                            setFormData(prev => ({ ...prev, taxRate: newState ? 10 : 0 }));
                                        }}
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
                                            onWheel={(e) => (e.target as HTMLElement).blur()}
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
                        <div className="border-t pt-2 mt-2">
                            {(() => {
                                const cgst = country === 'india' ? Math.round((subTotal * (formData.cgstRate || 0) / 100) * 100) / 100 : 0;
                                const sgst = country === 'india' ? Math.round((subTotal * (formData.sgstRate || 0) / 100) * 100) / 100 : 0;
                                const taxAmount = country === 'india'
                                    ? (cgst + sgst)
                                    : (showTaxToggle ? Math.round((subTotal * ((formData.taxRate || 0) / 100)) * 100) / 100 : 0);
                                const totalBeforeRound = subTotal + taxAmount;
                                const roundedTotal = Math.round(totalBeforeRound);
                                const roundOff = roundedTotal - totalBeforeRound;

                                return (
                                    <>
                                        <p className="text-sm text-gray-500">Round Off: {formatCurrency(roundOff, country)}</p>
                                        <p className="text-xl font-bold text-gray-800">Grand Total: {formatCurrency(roundedTotal, country)}</p>
                                    </>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-4">
                {selectedInvoice && <button type="button" onClick={clearSelection} className="px-6 py-2 border rounded-xl">Cancel</button>}
                <button
                    type="submit"
                    disabled={isSaving}
                    className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                    {isSaving ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            <span>Saving...</span>
                        </>
                    ) : (
                        <span>{selectedInvoice ? 'Save Changes' : 'Create Invoice'}</span>
                    )}
                </button>
            </div>

            {/* Preview Overlay */}
            {
                showPreview && previewInvoice && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] overflow-y-auto p-4 md:p-8 flex items-start justify-center">
                        <div className="bg-gray-100 rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 my-8">
                            {/* Preview Header */}
                            <div className="bg-white px-8 py-4 border-b border-gray-200 flex justify-between items-center sticky top-0 z-10">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Invoice Preview</h2>
                                    <p className="text-xs text-gray-500">Please review the details before finalizing</p>
                                </div>
                                <button
                                    onClick={() => setShowPreview(false)}
                                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Preview Content */}
                            <div className="p-8">
                                <div className="bg-white shadow-lg rounded-xl overflow-hidden scale-[0.98] origin-top transform transition-transform">
                                    <InvoiceLayout {...mapInvoiceToLayoutProps(previewInvoice)} />
                                </div>
                            </div>

                            {/* Preview Footer */}
                            <div className="bg-white px-8 py-6 border-t border-gray-200 flex flex-col sm:flex-row justify-center gap-4">
                                <button
                                    type="button"
                                    onClick={() => setShowPreview(false)}
                                    className="px-10 py-3.5 border-2 border-gray-200 text-gray-700 rounded-2xl font-bold hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                    </svg>
                                    Back to Edit
                                </button>
                                <button
                                    type="button"
                                    onClick={handleConfirmSave}
                                    disabled={isSaving}
                                    className="px-12 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl font-bold hover:from-blue-700 hover:to-indigo-800 shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isSaving ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <span>Confirm & Create</span>
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </form>
    );
};

const mapInvoiceToLayoutProps = (invoice: Invoice) => {
    const subTotal = (invoice.services || []).reduce((sum, s) => sum + (s.hours * s.rate), 0);
    const taxAmount = (invoice.finalAmount || 0) - (invoice.roundOff || 0) - subTotal;

    // Determine if it's Vision AI for specific branding
    const isVisionAI = invoice.companyInfo?.companyName === 'Vision AI LLC';
    let logoToUse = invoice.companyInfo?.companyLogoUrl || '';
    if (isVisionAI && (!logoToUse || (!logoToUse.startsWith('data:') && !logoToUse.startsWith('http')))) {
        logoToUse = VISION_AI_LOGO_BASE64;
    }

    return {
        invoiceNumber: invoice.invoiceNumber,
        poNumber: invoice.poNumber,
        date: invoice.date,
        dueDate: invoice.dueDate,
        from: {
            name: invoice.companyInfo?.companyName || invoice.company || '',
            address: invoice.companyInfo?.companyAddress ? invoice.companyInfo.companyAddress.split(/[\n,]+/).map(s => s.trim()).filter(Boolean) : [],
            gstin: '',
            phone: '',
            email: invoice.fromEmail || ''
        },
        billTo: {
            name: invoice.employeeName,
            email: invoice.employeeEmail,
            phone: invoice.employeeMobile,
            address: invoice.employeeAddress
        },
        items: (invoice.services || []).map((s, idx) => ({
            sno: idx + 1,
            description: s.description,
            hours: s.hours,
            unitPrice: s.rate,
            amount: s.hours * s.rate
        })),
        subtotal: subTotal,
        taxRate: invoice.taxRate || (invoice.cgstRate || 0) + (invoice.sgstRate || 0),
        taxAmount: taxAmount,
        grandTotal: invoice.finalAmount || 0,
        roundOff: invoice.roundOff,
        bankDetails: {
            bankName: invoice.companyInfo?.bankDetails?.bankName || '',
            accountName: invoice.companyInfo?.bankDetails?.accountHolderName || '',
            accountNumber: invoice.companyInfo?.bankDetails?.accountNumber || '',
            ifsc: invoice.companyInfo?.bankDetails?.ifscCode || '',
            swiftCode: invoice.companyInfo?.bankDetails?.swiftCode,
            branchName: invoice.companyInfo?.bankDetails?.branchName || '',
            branchCode: invoice.companyInfo?.bankDetails?.branchCode || '',
            accountType: invoice.companyInfo?.bankDetails?.accountType || ''
        },
        country: invoice.country as any,
        cgstRate: invoice.cgstRate,
        sgstRate: invoice.sgstRate,
        logoUrl: logoToUse,
        stampUrl: isVisionAI ? visionAiStamp : undefined,
        isVisionAI: isVisionAI
    };
};
