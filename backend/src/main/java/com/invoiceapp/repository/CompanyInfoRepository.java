package com.invoiceapp.repository;

import com.invoiceapp.entity.CompanyInfo;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface CompanyInfoRepository extends MongoRepository<CompanyInfo, String> {
    Optional<CompanyInfo> findByUserId(String userId);
}

