package com.tender.backend.repository;

import com.tender.backend.model.SavedTender;
import com.tender.backend.model.Tender;
import com.tender.backend.model.User;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SavedTenderRepository extends JpaRepository<SavedTender, Long> {
    boolean existsByUserAndTender(User user, Tender tender);

    List<SavedTender> findByUser(User user);

    Page<SavedTender> findByUser(User user, Pageable pageable);

    Optional<SavedTender> findByUserAndTender(User user, Tender tender);

    long countByUser(User user);

    List<SavedTender> findByUser_EmailOrderBySavedAtDesc(String userEmail);

    List<SavedTender> findTop5ByUser_EmailOrderBySavedAtDesc(String userEmail);
}
