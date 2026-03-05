
package com.invoiceapp.service;

import com.invoiceapp.dto.*;
import com.invoiceapp.entity.BankDetails;
import com.invoiceapp.entity.CompanyInfo;
import com.invoiceapp.entity.User;
import com.invoiceapp.repository.CompanyInfoRepository;
import com.invoiceapp.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CompanyInfoRepository companyInfoRepository;

    @Autowired
    private JwtService jwtService;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public LoginResponse login(LoginRequest loginRequest) {
        // Validate both email and password are provided
        if (loginRequest.getEmail() == null || loginRequest.getEmail().trim().isEmpty()) {
            throw new IllegalArgumentException("Email is required");
        }
        if (loginRequest.getPassword() == null || loginRequest.getPassword().trim().isEmpty()) {
            throw new IllegalArgumentException("Password is required");
        }

        // Find user by email
        Optional<User> userOpt = userRepository.findByEmail(loginRequest.getEmail().toLowerCase().trim());
        if (userOpt.isEmpty()) {
            throw new IllegalArgumentException("Invalid email or password");
        }

        User user = userOpt.get();

        // Verify password using bcrypt
        if (!passwordEncoder.matches(loginRequest.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Invalid email or password");
        }

        // Generate JWT token with only userId and email
        String token = jwtService.generateToken(user.getId(), user.getEmail());

        // Return only token, userId, and email (NOT full user object)
        return new LoginResponse(token, user.getId(), user.getEmail());
    }

    public SignupResponse signup(SignupRequest signupRequest) throws Exception {
        // Validate email and password are provided
        if (signupRequest.getEmail() == null || signupRequest.getEmail().trim().isEmpty()) {
            throw new IllegalArgumentException("Email is required");
        }
        if (signupRequest.getPassword() == null || signupRequest.getPassword().trim().isEmpty()) {
            throw new IllegalArgumentException("Password is required");
        }
        if (signupRequest.getPassword().length() < 6) {
            throw new IllegalArgumentException("Password must be at least 6 characters");
        }

        // Check if user already exists
        if (userRepository.existsByEmail(signupRequest.getEmail().toLowerCase().trim())) {
            throw new IllegalArgumentException("Email already registered");
        }

        // Create user
        User user = new User();
        user.setEmail(signupRequest.getEmail().toLowerCase().trim());
        user.setPassword(passwordEncoder.encode(signupRequest.getPassword()));
        user.setName(signupRequest.getName().trim());
        user.setCreatedAt(java.time.LocalDateTime.now());

        User savedUser = userRepository.save(user);

        // Store company logo as Base64 for permanent persistence on ephemeral
        // filesystems like Render
        String logoUrl = null;
        if (signupRequest.getCompanyLogo() != null && !signupRequest.getCompanyLogo().isEmpty()) {
            try {
                logoUrl = convertToBase64(signupRequest.getCompanyLogo());
                System.out.println("Logo converted to Base64, length: " + logoUrl.length());
            } catch (Exception e) {
                System.err.println("Failed to convert company logo to Base64: " + e.getMessage());
                e.printStackTrace();
                // Do NOT fallback to file storage - it won't persist on Render
                throw new RuntimeException("Failed to process company logo: " + e.getMessage(), e);
            }
        }

        // Create bank details entity
        BankDetails bankDetails = null;
        if (signupRequest.getBankDetails() != null) {
            BankDetailsDTO bankDto = signupRequest.getBankDetails();
            bankDetails = new BankDetails(
                    bankDto.getBankName(),
                    bankDto.getAccountNumber(),
                    bankDto.getAccountHolderName(),
                    bankDto.getIfscCode(),
                    bankDto.getBranchName(),
                    bankDto.getBranchCode(),
                    bankDto.getAccountType(),
                    bankDto.getSwiftCode());
        }

        // Create company info
        CompanyInfo companyInfo = new CompanyInfo();
        companyInfo.setUserId(savedUser.getId());
        companyInfo.setCompanyName(signupRequest.getCompanyName().trim());
        companyInfo.setCompanyAddress(signupRequest.getCompanyAddress().trim());
        companyInfo.setCompanyLogoUrl(logoUrl);
        companyInfo.setInvoiceFormat(signupRequest.getInvoiceFormat());
        companyInfo.setFromEmail(signupRequest.getFromEmail());
        companyInfo.setBankDetails(bankDetails);
        companyInfo.setCreatedAt(java.time.LocalDateTime.now());
        companyInfo.setUpdatedAt(java.time.LocalDateTime.now());

        CompanyInfo savedCompanyInfo = companyInfoRepository.save(companyInfo);

        // Update user with company info reference
        savedUser.setCompanyInfoId(savedCompanyInfo.getId());
        userRepository.save(savedUser);

        // Generate JWT token
        String token = jwtService.generateToken(savedUser.getId(), savedUser.getEmail());

        // Convert to DTOs
        BankDetailsDTO bankDetailsDTO = null;
        if (bankDetails != null) {
            bankDetailsDTO = new BankDetailsDTO();
            bankDetailsDTO.setBankName(bankDetails.getBankName());
            bankDetailsDTO.setAccountNumber(bankDetails.getAccountNumber());
            bankDetailsDTO.setAccountHolderName(bankDetails.getAccountHolderName());
            bankDetailsDTO.setIfscCode(bankDetails.getIfscCode());
            bankDetailsDTO.setBranchName(bankDetails.getBranchName());
            bankDetailsDTO.setBranchCode(bankDetails.getBranchCode());
            bankDetailsDTO.setAccountType(bankDetails.getAccountType());
            bankDetailsDTO.setSwiftCode(bankDetails.getSwiftCode());
        }

        CompanyInfoDTO companyInfoDTO = new CompanyInfoDTO();
        companyInfoDTO.setId(savedCompanyInfo.getId());
        companyInfoDTO.setCompanyName(savedCompanyInfo.getCompanyName());
        companyInfoDTO.setCompanyAddress(savedCompanyInfo.getCompanyAddress());
        companyInfoDTO.setCompanyLogoUrl(savedCompanyInfo.getCompanyLogoUrl());
        companyInfoDTO.setFromEmail(savedCompanyInfo.getFromEmail());
        companyInfoDTO.setInvoiceFormat(savedCompanyInfo.getInvoiceFormat());
        companyInfoDTO.setBankDetails(bankDetailsDTO);

        return new SignupResponse(token, savedUser.getId(), savedUser.getEmail(), companyInfoDTO);
    }

    public CompanyInfoDTO updateCompanyInfo(String userId, SignupRequest updateRequest) throws Exception {
        System.out.println("Updating company info for user: " + userId);
        Optional<CompanyInfo> companyOpt = companyInfoRepository.findByUserId(userId);
        if (companyOpt.isEmpty()) {
            throw new IllegalArgumentException("Company info not found");
        }

        CompanyInfo companyInfo = companyOpt.get();
        if (updateRequest.getCompanyName() != null)
            companyInfo.setCompanyName(updateRequest.getCompanyName().trim());
        if (updateRequest.getCompanyAddress() != null)
            companyInfo.setCompanyAddress(updateRequest.getCompanyAddress().trim());
        if (updateRequest.getInvoiceFormat() != null)
            companyInfo.setInvoiceFormat(updateRequest.getInvoiceFormat());
        if (updateRequest.getFromEmail() != null)
            companyInfo.setFromEmail(updateRequest.getFromEmail());

        if (updateRequest.getCompanyLogo() != null && !updateRequest.getCompanyLogo().isEmpty()) {
            companyInfo.setCompanyLogoUrl(convertToBase64(updateRequest.getCompanyLogo()));
        }

        if (updateRequest.getBankDetails() != null) {
            BankDetailsDTO bankDto = updateRequest.getBankDetails();
            BankDetails bankDetails = new BankDetails(
                    bankDto.getBankName(),
                    bankDto.getAccountNumber(),
                    bankDto.getAccountHolderName(),
                    bankDto.getIfscCode(),
                    bankDto.getBranchName(),
                    bankDto.getBranchCode(),
                    bankDto.getAccountType(),
                    bankDto.getSwiftCode());
            companyInfo.setBankDetails(bankDetails);
        }

        companyInfo.setUpdatedAt(java.time.LocalDateTime.now());
        CompanyInfo savedCompany = companyInfoRepository.save(companyInfo);

        // Convert to DTO
        CompanyInfoDTO dto = new CompanyInfoDTO();
        dto.setId(savedCompany.getId());
        dto.setCompanyName(savedCompany.getCompanyName());
        dto.setCompanyAddress(savedCompany.getCompanyAddress());
        dto.setCompanyLogoUrl(savedCompany.getCompanyLogoUrl());
        dto.setInvoiceFormat(savedCompany.getInvoiceFormat());
        dto.setFromEmail(savedCompany.getFromEmail());

        if (savedCompany.getBankDetails() != null) {
            BankDetailsDTO bankDto = new BankDetailsDTO();
            bankDto.setBankName(savedCompany.getBankDetails().getBankName());
            bankDto.setAccountNumber(savedCompany.getBankDetails().getAccountNumber());
            bankDto.setAccountHolderName(savedCompany.getBankDetails().getAccountHolderName());
            bankDto.setIfscCode(savedCompany.getBankDetails().getIfscCode());
            bankDto.setBranchName(savedCompany.getBankDetails().getBranchName());
            bankDto.setBranchCode(savedCompany.getBankDetails().getBranchCode());
            bankDto.setAccountType(savedCompany.getBankDetails().getAccountType());
            bankDto.setSwiftCode(savedCompany.getBankDetails().getSwiftCode());
            dto.setBankDetails(bankDto);
        }

        return dto;
    }

    private String convertToBase64(org.springframework.web.multipart.MultipartFile file) throws java.io.IOException {
        byte[] bytes = file.getBytes();
        String base64 = java.util.Base64.getEncoder().encodeToString(bytes);
        return "data:" + file.getContentType() + ";base64," + base64;
    }

    // Helper method to hash password
    public String hashPassword(String plainPassword) {
        return passwordEncoder.encode(plainPassword);
    }

    // Get company info by userId
    public java.util.Optional<com.invoiceapp.entity.CompanyInfo> getCompanyInfoByUserId(String userId) {
        return companyInfoRepository.findByUserId(userId);
    }
}
