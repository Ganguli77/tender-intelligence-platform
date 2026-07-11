package com.tender.backend.service;

import com.tender.backend.model.AIAnalysis;
import com.tender.backend.model.Tender;
import com.tender.backend.repository.AIAnalysisRepository;
import com.tender.backend.repository.TenderRepository;
import com.tender.backend.service.AIService.AIProviderException;
import com.tender.backend.service.AIService.ProviderAnalysis;
import com.tender.backend.service.TenderAiSummaryService.AiTenderSummary;
import java.time.LocalDateTime;
import java.time.LocalDate;
import java.time.format.TextStyle;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AITenderService {

    private final TenderRepository tenderRepository;
    private final AIAnalysisRepository aiAnalysisRepository;
    private final TenderAiSummaryService tenderAiSummaryService;
    private final AIService aiService;

    public AITenderService(
            TenderRepository tenderRepository,
            AIAnalysisRepository aiAnalysisRepository,
            TenderAiSummaryService tenderAiSummaryService,
            AIService aiService
    ) {
        this.tenderRepository = tenderRepository;
        this.aiAnalysisRepository = aiAnalysisRepository;
        this.tenderAiSummaryService = tenderAiSummaryService;
        this.aiService = aiService;
    }

    @Transactional
    public AIAnalysis analyzeTender(Long tenderId) {
        Tender tender = tenderRepository.findById(tenderId)
                .orElseThrow(() -> new IllegalArgumentException("Tender not found"));
        AIAnalysis cached = aiAnalysisRepository.findByTenderId(tenderId).orElse(null);
        if (cached != null
                && cached.getAnalyzedAt() != null
                && cached.getAnalyzedAt().isAfter(LocalDateTime.now().minusHours(24))
                && !Boolean.TRUE.equals(cached.getFallbackUsed())) {
            cached.setCacheHit(true);
            return cached;
        }

        AIAnalysis analysis = cached == null ? new AIAnalysis() : cached;
        analysis.setTender(tender);

        try {
            ProviderAnalysis providerAnalysis = aiService.analyzeTender(tender);
            applyProviderAnalysis(analysis, providerAnalysis);
            analysis.setProvider(aiService.provider());
            analysis.setCacheHit(false);
            analysis.setFallbackUsed(false);
            analysis.setErrorMessage(null);
        } catch (AIProviderException ex) {
            applyDeterministicFallback(analysis, tender, ex.getMessage());
        }

        return aiAnalysisRepository.save(analysis);
    }

    @Transactional
    public AIAnalysis forceAnalyzeTender(Long tenderId) {
        Tender tender = tenderRepository.findById(tenderId)
                .orElseThrow(() -> new IllegalArgumentException("Tender not found"));
        AiTenderSummary summary = tenderAiSummaryService.summarize(tender);
        AIAnalysis analysis = aiAnalysisRepository.findByTenderId(tenderId).orElseGet(AIAnalysis::new);

        analysis.setTender(tender);
        analysis.setSummary(summary.summary());
        analysis.setOpportunityScore(summary.opportunityScore());
        analysis.setRiskLevel(summary.riskLevel());
        analysis.setRecommendation(summary.bidRecommendation());
        analysis.setEligibilityRequirements(summary.keyRequirements());
        analysis.setRequiredDocuments(summary.requiredDocuments());
        analysis.setImportantDeadlines(importantDeadlines(tender, summary));
        analysis.setWinProbability(winProbability(summary.opportunityScore(), summary.riskLevel(), summary.daysLeft()));
        analysis.setRiskFactors(summary.riskFactors());
        analysis.setRecommendedActions(summary.recommendedActions());
        analysis.setRawResponse(null);
        analysis.setProvider("deterministic");
        analysis.setCacheHit(false);
        analysis.setFallbackUsed(true);
        analysis.setErrorMessage("Manual deterministic refresh.");

        return aiAnalysisRepository.save(analysis);
    }

    @Transactional(readOnly = true)
    public AIAnalysis getAnalysis(Long tenderId) {
        return aiAnalysisRepository.findByTenderId(tenderId).orElse(null);
    }

    @Transactional
    public DashboardInsights getDashboardInsights() {
        List<Tender> tenders = tenderRepository.findAll();
        List<AIAnalysis> analyses = tenders.stream()
                .map(tender -> aiAnalysisRepository.findByTenderId(tender.getId())
                        .orElseGet(() -> buildTransientAnalysis(tender)))
                .toList();

        long totalAnalyzed = analyses.size();
        double averageScore = analyses.stream()
                .map(AIAnalysis::getOpportunityScore)
                .filter(score -> score != null)
                .mapToInt(Integer::intValue)
                .average()
                .orElse(0);
        long highRisk = analyses.stream()
                .filter(analysis -> "High".equalsIgnoreCase(analysis.getRiskLevel()))
                .count();
        Map<String, Long> riskCounts = analyses.stream()
                .collect(Collectors.groupingBy(
                        analysis -> valueOrDefault(analysis.getRiskLevel(), "Medium"),
                        TreeMap::new,
                        Collectors.counting()
                ));
        long recommended = analyses.stream()
                .filter(analysis -> analysis.getOpportunityScore() != null && analysis.getOpportunityScore() >= 70)
                .count();
        double averageWinProbability = analyses.stream()
                .map(AIAnalysis::getWinProbability)
                .filter(value -> value != null)
                .mapToInt(Integer::intValue)
                .average()
                .orElse(0);
        Map<String, Long> commonRequiredDocuments = analyses.stream()
                .flatMap(analysis -> analysis.getRequiredDocuments().stream())
                .collect(Collectors.groupingBy(document -> document, TreeMap::new, Collectors.counting()));
        long cacheHits = analyses.stream()
                .filter(analysis -> Boolean.TRUE.equals(analysis.getCacheHit()))
                .count();
        long cacheMisses = Math.max(0, totalAnalyzed - cacheHits);

        Map<String, Long> categoryCounts = tenders.stream()
                .collect(Collectors.groupingBy(
                        tender -> valueOrDefault(tender.getCategory(), "General"),
                        TreeMap::new,
                        Collectors.counting()
                ));

        Map<String, Long> monthlyOpportunities = tenders.stream()
                .filter(tender -> tender.getPublishedDate() != null)
                .collect(Collectors.groupingBy(
                        tender -> monthLabel(tender.getPublishedDate()),
                        TreeMap::new,
                        Collectors.counting()
                ));

        List<AIAnalysis> topRecommendations = analyses.stream()
                .sorted(Comparator.comparingInt((AIAnalysis analysis) ->
                        analysis.getOpportunityScore() == null ? 0 : analysis.getOpportunityScore()).reversed())
                .limit(5)
                .toList();

        return new DashboardInsights(
                totalAnalyzed,
                Math.round(averageScore),
                highRisk,
                recommended,
                Math.round(averageWinProbability),
                riskCounts,
                commonRequiredDocuments,
                totalAnalyzed,
                cacheHits,
                cacheMisses,
                categoryCounts,
                monthlyOpportunities,
                topRecommendations
        );
    }

    @Transactional(readOnly = true)
    public List<AIAnalysis> getAllAnalyses() {
        return aiAnalysisRepository.findAll();
    }

    private void applyProviderAnalysis(AIAnalysis analysis, ProviderAnalysis providerAnalysis) {
        analysis.setSummary(providerAnalysis.summary());
        analysis.setOpportunityScore(providerAnalysis.opportunityScore());
        analysis.setRiskLevel(providerAnalysis.riskLevel());
        analysis.setEligibilityRequirements(providerAnalysis.eligibilityRequirements());
        analysis.setRequiredDocuments(providerAnalysis.requiredDocuments());
        analysis.setRiskFactors(providerAnalysis.riskFactors());
        analysis.setRecommendedActions(providerAnalysis.recommendedActions());
        analysis.setRecommendation(providerAnalysis.recommendation());
        analysis.setWinProbability(providerAnalysis.winProbability());
        analysis.setImportantDeadlines(providerAnalysis.importantDeadlines());
        analysis.setRawResponse(providerAnalysis.rawResponse());
    }

    private void applyDeterministicFallback(AIAnalysis analysis, Tender tender, String errorMessage) {
        AiTenderSummary summary = tenderAiSummaryService.summarize(tender);
        analysis.setSummary(summary.summary());
        analysis.setOpportunityScore(summary.opportunityScore());
        analysis.setRiskLevel(summary.riskLevel());
        analysis.setRecommendation(summary.bidRecommendation());
        analysis.setEligibilityRequirements(summary.keyRequirements());
        analysis.setRequiredDocuments(summary.requiredDocuments());
        analysis.setImportantDeadlines(importantDeadlines(tender, summary));
        analysis.setWinProbability(winProbability(summary.opportunityScore(), summary.riskLevel(), summary.daysLeft()));
        analysis.setRiskFactors(summary.riskFactors());
        analysis.setRecommendedActions(summary.recommendedActions());
        analysis.setRawResponse(null);
        analysis.setProvider(aiService.provider());
        analysis.setCacheHit(false);
        analysis.setFallbackUsed(true);
        analysis.setErrorMessage(errorMessage);
    }

    private AIAnalysis buildTransientAnalysis(Tender tender) {
        AiTenderSummary summary = tenderAiSummaryService.summarize(tender);
        AIAnalysis analysis = new AIAnalysis();
        analysis.setTender(tender);
        analysis.setSummary(summary.summary());
        analysis.setOpportunityScore(summary.opportunityScore());
        analysis.setRiskLevel(summary.riskLevel());
        analysis.setRecommendation(summary.bidRecommendation());
        analysis.setEligibilityRequirements(summary.keyRequirements());
        analysis.setRequiredDocuments(summary.requiredDocuments());
        analysis.setImportantDeadlines(importantDeadlines(tender, summary));
        analysis.setWinProbability(winProbability(summary.opportunityScore(), summary.riskLevel(), summary.daysLeft()));
        analysis.setRiskFactors(summary.riskFactors());
        analysis.setRecommendedActions(summary.recommendedActions());
        analysis.setProvider("deterministic");
        analysis.setFallbackUsed(true);
        return analysis;
    }

    private List<String> importantDeadlines(Tender tender, AiTenderSummary summary) {
        List<String> deadlines = new java.util.ArrayList<>();
        deadlines.add(summary.deadlineSummary());
        if (tender.getPublishedDate() != null) {
            deadlines.add("Published on " + tender.getPublishedDate());
        }
        if (tender.getDeadline() != null) {
            deadlines.add("Submission deadline: " + tender.getDeadline());
        }
        return deadlines;
    }

    private int winProbability(int opportunityScore, String riskLevel, long daysLeft) {
        int probability = opportunityScore - 8;
        if ("Low".equalsIgnoreCase(riskLevel)) {
            probability += 8;
        } else if ("High".equalsIgnoreCase(riskLevel)) {
            probability -= 16;
        }
        if (daysLeft >= 21) {
            probability += 6;
        } else if (daysLeft >= 0 && daysLeft <= 7) {
            probability -= 10;
        } else if (daysLeft < 0) {
            probability -= 30;
        }
        return Math.max(1, Math.min(95, probability));
    }

    private String monthLabel(LocalDate date) {
        return date.getMonth().getDisplayName(TextStyle.SHORT, Locale.ENGLISH) + " " + date.getYear();
    }

    private String valueOrDefault(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }

    public record DashboardInsights(
            long totalAnalyzed,
            long averageOpportunityScore,
            long highRiskTendersCount,
            long recommendedTendersCount,
            long averageWinProbability,
            Map<String, Long> riskCounts,
            Map<String, Long> commonRequiredDocuments,
            long aiAnalysisUsageCount,
            long cacheHits,
            long cacheMisses,
            Map<String, Long> categoryCounts,
            Map<String, Long> monthlyOpportunities,
            List<AIAnalysis> topRecommendations
    ) {
    }
}
