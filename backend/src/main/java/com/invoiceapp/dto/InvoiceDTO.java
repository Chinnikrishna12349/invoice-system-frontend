package com.invoiceapp.dto;

import com.invoiceapp.entity.ServiceItem;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.data.annotation.Transient;
import java.util.List;

public class InvoiceDTO {
    private String id;
    @NotBlank(message = "Invoice number is required")
    private String invoiceNumber;
    @NotBlank(message = "Date is required")
    private String date;
    private String dueDate; // Added due date
    private String poNumber; // Added PO Number
    private String company; // Added company field for sender identification
    private String fromEmail; // Added From Email field
    private String clientType; // Added clientType
    @NotBlank(message = "Employee name is required")
    private String employeeName;
    @NotBlank(message = "Employee email is required")
    @Email(message = "Email should be valid")
    private String employeeEmail;
    @NotBlank(message = "Employee address is required")
    private String employeeAddress;
    @NotBlank(message = "Employee mobile is required")
    private String employeeMobile;
    @NotNull(message = "Services list is required")
    private List<ServiceItem> services;
    @NotNull(message = "Tax rate is required")
    private Double taxRate;
    private Double cgstRate;
    private Double sgstRate;
    private String createdAt;
    private String updatedAt;
    private String country;
    private String userId; // For data isolation
    private com.invoiceapp.dto.CompanyInfoDTO companyInfo; // Snapshot
    private Boolean showConsumptionTax;
    private Double roundOff;
    private Double finalAmount;
    private String signatureUrl; // Added for custom signature

    public Double getRoundOff() {
        return roundOff;
    }

    public void setRoundOff(Double roundOff) {
        this.roundOff = roundOff;
    }

    public Double getFinalAmount() {
        return finalAmount;
    }

    public void setFinalAmount(Double finalAmount) {
        this.finalAmount = finalAmount;
    }

    @Transient
    private byte[] pdfContent;

    public InvoiceDTO() {
    }

    public InvoiceDTO(String id, String invoiceNumber, String date, String employeeName,
            String employeeEmail, String employeeAddress, String employeeMobile,
            List<ServiceItem> services, Double taxRate, String createdAt, String updatedAt) {
        this.id = id;
        this.invoiceNumber = invoiceNumber;
        this.date = date;
        this.employeeName = employeeName;
        this.employeeEmail = employeeEmail;
        this.employeeAddress = employeeAddress;
        this.employeeMobile = employeeMobile;
        this.services = services;
        this.taxRate = taxRate;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getInvoiceNumber() {
        return invoiceNumber;
    }

    public void setInvoiceNumber(String invoiceNumber) {
        this.invoiceNumber = invoiceNumber;
    }

    public String getDate() {
        return date;
    }

    public void setDate(String date) {
        this.date = date;
    }

    public String getDueDate() {
        return dueDate;
    }

    public void setDueDate(String dueDate) {
        this.dueDate = dueDate;
    }

    public String getPoNumber() {
        return poNumber;
    }

    public void setPoNumber(String poNumber) {
        this.poNumber = poNumber;
    }

    public String getFromEmail() {
        return fromEmail;
    }

    public void setFromEmail(String fromEmail) {
        this.fromEmail = fromEmail;
    }

    public String getClientType() {
        return clientType;
    }

    public void setClientType(String clientType) {
        this.clientType = clientType;
    }

    public String getEmployeeName() {
        return employeeName;
    }

    public void setEmployeeName(String employeeName) {
        this.employeeName = employeeName;
    }

    public String getEmployeeEmail() {
        return employeeEmail;
    }

    public void setEmployeeEmail(String employeeEmail) {
        this.employeeEmail = employeeEmail;
    }

    public String getEmployeeAddress() {
        return employeeAddress;
    }

    public void setEmployeeAddress(String employeeAddress) {
        this.employeeAddress = employeeAddress;
    }

    public String getEmployeeMobile() {
        return employeeMobile;
    }

    public void setEmployeeMobile(String employeeMobile) {
        this.employeeMobile = employeeMobile;
    }

    public List<ServiceItem> getServices() {
        return services;
    }

    public void setServices(List<ServiceItem> services) {
        this.services = services;
    }

    public Double getTaxRate() {
        return taxRate;
    }

    public void setTaxRate(Double taxRate) {
        this.taxRate = taxRate;
    }

    public Double getCgstRate() {
        return cgstRate;
    }

    public void setCgstRate(Double cgstRate) {
        this.cgstRate = cgstRate;
    }

    public Double getSgstRate() {
        return sgstRate;
    }

    public void setSgstRate(Double sgstRate) {
        this.sgstRate = sgstRate;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }

    public String getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(String updatedAt) {
        this.updatedAt = updatedAt;
    }

    public Double getSubTotal() {
        if (services == null)
            return 0.0;
        // Replicating frontend's individual row rounding: Math.round(hours * rate *
        // 100)/100.0
        return services.stream().mapToDouble(s -> {
            double hrs = s.getHours() != null ? s.getHours() : 0.0;
            double rt = s.getRate() != null ? s.getRate() : 0.0;
            return Math.round((hrs * rt) * 100.0) / 100.0;
        }).sum();
    }

    public Double getTaxAmount() {
        if ("india".equalsIgnoreCase(country)) {
            double cgst = (cgstRate != null ? cgstRate : 0.0);
            double sgst = (sgstRate != null ? sgstRate : 0.0);
            return Math.round(getSubTotal() * (cgst / 100.0) * 100.0) / 100.0 +
                    Math.round(getSubTotal() * (sgst / 100.0) * 100.0) / 100.0;
        }
        // For Japan, only calculate tax if showConsumptionTax is true
        if ("japan".equalsIgnoreCase(country) && (showConsumptionTax == null || !showConsumptionTax)) {
            return 0.0;
        }
        double tr = (taxRate != null ? taxRate : 0.0);
        return Math.round(getSubTotal() * (tr / 100.0) * 100.0) / 100.0;
    }

    public Double getGrandTotal() {
        if (finalAmount != null) {
            return finalAmount; // Trust the frontend's final math directly
        }
        double subAndTax = getSubTotal() + getTaxAmount();
        double rOff = (roundOff != null ? roundOff : 0.0);
        return subAndTax + rOff;
    }

    public byte[] getPdfContent() {
        return pdfContent;
    }

    public void setPdfContent(byte[] pdfContent) {
        this.pdfContent = pdfContent;
    }

    public String getCompanyName() {
        if (companyInfo != null && companyInfo.getCompanyName() != null) {
            return companyInfo.getCompanyName();
        }
        return "Your Company Name";
    }

    public String getCompany() {
        return company;
    }

    public void setCompany(String company) {
        this.company = company;
    }

    public String getCountry() {
        return country;
    }

    public void setCountry(String country) {
        this.country = country;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public com.invoiceapp.dto.CompanyInfoDTO getCompanyInfo() {
        return companyInfo;
    }

    public void setCompanyInfo(com.invoiceapp.dto.CompanyInfoDTO companyInfo) {
        this.companyInfo = companyInfo;
    }

    public Boolean getShowConsumptionTax() {
        return showConsumptionTax;
    }

    public void setShowConsumptionTax(Boolean showConsumptionTax) {
        this.showConsumptionTax = showConsumptionTax;
    }

    public String getSignatureUrl() {
        return signatureUrl;
    }

    public void setSignatureUrl(String signatureUrl) {
        this.signatureUrl = signatureUrl;
    }
}
