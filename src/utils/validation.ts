/**
 * Validates a company name against the allowed and disallowed characters.
 * Allowed characters: Alphabets (A–Z, a–z), Numbers (0–9), Space, &, ., ,, ', (, ), -, /
 * Not allowed characters: < > { } ; = | \ " @ # $ % ^ * !
 */
export const validateCompanyName = (name: string): boolean => {
    // Regex matches the allowed characters only.
    // Allowed: A-Za-z0-9, space, &, ., ,, ', (, ), -, /
    const allowedRegex = /^[A-Za-z0-9\s&.,'()/-]*$/;
    return allowedRegex.test(name);
};

export const COMPANY_NAME_VALIDATION_ERROR = "Company name contains invalid characters. Allowed: A-Z, 0-9, space, and & . , ' ( ) - /";

/**
 * Validates an employee name against the allowed characters.
 * Allowed characters: Alphabets (A–Z, a–z), Space
 * Not allowed characters: Numbers (0-9), Special characters
 */
export const validateEmployeeName = (name: string): boolean => {
    // Regex matches the allowed characters only: Alphabets and spaces.
    const allowedRegex = /^[A-Za-z\s]*$/;
    return allowedRegex.test(name);
};

export const EMPLOYEE_NAME_VALIDATION_ERROR = "Employee name should not contain special characters and digits. Only alphabets and spaces are allowed.";

export const validateEmail = (email: string | undefined): string | null => {
    if (!email || email.trim() === '') {
        return "Email is required";
    }

    // 3. Email containing spaces
    if (email.includes(' ')) {
        return "Email cannot contain spaces.";
    }

    // 6. Email exceeding maximum length
    if (email.length > 254) {
        return "Email is too long. Maximum allowed length is 254 characters.";
    }

    // 8. Email with consecutive dots
    if (email.includes('..')) {
        return "Email cannot contain consecutive dots.";
    }

    // 4. Email with multiple @ symbols
    const atCount = (email.match(/@/g) || []).length;
    if (atCount === 0) {
        return "Email must include a valid domain extension (e.g., .com, .org).";
    }
    if (atCount > 1) {
        return "Email must contain only one '@' symbol.";
    }

    // 7. Email starting/ending with special chars
    // Start/End characters cannot be '.', '_', or '@'
    const prohibitedStartEnd = ['.', '_', '@'];
    if (prohibitedStartEnd.includes(email[0]) || prohibitedStartEnd.includes(email[email.length - 1])) {
        return "Email cannot start or end with special characters.";
    }

    // 1. Prohibited special characters
    // Letters, numbers, '.', '_', '-', '+', and '@' are allowed
    if (/[^a-zA-Z0-9._@+-]/.test(email)) {
        return "Email contains invalid characters. Only letters, numbers, '.', '_', '-', '+', and '@' are allowed.";
    }

    // 2. Missing domain extension
    const parts = email.split('@');
    const domain = parts[1];
    if (!domain || !domain.includes('.') || domain.split('.').pop()!.length < 2) {
        return "Email must include a valid domain extension (e.g., .com, .org).";
    }

    // 5. Final standard format check
    const emailRegex = /^[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
        return "Email contains unsupported characters. Please use valid email format.";
    }

    return null;
};
