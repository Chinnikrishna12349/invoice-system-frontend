package com.invoiceapp.controller;

import com.invoiceapp.dto.*;
import com.invoiceapp.service.AuthService;
import com.invoiceapp.service.JwtService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @Autowired
    private JwtService jwtService;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@Valid @RequestBody LoginRequest loginRequest) {
        try {
            // Additional validation
            if (loginRequest.getEmail() == null || loginRequest.getEmail().trim().isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(ApiResponse.error("Validation failed", "Email is required"));
            }
            if (loginRequest.getPassword() == null || loginRequest.getPassword().trim().isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(ApiResponse.error("Validation failed", "Password is required"));
            }

            LoginResponse response = authService.login(loginRequest);
            return ResponseEntity.ok(ApiResponse.success("Login successful", response));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Authentication failed", e.getMessage()));
        } catch (Exception e) {
            System.out.println("Login error: " + e.getClass().getName() + ": " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Login failed", e.getMessage()));
        }
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Object>> handleValidationExceptions(MethodArgumentNotValidException ex) {
        BindingResult bindingResult = ex.getBindingResult();
        StringBuilder errorMessage = new StringBuilder();
        for (FieldError error : bindingResult.getFieldErrors()) {
            if (errorMessage.length() > 0) {
                errorMessage.append(", ");
            }
            errorMessage.append(error.getField()).append(": ").append(error.getDefaultMessage());
        }
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error("Validation failed", errorMessage.toString()));
    }

    @PostMapping(value = "/signup", consumes = { "multipart/form-data" }, produces = { "application/json" })
    public ResponseEntity<ApiResponse<SignupResponse>> signup(
            @RequestParam(value = "email", required = false) String email,
            @RequestParam(value = "password", required = false) String password,
            @RequestParam(value = "name", required = false) String name,
            @RequestParam(value = "companyName", required = false) String companyName,
            @RequestParam(value = "companyAddress", required = false) String companyAddress,
            @RequestParam(value = "companyLogo", required = false) MultipartFile companyLogo,
            @RequestParam(value = "bankName", required = false) String bankName,
            @RequestParam(value = "accountNumber", required = false) String accountNumber,
            @RequestParam(value = "accountHolderName", required = false) String accountHolderName,
            @RequestParam(value = "ifscCode", required = false) String ifscCode,
            @RequestParam(value = "branchName", required = false) String branchName,
            @RequestParam(value = "branchCode", required = false) String branchCode,
            @RequestParam(value = "accountType", required = false) String accountType,
            @RequestParam(value = "invoiceFormat", required = false) String invoiceFormat) {
        try {
            // Log received parameters for debugging (without sensitive data)
            System.out.println("Signup request received:");
            System.out.println("Email: "
                    + (email != null && !email.isEmpty() ? email.substring(0, Math.min(3, email.length())) + "***"
                            : "null/empty"));
            System.out.println("Name: " + (name != null ? name : "null"));
            System.out.println("CompanyName: " + (companyName != null ? companyName : "null"));
            System.out.println("BankName: " + (bankName != null ? bankName : "null"));
            System.out.println("Has logo: " + (companyLogo != null && !companyLogo.isEmpty()));

            // Collect all validation errors
            java.util.List<String> validationErrors = new java.util.ArrayList<>();

            // Validate required fields
            if (email == null || email.trim().isEmpty()) {
                validationErrors.add("Email is required");
            }
            if (password == null || password.trim().isEmpty()) {
                validationErrors.add("Password is required");
            }
            if (name == null || name.trim().isEmpty()) {
                validationErrors.add("Name is required");
            }
            if (companyName == null || companyName.trim().isEmpty()) {
                validationErrors.add("Company name is required");
            }
            if (companyAddress == null || companyAddress.trim().isEmpty()) {
                validationErrors.add("Company address is required");
            }
            if (bankName == null || bankName.trim().isEmpty()) {
                validationErrors.add("Bank name is required");
            }
            if (accountNumber == null || accountNumber.trim().isEmpty()) {
                validationErrors.add("Account number is required");
            }
            if (accountHolderName == null || accountHolderName.trim().isEmpty()) {
                validationErrors.add("Account holder name is required");
            }
            if (ifscCode == null || ifscCode.trim().isEmpty()) {
                validationErrors.add("IFSC code is required");
            }

            // Return all validation errors at once
            if (!validationErrors.isEmpty()) {
                String errorMessage = String.join(", ", validationErrors);
                System.err.println("Validation errors: " + errorMessage);
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(ApiResponse.error("Validation failed", errorMessage));
            }

            // Build SignupRequest
            SignupRequest signupRequest = new SignupRequest();
            signupRequest.setEmail(email.trim());
            signupRequest.setPassword(password);
            signupRequest.setName(name.trim());
            signupRequest.setCompanyName(companyName.trim());
            signupRequest.setCompanyAddress(companyAddress.trim());
            signupRequest.setCompanyLogo(companyLogo);
            signupRequest.setInvoiceFormat(
                    invoiceFormat != null && !invoiceFormat.trim().isEmpty() ? invoiceFormat.trim() : "INV-"); // Default
                                                                                                               // format
                                                                                                               // if not
                                                                                                               // provided

            BankDetailsDTO bankDetails = new BankDetailsDTO();
            bankDetails.setBankName(bankName.trim());
            bankDetails.setAccountNumber(accountNumber.trim());
            bankDetails.setAccountHolderName(accountHolderName.trim());
            bankDetails.setIfscCode(ifscCode.trim());
            if (branchName != null && !branchName.trim().isEmpty()) {
                bankDetails.setBranchName(branchName.trim());
            }
            if (branchCode != null && !branchCode.trim().isEmpty()) {
                bankDetails.setBranchCode(branchCode.trim());
            }
            if (accountType != null && !accountType.trim().isEmpty()) {
                bankDetails.setAccountType(accountType.trim());
            }
            signupRequest.setBankDetails(bankDetails);

            SignupResponse response = authService.signup(signupRequest);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success("Signup successful", response));
        } catch (IllegalArgumentException e) {
            System.err.println("Signup validation error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Signup failed", e.getMessage()));
        } catch (Exception e) {
            System.err.println("Signup error: " + e.getMessage());
            e.printStackTrace(); // Log the full error for debugging
            String errorMsg = e.getMessage() != null ? e.getMessage() : "An unexpected error occurred";
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Signup failed", errorMsg));
        }
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        System.out.println("API: GET /health request received");
        Map<String, Object> health = new java.util.HashMap<>();
        health.put("status", "UP");
        health.put("service", "Auth Service");
        health.put("timestamp", System.currentTimeMillis());
        return ResponseEntity.ok(health);
    }

    @GetMapping("/company-info")
    public ResponseEntity<ApiResponse<com.invoiceapp.dto.CompanyInfoDTO>> getCompanyInfo(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            System.out.println("API: GET /company-info request received");
            // Extract token from Authorization header
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("Unauthorized", "Missing or invalid authorization token"));
            }

            String token = authHeader.substring(7); // Remove "Bearer " prefix

            // Extract userId from token
            String userId = jwtService.extractUserId(token);
            if (userId == null || jwtService.isTokenExpired(token)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("Unauthorized", "Invalid or expired token"));
            }

            // Find company info by userId
            java.util.Optional<com.invoiceapp.entity.CompanyInfo> companyInfoOpt = authService
                    .getCompanyInfoByUserId(userId);

            if (companyInfoOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("Not found", "Company information not found for this user"));
            }

            com.invoiceapp.entity.CompanyInfo companyInfo = companyInfoOpt.get();

            // Convert to DTO
            com.invoiceapp.dto.CompanyInfoDTO companyInfoDTO = new com.invoiceapp.dto.CompanyInfoDTO();
            companyInfoDTO.setId(companyInfo.getId());
            companyInfoDTO.setCompanyName(companyInfo.getCompanyName());
            companyInfoDTO.setCompanyAddress(companyInfo.getCompanyAddress());
            companyInfoDTO.setCompanyLogoUrl(companyInfo.getCompanyLogoUrl());
            companyInfoDTO.setFromEmail(companyInfo.getFromEmail());
            companyInfoDTO.setInvoiceFormat(companyInfo.getInvoiceFormat());

            // Convert BankDetails
            if (companyInfo.getBankDetails() != null) {
                com.invoiceapp.dto.BankDetailsDTO bankDetailsDTO = new com.invoiceapp.dto.BankDetailsDTO();
                bankDetailsDTO.setBankName(companyInfo.getBankDetails().getBankName());
                bankDetailsDTO.setAccountNumber(companyInfo.getBankDetails().getAccountNumber());
                bankDetailsDTO.setAccountHolderName(companyInfo.getBankDetails().getAccountHolderName());
                bankDetailsDTO.setIfscCode(companyInfo.getBankDetails().getIfscCode());
                bankDetailsDTO.setBranchName(companyInfo.getBankDetails().getBranchName());
                bankDetailsDTO.setBranchCode(companyInfo.getBankDetails().getBranchCode());
                bankDetailsDTO.setAccountType(companyInfo.getBankDetails().getAccountType());
                companyInfoDTO.setBankDetails(bankDetailsDTO);
            }

            return ResponseEntity.ok(ApiResponse.success("Company info retrieved", companyInfoDTO));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error",
                            e.getMessage() != null ? e.getMessage() : "Failed to retrieve company info"));
        }
    }

    @PutMapping(value = "/update-company", consumes = { "multipart/form-data" }, produces = { "application/json" })
    public ResponseEntity<ApiResponse<com.invoiceapp.dto.CompanyInfoDTO>> updateCompany(
            @RequestHeader(value = "Authorization") String authHeader,
            @RequestParam(value = "companyName", required = false) String companyName,
            @RequestParam(value = "companyAddress", required = false) String companyAddress,
            @RequestParam(value = "companyLogo", required = false) MultipartFile companyLogo,
            @RequestParam(value = "bankName", required = false) String bankName,
            @RequestParam(value = "accountNumber", required = false) String accountNumber,
            @RequestParam(value = "accountHolderName", required = false) String accountHolderName,
            @RequestParam(value = "ifscCode", required = false) String ifscCode,
            @RequestParam(value = "branchName", required = false) String branchName,
            @RequestParam(value = "branchCode", required = false) String branchCode,
            @RequestParam(value = "accountType", required = false) String accountType,
            @RequestParam(value = "invoiceFormat", required = false) String invoiceFormat,
            @RequestParam(value = "fromEmail", required = false) String fromEmail) {
        try {
            System.out.println("========================================");
            System.out.println("API: PUT /api/auth/update-company request received");
            System.out.println("Auth header present: " + (authHeader != null));
            System.out.println("========================================");
            // Extract token from Authorization header
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                System.out.println("API: Missing or invalid auth header");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("Unauthorized", "Missing or invalid authorization token"));
            }

            String token = authHeader.substring(7);
            String userId = jwtService.extractUserId(token);
            if (userId == null || jwtService.isTokenExpired(token)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("Unauthorized", "Invalid or expired token"));
            }

            // Build update request
            SignupRequest updateRequest = new SignupRequest();
            updateRequest.setCompanyName(companyName);
            updateRequest.setCompanyAddress(companyAddress);
            updateRequest.setCompanyLogo(companyLogo);
            updateRequest.setInvoiceFormat(invoiceFormat);
            updateRequest.setFromEmail(fromEmail);

            if (bankName != null) {
                BankDetailsDTO bankDetails = new BankDetailsDTO();
                bankDetails.setBankName(bankName);
                bankDetails.setAccountNumber(accountNumber);
                bankDetails.setAccountHolderName(accountHolderName);
                bankDetails.setIfscCode(ifscCode);
                bankDetails.setBranchName(branchName);
                bankDetails.setBranchCode(branchCode);
                bankDetails.setAccountType(accountType);
                updateRequest.setBankDetails(bankDetails);
            }

            com.invoiceapp.dto.CompanyInfoDTO response = authService.updateCompanyInfo(userId, updateRequest);
            return ResponseEntity.ok(ApiResponse.success("Company info updated successfully", response));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Update failed", e.getMessage()));
        }
    }

    @GetMapping("/update-company")
    public ResponseEntity<Map<String, String>> testUpdateCompanyEndpoint() {
        System.out.println("API: GET /api/auth/update-company test endpoint called");
        Map<String, String> response = new java.util.HashMap<>();
        response.put("status", "OK");
        response.put("message", "Update company endpoint is accessible");
        response.put("method", "Use PUT with multipart/form-data to update company info");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/validate")
    public ResponseEntity<ApiResponse<Boolean>> validateToken(@RequestBody Map<String, String> request) {
        try {
            String token = request.get("token");
            if (token == null || token.isEmpty()) {
                return ResponseEntity.ok(ApiResponse.success("Token validation result", false));
            }

            // Validate token - check if expired and extract userId
            String userId = jwtService.extractUserId(token);
            if (userId == null || jwtService.isTokenExpired(token)) {
                return ResponseEntity.ok(ApiResponse.success("Token validation result", false));
            }

            // Token is valid
            return ResponseEntity.ok(ApiResponse.success("Token validation result", true));
        } catch (Exception e) {
            // Any exception means token is invalid
            return ResponseEntity.ok(ApiResponse.success("Token validation result", false));
        }
    }

    @GetMapping("/debug/uploads")
    public ResponseEntity<Map<String, Object>> debugUploads() {
        Map<String, Object> result = new java.util.HashMap<>();
        try {
            java.io.File uploadsDir = new java.io.File("uploads").getAbsoluteFile();
            result.put("absolutePath", uploadsDir.getAbsolutePath());
            result.put("exists", uploadsDir.exists());
            result.put("isDirectory", uploadsDir.isDirectory());
            result.put("canRead", uploadsDir.canRead());
            result.put("canWrite", uploadsDir.canWrite());

            if (uploadsDir.exists() && uploadsDir.isDirectory()) {
                String[] files = uploadsDir.list();
                result.put("fileCount", files != null ? files.length : 0);
                result.put("files", files);
            }
        } catch (Exception e) {
            result.put("error", e.getMessage());
        }
        return ResponseEntity.ok(result);
    }

    @GetMapping("/check-logo")
    public ResponseEntity<Map<String, Object>> checkLogo(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        Map<String, Object> result = new java.util.HashMap<>();
        try {
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                result.put("error", "No authorization token provided");
                return ResponseEntity.ok(result);
            }

            String token = authHeader.substring(7);
            String userId = jwtService.extractUserId(token);
            if (userId == null) {
                result.put("error", "Invalid token");
                return ResponseEntity.ok(result);
            }

            java.util.Optional<com.invoiceapp.entity.CompanyInfo> companyOpt = authService
                    .getCompanyInfoByUserId(userId);
            if (companyOpt.isEmpty()) {
                result.put("error", "No company info found");
                return ResponseEntity.ok(result);
            }

            com.invoiceapp.entity.CompanyInfo companyInfo = companyOpt.get();
            String logoUrl = companyInfo.getCompanyLogoUrl();

            result.put("hasLogo", logoUrl != null);
            if (logoUrl != null) {
                result.put("logoUrlLength", logoUrl.length());
                result.put("isBase64", logoUrl.startsWith("data:"));
                result.put("isFilePath", logoUrl.startsWith("/uploads/"));
                result.put("logoUrlPrefix", logoUrl.length() > 50 ? logoUrl.substring(0, 50) + "..." : logoUrl);

                if (logoUrl.startsWith("/uploads/")) {
                    result.put("warning",
                            "Logo is stored as file path. This won't work on Render. Please re-upload your logo in Company Settings.");
                    result.put("needsReupload", true);
                } else if (logoUrl.startsWith("data:")) {
                    result.put("status", "OK - Logo is stored as Base64");
                    result.put("needsReupload", false);
                } else {
                    result.put("warning", "Unknown logo format");
                    result.put("needsReupload", true);
                }
            }
        } catch (Exception e) {
            result.put("error", e.getMessage());
        }
        return ResponseEntity.ok(result);
    }
}
