package com.tender.backend.repository;

import com.tender.backend.model.Tender;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface TenderRepository extends JpaRepository<Tender, Long>, JpaSpecificationExecutor<Tender> {
	List<Tender> findByOwnerEmailOrderByPublishedDateDesc(String ownerEmail);
}
