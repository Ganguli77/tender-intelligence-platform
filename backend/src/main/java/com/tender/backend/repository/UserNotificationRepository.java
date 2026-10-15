package com.tender.backend.repository;

import com.tender.backend.model.UserNotification;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserNotificationRepository extends JpaRepository<UserNotification, Long> {
    List<UserNotification> findByRecipientEmailOrderByCreatedAtDesc(String recipientEmail);
    Optional<UserNotification> findByIdAndRecipientEmail(Long id, String recipientEmail);
}