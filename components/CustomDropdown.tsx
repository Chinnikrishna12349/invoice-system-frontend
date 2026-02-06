import React, { useState, useRef, useEffect } from 'react';

interface DropdownOption {
    id: string;
    label: string;
    group?: string;
}

interface CustomDropdownProps {
    options: DropdownOption[];
    value: string;
    onChange: (value: string) => void;
    onDelete?: (id: string) => void;
    placeholder?: string;
    className?: string;
    canDeleteIds?: string[]; // IDs that can be deleted
}

export const CustomDropdown: React.FC<CustomDropdownProps> = ({
    options,
    value,
    onChange,
    onDelete,
    placeholder = 'Select...',
    className = '',
    canDeleteIds = []
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [hoveredId, setHoveredId] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(opt => opt.id === value);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (onDelete && canDeleteIds.includes(id)) {
            if (confirm('Are you sure you want to delete this company from the dropdown?')) {
                onDelete(id);
                if (value === id) {
                    onChange('');
                }
            }
        }
    };

    const handleSelect = (id: string) => {
        onChange(id);
        setIsOpen(false);
    };

    // Group options
    const groupedOptions: { [key: string]: DropdownOption[] } = {};
    options.forEach(opt => {
        const group = opt.group || 'default';
        if (!groupedOptions[group]) {
            groupedOptions[group] = [];
        }
        groupedOptions[group].push(opt);
    });

    return (
        <div ref={dropdownRef} className="relative">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full text-left px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white ${className}`}
            >
                {selectedOption ? selectedOption.label : placeholder}
                <svg
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {Object.entries(groupedOptions).map(([group, opts]) => (
                        <div key={group}>
                            {group !== 'default' && (
                                <div className="px-3 py-2 text-xs font-semibold text-gray-500 bg-gray-50 border-b border-gray-200">
                                    {group}
                                </div>
                            )}
                            {opts.map(opt => (
                                <div
                                    key={opt.id}
                                    className={`px-4 py-2 cursor-pointer hover:bg-blue-50 flex items-center justify-between ${value === opt.id ? 'bg-blue-100' : ''
                                        }`}
                                    onClick={() => handleSelect(opt.id)}
                                    onMouseEnter={() => setHoveredId(opt.id)}
                                    onMouseLeave={() => setHoveredId(null)}
                                >
                                    <span className="flex-1">{opt.label}</span>
                                    {canDeleteIds.includes(opt.id) && hoveredId === opt.id && (
                                        <button
                                            onClick={(e) => handleDelete(e, opt.id)}
                                            className="ml-2 p-1 text-red-500 hover:text-red-700 hover:bg-red-100 rounded"
                                            title="Delete this company"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
