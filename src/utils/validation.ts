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
