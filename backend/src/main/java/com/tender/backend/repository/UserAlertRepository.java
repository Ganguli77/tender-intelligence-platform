package com.tender.backend.repository;

import com.tender.backend.model.UserAlert;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserAlertRepository extends JpaRepository<UserAlert, Long> {
    List<UserAlert> findByUserEmailOrderByCreatedAtDesc(String userEmail);

    List<UserAlert> findTop5ByUserEmailOrderByCreatedAtDesc(String userEmail);
}
