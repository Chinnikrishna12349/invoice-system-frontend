import React, { useState, useEffect, useRef } from 'react';

export interface CustomDatePickerProps {
    name?: string;
    value?: string; // ISO format 'YYYY-MM-DD' or empty string
    onChange?: (e: { target: { name: string; value: string } }) => void;
    className?: string;
    hasError?: boolean;
    placeholder?: string;
    disabled?: boolean;
    readOnly?: boolean;
    minDate?: string; // 'YYYY-MM-DD'
    maxDate?: string; // 'YYYY-MM-DD'
    title?: string;
    id?: string;
}

// Helper: Convert YYYY-MM-DD -> DD/MM/YYYY
export const isoToDisplay = (isoStr?: string): string => {
    if (!isoStr) return '';
    const match = isoStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!match) return '';
    const [, y, m, d] = match;
    return `${d}/${m}/${y}`;
};

// Helper: Convert DD/MM/YYYY -> YYYY-MM-DD
export const displayToIso = (displayStr?: string): string => {
    if (!displayStr) return '';
    const match = displayStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (!match) return '';
    const [, d, m, y] = match;
    const day = d.padStart(2, '0');
    const month = m.padStart(2, '0');
    return `${y}-${month}-${day}`;
};

// Helper: Validate day, month, year
const isValidDateParts = (day: number, month: number, year: number): boolean => {
    if (year < 1900 || year > 2100) return false;
    if (month < 1 || month > 12) return false;
    const daysInMonth = new Date(year, month, 0).getDate();
    return day >= 1 && day <= daysInMonth;
};

const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS_OF_WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
    name = '',
    value = '',
    onChange,
    className = '',
    hasError = false,
    placeholder = 'DD/MM/YYYY',
    disabled = false,
    readOnly = false,
    minDate,
    maxDate,
    title,
    id
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState(() => isoToDisplay(value));

    // Calendar view state (year and month currently being viewed)
    const today = new Date();
    const [viewYear, setViewYear] = useState<number>(() => {
        if (value && value.match(/^\d{4}-\d{2}-\d{2}$/)) {
            return parseInt(value.split('-')[0], 10);
        }
        return today.getFullYear();
    });

    const [viewMonth, setViewMonth] = useState<number>(() => {
        if (value && value.match(/^\d{4}-\d{2}-\d{2}$/)) {
            return parseInt(value.split('-')[1], 10) - 1;
        }
        return today.getMonth();
    });

    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Sync input display when prop `value` changes externally
    useEffect(() => {
        const formatted = isoToDisplay(value);
        setInputValue(formatted);

        if (value && value.match(/^\d{4}-\d{2}-\d{2}$/)) {
            const [y, m] = value.split('-').map(num => parseInt(num, 10));
            setViewYear(y);
            setViewMonth(m - 1);
        }
    }, [value]);

    // Handle outside clicks to close popup
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleKeyDown);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen]);

    const notifyChange = (isoString: string) => {
        if (onChange) {
            onChange({
                target: {
                    name,
                    value: isoString
                }
            });
        }
    };

    // Handle manual keyboard input typing
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let text = e.target.value;
        // Keep only digits and slashes
        text = text.replace(/[^0-9/]/g, '');

        // Auto-insert slashes
        if (text.length === 2 && !text.includes('/')) {
            text = text + '/';
        } else if (text.length === 5 && (text.match(/\//g) || []).length === 1) {
            text = text + '/';
        }
        if (text.length > 10) {
            text = text.slice(0, 10);
        }

        setInputValue(text);

        if (text === '') {
            notifyChange('');
            return;
        }

        // If complete DD/MM/YYYY
        if (text.length === 10) {
            const parts = text.split('/');
            if (parts.length === 3) {
                const day = parseInt(parts[0], 10);
                const month = parseInt(parts[1], 10);
                const year = parseInt(parts[2], 10);

                if (isValidDateParts(day, month, year)) {
                    const iso = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    setViewYear(year);
                    setViewMonth(month - 1);
                    notifyChange(iso);
                }
            }
        }
    };

    const handleInputBlur = () => {
        // If incomplete or invalid on blur, reset to current valid value or notify
        if (inputValue && inputValue.length > 0 && inputValue.length < 10) {
            // Revert to known value
            setInputValue(isoToDisplay(value));
        }
    };

    const handleSelectDate = (day: number, month: number, year: number) => {
        const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        setInputValue(isoToDisplay(iso));
        notifyChange(iso);
        setIsOpen(false);
    };

    const handleTodayClick = () => {
        const now = new Date();
        const y = now.getFullYear();
        const m = now.getMonth();
        const d = now.getDate();
        setViewYear(y);
        setViewMonth(m);
        handleSelectDate(d, m, y);
    };

    const handleClearClick = () => {
        setInputValue('');
        notifyChange('');
        setIsOpen(false);
    };

    const handlePrevMonth = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (viewMonth === 0) {
            setViewMonth(11);
            setViewYear(viewYear - 1);
        } else {
            setViewMonth(viewMonth - 1);
        }
    };

    const handleNextMonth = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (viewMonth === 11) {
            setViewMonth(0);
            setViewYear(viewYear + 1);
        } else {
            setViewMonth(viewMonth + 1);
        }
    };

    // Calculate days grid for the current viewMonth & viewYear
    const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfWeek = (year: number, month: number) => new Date(year, month, 1).getDay();

    const daysInCurrentMonth = getDaysInMonth(viewYear, viewMonth);
    const firstDayIndex = getFirstDayOfWeek(viewYear, viewMonth); // 0 = Sunday
    const daysInPrevMonth = getDaysInMonth(viewYear, viewMonth - 1);

    // Selected Date breakdown
    let selYear: number | null = null;
    let selMonth: number | null = null;
    let selDay: number | null = null;
    if (value && value.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const parts = value.split('-').map(Number);
        selYear = parts[0];
        selMonth = parts[1] - 1;
        selDay = parts[2];
    }

    const todayDate = today.getDate();
    const todayMonth = today.getMonth();
    const todayYear = today.getFullYear();

    // Generate years for year selector dropdown (e.g., current year - 10 to current year + 15)
    const yearOptions: number[] = [];
    for (let y = todayYear - 10; y <= todayYear + 15; y++) {
        yearOptions.push(y);
    }

    return (
        <div ref={containerRef} className="relative w-full">
            <div className="relative flex items-center">
                <input
                    ref={inputRef}
                    id={id}
                    name={name}
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    onBlur={handleInputBlur}
                    placeholder={placeholder}
                    disabled={disabled}
                    readOnly={readOnly}
                    title={title}
                    className={`w-full pr-10 pl-3 py-2 text-sm bg-white border rounded-lg transition-all outline-none ${
                        hasError
                            ? 'border-2 border-red-500 bg-red-50 text-red-900 focus:ring-2 focus:ring-red-200'
                            : 'border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                    } ${disabled ? 'bg-gray-100 cursor-not-allowed opacity-70' : 'cursor-text'} ${className}`}
                />
                <button
                    type="button"
                    tabIndex={-1}
                    disabled={disabled || readOnly}
                    onClick={() => {
                        if (!disabled && !readOnly) {
                            setIsOpen(!isOpen);
                        }
                    }}
                    className="absolute right-2.5 p-1 text-gray-400 hover:text-blue-600 focus:outline-none transition-colors rounded"
                    title="Open calendar"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.8}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                    </svg>
                </button>
            </div>

            {/* Calendar Popover */}
            {isOpen && !disabled && !readOnly && (
                <div className="absolute z-50 mt-1.5 p-3.5 bg-white rounded-2xl shadow-2xl border border-gray-200 w-72 left-0 sm:left-auto right-auto animate-in fade-in zoom-in-95 duration-150 select-none">
                    {/* Month & Year Navigation Header */}
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
                        <button
                            type="button"
                            onClick={handlePrevMonth}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
                            title="Previous Month"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>

                        <div className="flex items-center gap-1.5">
                            {/* Month Select */}
                            <select
                                value={viewMonth}
                                onChange={(e) => setViewMonth(parseInt(e.target.value, 10))}
                                className="text-xs font-bold text-gray-800 bg-gray-50 border border-gray-200 rounded-md px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                            >
                                {MONTH_NAMES.map((m, idx) => (
                                    <option key={m} value={idx}>
                                        {m}
                                    </option>
                                ))}
                            </select>

                            {/* Year Select */}
                            <select
                                value={viewYear}
                                onChange={(e) => setViewYear(parseInt(e.target.value, 10))}
                                className="text-xs font-bold text-gray-800 bg-gray-50 border border-gray-200 rounded-md px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                            >
                                {yearOptions.map((y) => (
                                    <option key={y} value={y}>
                                        {y}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button
                            type="button"
                            onClick={handleNextMonth}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
                            title="Next Month"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>

                    {/* Weekday Headers */}
                    <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
                        {DAYS_OF_WEEK.map((d, i) => (
                            <div
                                key={d}
                                className={`text-[11px] font-semibold ${
                                    i === 0 || i === 6 ? 'text-gray-400' : 'text-gray-500'
                                }`}
                            >
                                {d}
                            </div>
                        ))}
                    </div>

                    {/* Days Grid */}
                    <div className="grid grid-cols-7 gap-1 text-center">
                        {/* Days of Previous Month */}
                        {Array.from({ length: firstDayIndex }).map((_, i) => {
                            const prevDay = daysInPrevMonth - firstDayIndex + i + 1;
                            const prevMonthIdx = viewMonth === 0 ? 11 : viewMonth - 1;
                            const prevYearVal = viewMonth === 0 ? viewYear - 1 : viewYear;
                            return (
                                <button
                                    key={`prev-${i}`}
                                    type="button"
                                    onClick={() => handleSelectDate(prevDay, prevMonthIdx, prevYearVal)}
                                    className="h-8 w-8 mx-auto text-xs text-gray-300 hover:bg-gray-100 rounded-lg flex items-center justify-center transition-all"
                                >
                                    {prevDay}
                                </button>
                            );
                        })}

                        {/* Days of Current Month */}
                        {Array.from({ length: daysInCurrentMonth }).map((_, i) => {
                            const day = i + 1;
                            const isSelected =
                                selYear === viewYear && selMonth === viewMonth && selDay === day;
                            const isToday =
                                todayYear === viewYear && todayMonth === viewMonth && todayDate === day;

                            return (
                                <button
                                    key={`cur-${day}`}
                                    type="button"
                                    onClick={() => handleSelectDate(day, viewMonth, viewYear)}
                                    className={`h-8 w-8 mx-auto text-xs rounded-lg flex items-center justify-center font-medium transition-all ${
                                        isSelected
                                            ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/30 scale-105'
                                            : isToday
                                            ? 'border border-blue-500 text-blue-600 font-bold hover:bg-blue-50'
                                            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                                    }`}
                                >
                                    {day}
                                </button>
                            );
                        })}

                        {/* Days of Next Month to fill out 35/42 cells */}
                        {Array.from({
                            length: (7 - ((firstDayIndex + daysInCurrentMonth) % 7)) % 7
                        }).map((_, i) => {
                            const nextDay = i + 1;
                            const nextMonthIdx = viewMonth === 11 ? 0 : viewMonth + 1;
                            const nextYearVal = viewMonth === 11 ? viewYear + 1 : viewYear;
                            return (
                                <button
                                    key={`next-${i}`}
                                    type="button"
                                    onClick={() => handleSelectDate(nextDay, nextMonthIdx, nextYearVal)}
                                    className="h-8 w-8 mx-auto text-xs text-gray-300 hover:bg-gray-100 rounded-lg flex items-center justify-center transition-all"
                                >
                                    {nextDay}
                                </button>
                            );
                        })}
                    </div>

                    {/* Quick Footer Action Buttons */}
                    <div className="flex items-center justify-between pt-3 mt-2 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={handleClearClick}
                            className="text-xs font-semibold text-gray-500 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 transition-colors"
                        >
                            Clear
                        </button>
                        <span className="text-[11px] font-mono text-gray-400">DD/MM/YYYY</span>
                        <button
                            type="button"
                            onClick={handleTodayClick}
                            className="text-xs font-semibold text-blue-600 hover:text-blue-700 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                        >
                            Today
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
