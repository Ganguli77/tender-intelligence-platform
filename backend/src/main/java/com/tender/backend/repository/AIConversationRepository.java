package com.tender.backend.repository;

import com.tender.backend.model.AIConversation;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AIConversationRepository extends JpaRepository<AIConversation, Long> {
    List<AIConversation> findByTenderIdAndUserIdOrderByCreatedAtAsc(Long tenderId, Long userId);

    void deleteByTenderIdAndUserId(Long tenderId, Long userId);
}
