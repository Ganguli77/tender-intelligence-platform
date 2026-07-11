package com.tender.backend.dto;

public record TenderStatusDTO(
        long active,
        long closingSoon,
        long expired,
        int activePercentage
) {
}
