package com.tender.backend.dto;

import java.time.LocalDateTime;

public record ActivityDTO(
        String id,
        String type,
        String title,
        String description,
        String timeAgo,
        LocalDateTime createdAt
) {
}
