import React from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    showCancel?: boolean;
    isLoading?: boolean;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, onConfirm, title, description, confirmText = 'Confirm', cancelText = 'Cancel', showCancel = true, isLoading = false }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md transform transition-all duration-300 animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-start">
                    <div className="shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
                        <span className="text-xl">{title.includes('✅') ? '✅' : title.includes('❌') ? '❌' : '⚠️'}</span>
                    </div>
                    <div className="ml-4 flex-1">
                        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
                        <p className="mt-2 text-sm text-gray-600">{description}</p>
                    </div>
                </div>
                
                <div className="mt-6 flex gap-3 sm:flex-row-reverse">
                    <button
                        type="button"
                        disabled={isLoading}
                        className="flex-1 inline-flex justify-center items-center gap-2 rounded-lg border border-transparent shadow-sm px-4 py-2.5 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={onConfirm}
                    >
                        {isLoading && (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        )}
                        {confirmText}
                    </button>
                    {showCancel && (
                        <button
                            type="button"
                            disabled={isLoading}
                            className="flex-1 inline-flex justify-center items-center rounded-lg border border-gray-300 shadow-sm px-4 py-2.5 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={onClose}
                        >
                            {cancelText}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};