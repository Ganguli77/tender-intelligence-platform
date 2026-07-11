package com.tender.backend.dto;

import com.tender.backend.model.AIAnalysis;
import com.tender.backend.model.Tender;
import java.time.LocalDate;

public record RecentTenderDTO(
        Long id,
        String title,
        String organization,
        String category,
        String location,
        String amount,
        LocalDate deadline,
        Integer opportunityScore,
        String riskLevel
) {
    public static RecentTenderDTO from(AIAnalysis analysis) {
        Tender tender = analysis.getTender();
        return new RecentTenderDTO(
                tender == null ? null : tender.getId(),
                tender == null ? "Untitled Tender" : tender.getTitle(),
                tender == null ? "Not specified" : tender.getOrganization(),
                tender == null ? "General" : tender.getCategory(),
                tender == null ? "Not specified" : tender.getLocation(),
                tender == null ? "Value on request" : tender.getAmount(),
                tender == null ? null : tender.getDeadline(),
                analysis.getOpportunityScore(),
                analysis.getRiskLevel()
        );
    }
}
