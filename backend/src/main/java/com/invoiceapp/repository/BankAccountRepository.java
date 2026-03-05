package com.invoiceapp.repository;

import com.invoiceapp.entity.BankAccount;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface BankAccountRepository extends MongoRepository<BankAccount, String> {
    List<BankAccount> findByUserId(String userId);
}
