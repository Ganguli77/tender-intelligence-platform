package com.tender.backend.repository;

import com.tender.backend.model.AIAnalysis;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AIAnalysisRepository extends JpaRepository<AIAnalysis, Long> {
    Optional<AIAnalysis> findByTenderId(Long tenderId);

    long countByRiskLevelIgnoreCase(String riskLevel);

    long countByOpportunityScoreGreaterThanEqual(Integer opportunityScore);

    long countByOpportunityScoreBetween(Integer minScore, Integer maxScore);

    long countByOpportunityScoreLessThan(Integer opportunityScore);

    List<AIAnalysis> findTop5ByOpportunityScoreIsNotNullOrderByOpportunityScoreDesc();

    List<AIAnalysis> findTop5ByOrderByAnalyzedAtDesc();
}
