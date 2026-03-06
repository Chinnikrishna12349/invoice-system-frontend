package com.invoiceapp.service;

import com.invoiceapp.entity.BankAccount;
import com.invoiceapp.repository.BankAccountRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class BankAccountService {

    @Autowired
    private BankAccountRepository bankAccountRepository;

    public List<BankAccount> getBankAccountsByUserId(String userId) {
        if (userId == null || userId.isEmpty()) {
            return bankAccountRepository.findAll();
        }
        return bankAccountRepository.findByUserId(userId);
    }

    public BankAccount saveBankAccount(BankAccount bankAccount) {
        bankAccount.setCreatedAt(LocalDateTime.now());
        bankAccount.setUpdatedAt(LocalDateTime.now());
        return bankAccountRepository.save(bankAccount);
    }

    public BankAccount updateBankAccount(String id, BankAccount bankAccountData) {
        BankAccount bankAccount = bankAccountRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Bank account not found with id: " + id));

        bankAccount.setBankName(bankAccountData.getBankName());
        bankAccount.setAccountNumber(bankAccountData.getAccountNumber());
        bankAccount.setAccountHolderName(bankAccountData.getAccountHolderName());
        bankAccount.setIfscCode(bankAccountData.getIfscCode());
        bankAccount.setSwiftCode(bankAccountData.getSwiftCode());
        bankAccount.setBankCode(bankAccountData.getBankCode());
        bankAccount.setBranchName(bankAccountData.getBranchName());
        bankAccount.setBranchCode(bankAccountData.getBranchCode());
        bankAccount.setAccountType(bankAccountData.getAccountType());
        bankAccount.setUpdatedAt(LocalDateTime.now());

        return bankAccountRepository.save(bankAccount);
    }

    public void deleteBankAccount(String id) {
        bankAccountRepository.deleteById(id);
    }

    public BankAccount getBankAccountById(String id) {
        return bankAccountRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Bank account not found with id: " + id));
    }
}
