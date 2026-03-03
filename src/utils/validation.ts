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
