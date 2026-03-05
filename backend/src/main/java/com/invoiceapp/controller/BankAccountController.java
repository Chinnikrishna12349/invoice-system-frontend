package com.invoiceapp.controller;

import com.invoiceapp.entity.BankAccount;
import com.invoiceapp.service.BankAccountService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/bank-accounts")
public class BankAccountController {

    @Autowired
    private BankAccountService bankAccountService;

    @GetMapping
    public ResponseEntity<?> getBankAccounts(@RequestParam(required = false) String userId) {
        try {
            System.out.println("Fetching bank accounts for userId: " + userId);
            List<BankAccount> accounts = bankAccountService.getBankAccountsByUserId(userId);
            return ResponseEntity.ok(accounts);
        } catch (Exception e) {
            System.err.println("Error fetching bank accounts: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error fetching bank accounts: " + e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getBankAccountById(@PathVariable String id) {
        try {
            return ResponseEntity.ok(bankAccountService.getBankAccountById(id));
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error getting bank account: " + e.getMessage());
        }
    }

    @PostMapping
    public ResponseEntity<?> saveBankAccount(@RequestBody BankAccount bankAccount) {
        try {
            System.out.println("Saving bank account for userId: " + bankAccount.getUserId());
            BankAccount saved = bankAccountService.saveBankAccount(bankAccount);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            System.err.println("Error saving bank account: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error saving bank account: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateBankAccount(@PathVariable String id,
            @RequestBody BankAccount bankAccount) {
        try {
            return ResponseEntity.ok(bankAccountService.updateBankAccount(id, bankAccount));
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error updating bank account: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteBankAccount(@PathVariable String id) {
        try {
            bankAccountService.deleteBankAccount(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error deleting bank account: " + e.getMessage());
        }
    }
}
