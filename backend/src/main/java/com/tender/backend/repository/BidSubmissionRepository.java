package com.tender.backend.repository;

import com.tender.backend.model.BidSubmission;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BidSubmissionRepository extends JpaRepository<BidSubmission, Long> {
    List<BidSubmission> findByTender_IdOrderBySubmittedAtDesc(Long tenderId);
    Optional<BidSubmission> findByTender_IdAndSupplierEmail(Long tenderId, String supplierEmail);
}