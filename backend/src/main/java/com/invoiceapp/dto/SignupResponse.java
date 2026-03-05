package com.invoiceapp.dto;

public class SignupResponse {
    private String token; // JWT token
    private String userId;
    private String email;
    private CompanyInfoDTO companyInfo;
    
    public SignupResponse() {}
    
    public SignupResponse(String token, String userId, String email, CompanyInfoDTO companyInfo) {
        this.token = token;
        this.userId = userId;
        this.email = email;
        this.companyInfo = companyInfo;
    }
    
    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
    
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    
    public CompanyInfoDTO getCompanyInfo() { return companyInfo; }
    public void setCompanyInfo(CompanyInfoDTO companyInfo) { this.companyInfo = companyInfo; }
}

