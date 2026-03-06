package com.invoiceapp.service;

import com.invoiceapp.dto.InvoiceDTO;
import com.invoiceapp.entity.Invoice;
import com.invoiceapp.repository.InvoiceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class InvoiceService {

    @Autowired
    private InvoiceRepository invoiceRepository;

    public InvoiceDTO createInvoice(InvoiceDTO invoiceDTO) {
        System.out.println("Creating new invoice: " + invoiceDTO.getInvoiceNumber());

        Invoice invoice = convertToEntity(invoiceDTO);
        // Let MongoDB generate the ID for new invoices
        invoice.setId(null);
        invoice.setCreatedAt(LocalDateTime.now());
        invoice.setUpdatedAt(LocalDateTime.now());

        Invoice savedInvoice = invoiceRepository.save(invoice);
        System.out.println("Invoice saved with ID: " + savedInvoice.getId());
        return convertToDTO(savedInvoice);
    }

    public InvoiceDTO updateInvoice(String id, InvoiceDTO invoiceDTO) {
        System.out.println("Updating invoice: " + id);

        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Invoice not found with id: " + id));

        invoice.setInvoiceNumber(invoiceDTO.getInvoiceNumber());
        invoice.setDate(invoiceDTO.getDate());
        invoice.setDueDate(invoiceDTO.getDueDate()); // Added due date mapping
        invoice.setPoNumber(invoiceDTO.getPoNumber()); // Added poNumber mapping
        invoice.setFromEmail(invoiceDTO.getFromEmail()); // Added fromEmail mapping
        invoice.setEmployeeName(invoiceDTO.getEmployeeName());
        invoice.setEmployeeEmail(invoiceDTO.getEmployeeEmail());
        invoice.setEmployeeAddress(invoiceDTO.getEmployeeAddress());
        invoice.setEmployeeMobile(invoiceDTO.getEmployeeMobile());
        invoice.setServices(invoiceDTO.getServices());
        invoice.setTaxRate(invoiceDTO.getTaxRate());
        invoice.setCgstRate(invoiceDTO.getCgstRate());
        invoice.setSgstRate(invoiceDTO.getSgstRate());
        invoice.setShowConsumptionTax(invoiceDTO.getShowConsumptionTax());
        invoice.setRoundOff(invoiceDTO.getRoundOff());
        invoice.setFinalAmount(invoiceDTO.getFinalAmount());
        invoice.setSignatureUrl(invoiceDTO.getSignatureUrl()); // Added signatureUrl mapping
        invoice.setCompany(invoiceDTO.getCompany()); // Added company mapping
        invoice.setUpdatedAt(LocalDateTime.now());

        invoice.setCountry(invoiceDTO.getCountry());
        invoice.setClientType(invoiceDTO.getClientType());

        // Map CompanyInfo DTO to Entity
        if (invoiceDTO.getCompanyInfo() != null) {
            com.invoiceapp.entity.CompanyInfo companyInfo = invoice.getCompanyInfo();
            if (companyInfo == null) {
                companyInfo = new com.invoiceapp.entity.CompanyInfo();
            }
            companyInfo.setId(invoiceDTO.getCompanyInfo().getId());
            companyInfo.setCompanyName(invoiceDTO.getCompanyInfo().getCompanyName());
            companyInfo.setCompanyAddress(invoiceDTO.getCompanyInfo().getCompanyAddress());
            companyInfo.setCompanyLogoUrl(invoiceDTO.getCompanyInfo().getCompanyLogoUrl());
            companyInfo.setInvoiceFormat(invoiceDTO.getCompanyInfo().getInvoiceFormat());
            companyInfo.setFromEmail(invoiceDTO.getCompanyInfo().getFromEmail());

            if (invoiceDTO.getCompanyInfo().getBankDetails() != null) {
                com.invoiceapp.entity.BankDetails bankDetails = companyInfo.getBankDetails();
                if (bankDetails == null) {
                    bankDetails = new com.invoiceapp.entity.BankDetails();
                }
                bankDetails.setBankName(invoiceDTO.getCompanyInfo().getBankDetails().getBankName());
                bankDetails.setAccountNumber(invoiceDTO.getCompanyInfo().getBankDetails().getAccountNumber());
                bankDetails.setAccountHolderName(invoiceDTO.getCompanyInfo().getBankDetails().getAccountHolderName());
                bankDetails.setIfscCode(invoiceDTO.getCompanyInfo().getBankDetails().getIfscCode());
                bankDetails.setBranchName(invoiceDTO.getCompanyInfo().getBankDetails().getBranchName());
                bankDetails.setBranchCode(invoiceDTO.getCompanyInfo().getBankDetails().getBranchCode());
                bankDetails.setAccountType(invoiceDTO.getCompanyInfo().getBankDetails().getAccountType());
                bankDetails.setSwiftCode(invoiceDTO.getCompanyInfo().getBankDetails().getSwiftCode());
                bankDetails.setBankCode(invoiceDTO.getCompanyInfo().getBankDetails().getBankCode());
                companyInfo.setBankDetails(bankDetails);
            }
            invoice.setCompanyInfo(companyInfo);
        }

        Invoice updatedInvoice = invoiceRepository.save(invoice);
        return convertToDTO(updatedInvoice);
    }

    public void deleteInvoice(String id) {
        System.out.println("Deleting invoice: " + id);
        invoiceRepository.deleteById(id);
    }

    public InvoiceDTO getInvoiceById(String id) {
        System.out.println("Fetching invoice: " + id);
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Invoice not found with id: " + id));
        return convertToDTO(invoice);
    }

    public List<InvoiceDTO> getAllInvoices(String userId) {
        System.out.println("Fetching all invoices for user: " + userId);
        if (userId == null || userId.isEmpty()) {
            return invoiceRepository.findAllByOrderByCreatedAtDesc()
                    .stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());
        }
        return invoiceRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<InvoiceDTO> getAllInvoices() {
        return getAllInvoices(null);
    }

    @Autowired
    private com.invoiceapp.repository.CompanyInfoRepository companyInfoRepository;

    public String getNextInvoiceNumber(String userId) {
        String format = "INV-"; // Default
        if (userId != null) {
            com.invoiceapp.entity.CompanyInfo companyInfo = companyInfoRepository.findByUserId(userId).orElse(null);
            if (companyInfo != null && companyInfo.getInvoiceFormat() != null) {
                format = companyInfo.getInvoiceFormat();
            }
        }

        long count = userId != null ? invoiceRepository.countByUserId(userId) : invoiceRepository.count();
        // If isolate is strictly enforced, we should rely on countByUserId.
        // Logic: count + 1.
        // e.g. 0 invoices -> count=0 -> next=1
        return format + (count + 1);
    }

    private Invoice convertToEntity(InvoiceDTO dto) {
        Invoice invoice = new Invoice();
        invoice.setId(dto.getId());
        invoice.setInvoiceNumber(dto.getInvoiceNumber());
        invoice.setDate(dto.getDate());
        invoice.setDueDate(dto.getDueDate()); // Added due date mapping
        invoice.setPoNumber(dto.getPoNumber()); // Added poNumber mapping
        invoice.setFromEmail(dto.getFromEmail()); // Added fromEmail mapping
        invoice.setEmployeeName(dto.getEmployeeName());
        invoice.setEmployeeEmail(dto.getEmployeeEmail());
        invoice.setEmployeeAddress(dto.getEmployeeAddress());
        invoice.setEmployeeMobile(dto.getEmployeeMobile());
        invoice.setServices(dto.getServices());
        invoice.setTaxRate(dto.getTaxRate());
        invoice.setCgstRate(dto.getCgstRate());
        invoice.setSgstRate(dto.getSgstRate());
        invoice.setShowConsumptionTax(dto.getShowConsumptionTax());
        invoice.setRoundOff(dto.getRoundOff());
        invoice.setFinalAmount(dto.getFinalAmount());
        invoice.setCountry(dto.getCountry());
        invoice.setUserId(dto.getUserId());
        invoice.setClientType(dto.getClientType()); // Added clientType mapping
        invoice.setSignatureUrl(dto.getSignatureUrl()); // Added signatureUrl mapping
        invoice.setCompany(dto.getCompany()); // Added company mapping
        invoice.setUserId(dto.getUserId());

        // Map CompanyInfo DTO to Entity
        if (dto.getCompanyInfo() != null) {
            com.invoiceapp.entity.CompanyInfo companyInfo = new com.invoiceapp.entity.CompanyInfo();
            companyInfo.setId(dto.getCompanyInfo().getId());
            companyInfo.setCompanyName(dto.getCompanyInfo().getCompanyName());
            companyInfo.setCompanyAddress(dto.getCompanyInfo().getCompanyAddress());
            companyInfo.setCompanyLogoUrl(dto.getCompanyInfo().getCompanyLogoUrl());
            companyInfo.setInvoiceFormat(dto.getCompanyInfo().getInvoiceFormat());
            companyInfo.setFromEmail(dto.getCompanyInfo().getFromEmail());

            if (dto.getCompanyInfo().getBankDetails() != null) {
                com.invoiceapp.entity.BankDetails bankDetails = new com.invoiceapp.entity.BankDetails();
                bankDetails.setBankName(dto.getCompanyInfo().getBankDetails().getBankName());
                bankDetails.setAccountNumber(dto.getCompanyInfo().getBankDetails().getAccountNumber());
                bankDetails.setAccountHolderName(dto.getCompanyInfo().getBankDetails().getAccountHolderName());
                bankDetails.setIfscCode(dto.getCompanyInfo().getBankDetails().getIfscCode());
                bankDetails.setBranchName(dto.getCompanyInfo().getBankDetails().getBranchName());
                bankDetails.setBranchCode(dto.getCompanyInfo().getBankDetails().getBranchCode());
                bankDetails.setAccountType(dto.getCompanyInfo().getBankDetails().getAccountType());
                bankDetails.setSwiftCode(dto.getCompanyInfo().getBankDetails().getSwiftCode()); // Map Swift Code
                bankDetails.setBankCode(dto.getCompanyInfo().getBankDetails().getBankCode()); // Map Bank Code
                companyInfo.setBankDetails(bankDetails);
            }
            invoice.setCompanyInfo(companyInfo);
        }

        return invoice;
    }

    private InvoiceDTO convertToDTO(Invoice entity) {
        InvoiceDTO dto = new InvoiceDTO();
        dto.setId(entity.getId());
        dto.setInvoiceNumber(entity.getInvoiceNumber());
        dto.setUserId(entity.getUserId());
        dto.setUserId(entity.getUserId());

        // Map CompanyInfo Entity to DTO
        if (entity.getCompanyInfo() != null) {
            com.invoiceapp.dto.CompanyInfoDTO companyInfoDTO = new com.invoiceapp.dto.CompanyInfoDTO();
            companyInfoDTO.setId(entity.getCompanyInfo().getId());
            companyInfoDTO.setCompanyName(entity.getCompanyInfo().getCompanyName());
            companyInfoDTO.setCompanyAddress(entity.getCompanyInfo().getCompanyAddress());
            companyInfoDTO.setCompanyLogoUrl(entity.getCompanyInfo().getCompanyLogoUrl());
            companyInfoDTO.setInvoiceFormat(entity.getCompanyInfo().getInvoiceFormat());
            companyInfoDTO.setFromEmail(entity.getCompanyInfo().getFromEmail());

            if (entity.getCompanyInfo().getBankDetails() != null) {
                com.invoiceapp.dto.BankDetailsDTO bankDetailsDTO = new com.invoiceapp.dto.BankDetailsDTO();
                bankDetailsDTO.setBankName(entity.getCompanyInfo().getBankDetails().getBankName());
                bankDetailsDTO.setAccountNumber(entity.getCompanyInfo().getBankDetails().getAccountNumber());
                bankDetailsDTO.setAccountHolderName(entity.getCompanyInfo().getBankDetails().getAccountHolderName());
                bankDetailsDTO.setIfscCode(entity.getCompanyInfo().getBankDetails().getIfscCode());
                bankDetailsDTO.setBranchName(entity.getCompanyInfo().getBankDetails().getBranchName());
                bankDetailsDTO.setBranchCode(entity.getCompanyInfo().getBankDetails().getBranchCode());
                bankDetailsDTO.setAccountType(entity.getCompanyInfo().getBankDetails().getAccountType());
                bankDetailsDTO.setSwiftCode(entity.getCompanyInfo().getBankDetails().getSwiftCode()); // Map Swift Code
                bankDetailsDTO.setBankCode(entity.getCompanyInfo().getBankDetails().getBankCode()); // Map Bank Code
                companyInfoDTO.setBankDetails(bankDetailsDTO);
            }
            dto.setCompanyInfo(companyInfoDTO);
        }

        dto.setDate(entity.getDate());
        dto.setDueDate(entity.getDueDate()); // Added due date mapping
        dto.setPoNumber(entity.getPoNumber()); // Added poNumber mapping
        dto.setFromEmail(entity.getFromEmail()); // Added fromEmail mapping
        dto.setEmployeeName(entity.getEmployeeName());
        dto.setEmployeeEmail(entity.getEmployeeEmail());
        dto.setEmployeeAddress(entity.getEmployeeAddress());
        dto.setEmployeeMobile(entity.getEmployeeMobile());
        dto.setServices(entity.getServices());
        dto.setTaxRate(entity.getTaxRate());
        dto.setCgstRate(entity.getCgstRate());
        dto.setSgstRate(entity.getSgstRate());
        dto.setShowConsumptionTax(entity.getShowConsumptionTax());
        dto.setRoundOff(entity.getRoundOff());
        dto.setFinalAmount(entity.getFinalAmount());
        dto.setCountry(entity.getCountry());
        dto.setClientType(entity.getClientType()); // Added clientType mapping
        dto.setSignatureUrl(entity.getSignatureUrl()); // Added signatureUrl mapping
        dto.setCompany(entity.getCompany()); // Added company mapping
        dto.setCreatedAt(entity.getCreatedAt() != null ? entity.getCreatedAt().toString() : null);
        dto.setUpdatedAt(entity.getUpdatedAt() != null ? entity.getUpdatedAt().toString() : null);
        return dto;
    }
}
