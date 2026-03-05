package com.invoiceapp.repository;

import com.invoiceapp.entity.Invoice;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface InvoiceRepository extends MongoRepository<Invoice, String> {

    List<Invoice> findAllByOrderByCreatedAtDesc();

    Optional<Invoice> findByInvoiceNumber(String invoiceNumber);

    List<Invoice> findByEmployeeEmail(String email);

    List<Invoice> findByUserIdOrderByCreatedAtDesc(String userId);

    long countByUserId(String userId);
}
