import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { bankAccountService, BankAccount } from '../services/bankAccountService';
import { BankDetailsForm } from '../components/BankDetailsForm';

const BankAccountsPage: React.FC = () => {
    const { user } = useAuth();
    const [accounts, setAccounts] = useState<BankAccount[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [currentAccount, setCurrentAccount] = useState<Partial<BankAccount>>({});
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchAccounts();
    }, [user?.id]);

    const fetchAccounts = async () => {
        if (!user?.id) return;
        try {
            setIsLoading(true);
            const data = await bankAccountService.getAll(user.id);
            setAccounts(data);
        } catch (err) {
            setError('Failed to fetch bank accounts');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAdd = () => {
        setCurrentAccount({
            bankName: '',
            accountNumber: '',
            accountHolderName: '',
            ifscCode: '',
            branchName: '',
            branchCode: '',
            accountType: 'Savings',
            userId: user?.id
        });
        setIsEditing(true);
    };

    const handleEdit = (account: BankAccount) => {
        setCurrentAccount(account);
        setIsEditing(true);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this bank account?')) return;
        try {
            await bankAccountService.delete(id);
            setSuccess('Bank account deleted successfully');
            fetchAccounts();
        } catch (err) {
            setError('Failed to delete bank account');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            if (currentAccount.id) {
                await bankAccountService.update(currentAccount.id, currentAccount);
                setSuccess('Bank account updated successfully');
            } else {
                await bankAccountService.save(currentAccount as Omit<BankAccount, 'id'>);
                setSuccess('Bank account added successfully');
            }
            setIsEditing(false);
            fetchAccounts();
        } catch (err) {
            setError('Failed to save bank account');
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white">Bank Accounts</h1>
                    <p className="text-indigo-100 mt-1">Manage your bank details for invoices</p>
                </div>
                <button
                    onClick={handleAdd}
                    className="bg-white text-indigo-600 px-6 py-2 rounded-xl font-bold shadow-lg hover:bg-indigo-50 transition-all flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Bank Account
                </button>
            </div>

            {error && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-r-xl shadow-md">
                    {error}
                </div>
            )}

            {success && (
                <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded-r-xl shadow-md">
                    {success}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {accounts.map((account) => (
                    <div key={account.id} className="bg-white/95 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/20 hover:scale-[1.02] transition-transform">
                        <div className="flex justify-between items-start mb-4">
                            <div className="bg-indigo-100 p-3 rounded-2xl text-indigo-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                </svg>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => handleEdit(account)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                </button>
                                <button onClick={() => handleDelete(account.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-1">{account.bankName}</h3>
                        <p className="text-gray-500 text-sm mb-4">{account.accountType}</p>

                        <div className="space-y-2 text-sm text-gray-600 border-t pt-4">
                            <div className="flex justify-between">
                                <span>Account Number:</span>
                                <span className="font-mono font-semibold">{account.accountNumber}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Holder Name:</span>
                                <span className="font-semibold">{account.accountHolderName}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>{account.swiftCode ? 'SWIFT' : 'IFSC'}:</span>
                                <span className="font-mono font-semibold">{account.swiftCode || account.ifscCode}</span>
                            </div>
                        </div>
                    </div>
                ))}

                {accounts.length === 0 && !isEditing && (
                    <div className="col-span-full py-20 text-center bg-white/10 backdrop-blur-sm rounded-3xl border border-white/20">
                        <svg className="w-16 h-16 text-white/50 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v20m4-4H4m16 0h-4m-10 6h12a2 2 0 002-2V8a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <p className="text-white text-xl">No bank accounts added yet</p>
                        <button onClick={handleAdd} className="mt-4 text-white underline hover:text-indigo-200">
                            Add your first account
                        </button>
                    </div>
                )}
            </div>

            {isEditing && (
                <div className="fixed inset-0 z-50 overflow-y-auto px-4 py-6 sm:px-0">
                    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setIsEditing(false)}></div>
                    <div className="relative mx-auto max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                        <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="text-xl font-bold text-gray-900">
                                {currentAccount.id ? 'Edit Bank Account' : 'Add New Bank Account'}
                            </h3>
                            <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-gray-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-8">
                            <BankDetailsForm
                                data={currentAccount as any}
                                onChange={(data) => setCurrentAccount({ ...currentAccount, ...data })}
                            />
                            <div className="mt-8 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsEditing(false)}
                                    className="px-6 py-2 border rounded-xl text-gray-600 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200"
                                >
                                    Save Account
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BankAccountsPage;
