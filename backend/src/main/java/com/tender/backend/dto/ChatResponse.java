package com.tender.backend.dto;

import com.tender.backend.model.AIConversation;
import java.time.LocalDateTime;

public record ChatResponse(
        Long id,
        Long tenderId,
        String role,
        String message,
        String provider,
        Boolean fallbackUsed,
        LocalDateTime createdAt
) {
    public static ChatResponse from(AIConversation conversation) {
        return new ChatResponse(
                conversation.getId(),
                conversation.getTender() == null ? null : conversation.getTender().getId(),
                conversation.getRole(),
                conversation.getMessage(),
                conversation.getProvider(),
                conversation.getFallbackUsed(),
                conversation.getCreatedAt()
        );
    }
}
