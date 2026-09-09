/**
 * Validates a company name against the allowed and disallowed characters.
 * Allowed characters: Alphabets (A–Z, a–z), Numbers (0–9), Space, &, ., ,, ', (, ), -, /
 * Not allowed characters: < > { } ; = | \ " @ # $ % ^ * !
 */
export const validateCompanyName = (name: string): boolean => {
    // Regex matches the allowed characters only.
    // Allowed: Letters (including Japanese), Numbers, space, &, ., ,, ', (, ), -, /
    const allowedRegex = /^[\p{L}\p{N}\s&.,'()/\-]*$/u;
    return allowedRegex.test(name);
};

export const COMPANY_NAME_VALIDATION_ERROR = "Company name contains invalid characters. Allowed: Letters (including Japanese), Numbers, space, and & . , ' ( ) - /";

/**
 * Validates an employee name against the allowed characters.
 * Allowed characters: Alphabets (A–Z, a–z), Space
 * Not allowed characters: Numbers (0-9), Special characters
 */
export const validateEmployeeName = (name: string): boolean => {
    // Regex matches the allowed characters only: Letters (including Japanese) and spaces.
    const allowedRegex = /^[\p{L}\s]*$/u;
    return allowedRegex.test(name);
};

export const EMPLOYEE_NAME_VALIDATION_ERROR = "Employee name should not contain special characters and digits. Only letters (including Japanese) and spaces are allowed.";

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
        return "Please include an '@' in the email address (e.g., user@example.com).";
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

/**
 * Validates SWIFT/BIC code format (ISO 9362 standard).
 * 8 or 11 characters:
 * - 4 letters (Bank Code)
 * - 2 letters (Country Code)
 * - 2 alphanumeric (Location Code)
 * - 3 alphanumeric (Branch Code - optional for 11 chars)
 */
export const validateSwiftCode = (code: string | undefined, isRequired: boolean = false): string | null => {
    if (!code || !code.trim()) {
        return isRequired ? "SWIFT code is required." : null;
    }
    const clean = code.trim().toUpperCase();
    if (clean.length !== 8 && clean.length !== 11) {
        return "SWIFT/BIC code must be exactly 8 or 11 characters long.";
    }
    if (!/^[A-Z]{4}/.test(clean)) {
        return "Bank Code (first 4 characters of SWIFT) must contain letters only (A–Z).";
    }
    if (!/^[A-Z]{4}[A-Z]{2}/.test(clean)) {
        return "Country Code (characters 5–6 of SWIFT) must contain letters only (A–Z).";
    }
    if (!/^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}/.test(clean)) {
        return "Location Code (characters 7–8 of SWIFT) must be letters or numbers (A–Z, 0–9).";
    }
    if (clean.length === 11 && !/^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}[A-Z0-9]{3}$/.test(clean)) {
        return "Branch Code (characters 9–11 of SWIFT) must be letters or numbers (A–Z, 0–9).";
    }
    return null;
};
