import React, { useRef, useState } from 'react';

interface ImageUploadProps {
    value: File | null;
    onChange: (file: File | null) => void;
    label: string;
    existingImageUrl?: string;
    accept?: string;
    maxSizeMB?: number;
    required?: boolean;
    error?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
    value,
    onChange,
    label,
    existingImageUrl,
    accept = 'image/*',
    maxSizeMB = 5,
    required = false,
    error,
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(null);

    const isShowingExisting = !preview && existingImageUrl && !value;
    const currentPreview = preview || (isShowingExisting ? existingImageUrl : null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) {
            onChange(null);
            setPreview(null);
            return;
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        // Validate file size
        const maxSizeBytes = maxSizeMB * 1024 * 1024;
        if (file.size > maxSizeBytes) {
            alert(`File size must be less than ${maxSizeMB}MB`);
            return;
        }

        onChange(file);

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleRemove = () => {
        onChange(null);
        setPreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
            </label>

            <div className="mt-1 flex items-center gap-4">
                <div className="flex-1">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept={accept}
                        onChange={handleFileChange}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    {error && (
                        <p className="mt-1 text-sm text-red-600">{error}</p>
                    )}
                </div>

                {currentPreview && (
                    <div className="relative">
                        <img
                            src={(() => {
                                if (currentPreview.startsWith('http') || currentPreview.startsWith('data:')) {
                                    return currentPreview;
                                }
                                const backendBase = import.meta.env?.VITE_API_URL?.replace('/api/invoices', '')
                                    || 'https://invoice-system-backend-owhd.onrender.com';
                                return `${backendBase}${currentPreview.startsWith('/') ? currentPreview : '/' + currentPreview}`;
                            })()}
                            alt="Preview"
                            className="h-16 w-16 object-contain rounded-lg border border-gray-300 bg-gray-50"
                        />
                        {(preview || value) && (
                            <button
                                type="button"
                                onClick={handleRemove}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 shadow-sm"
                            >
                                ×
                            </button>
                        )}
                    </div>
                )}
            </div>

            {value && !preview && (
                <p className="mt-1 text-sm text-gray-500">Selected: {value.name}</p>
            )}
        </div>
    );
};

