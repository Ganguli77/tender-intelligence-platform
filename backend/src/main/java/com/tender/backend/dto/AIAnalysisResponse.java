package com.tender.backend.dto;

import com.tender.backend.model.AIAnalysis;
import java.time.LocalDateTime;
import java.util.List;

public record AIAnalysisResponse(
        Long id,
        Long tenderId,
        String summary,
        Integer opportunityScore,
        String riskLevel,
        List<String> eligibilityRequirements,
        List<String> requiredDocuments,
        List<String> riskFactors,
        List<String> recommendedActions,
        String recommendation,
        Integer winProbability,
        List<String> importantDeadlines,
        String provider,
        Boolean cacheHit,
        Boolean fallbackUsed,
        String errorMessage,
        LocalDateTime analyzedAt
) {
    public static AIAnalysisResponse from(AIAnalysis analysis) {
        return new AIAnalysisResponse(
                analysis.getId(),
                analysis.getTender() == null ? null : analysis.getTender().getId(),
                analysis.getSummary(),
                analysis.getOpportunityScore(),
                analysis.getRiskLevel(),
                analysis.getEligibilityRequirements(),
                analysis.getRequiredDocuments(),
                analysis.getRiskFactors(),
                analysis.getRecommendedActions(),
                analysis.getRecommendation(),
                analysis.getWinProbability(),
                analysis.getImportantDeadlines(),
                analysis.getProvider(),
                analysis.getCacheHit(),
                analysis.getFallbackUsed(),
                analysis.getErrorMessage(),
                analysis.getAnalyzedAt()
        );
    }
}
