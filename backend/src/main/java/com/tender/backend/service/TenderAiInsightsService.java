package com.tender.backend.service;

import com.tender.backend.model.Tender;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.TreeMap;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

@Service
public class TenderAiInsightsService {

    private final TenderAiSummaryService tenderAiSummaryService;

    public TenderAiInsightsService(TenderAiSummaryService tenderAiSummaryService) {
        this.tenderAiSummaryService = tenderAiSummaryService;
    }

    public AiInsights summarize(List<Tender> tenders) {
        List<Tender> normalized = tenders == null ? List.of() : tenders;
        LocalDate today = LocalDate.now();

        long total = normalized.size();
        long active = normalized.stream()
                .filter(tender -> tender.getDeadline() == null || !tender.getDeadline().isBefore(today))
                .count();
        long expired = Math.max(total - active, 0);
        long totalValue = normalized.stream()
                .map(Tender::getAmountValue)
                .filter(Objects::nonNull)
                .mapToLong(Long::longValue)
                .sum();

        Map<String, Long> byCategory = normalized.stream()
                .collect(Collectors.groupingBy(
                        tender -> valueOrDefault(tender.getCategory(), "General"),
                        TreeMap::new,
                        Collectors.counting()
                ));

        Map<String, Long> byStatus = normalized.stream()
                .collect(Collectors.groupingBy(
                        tender -> valueOrDefault(tender.getStatus(), "Open"),
                        TreeMap::new,
                        Collectors.counting()
                ));

        List<Tender> closingSoon = normalized.stream()
                .filter(tender -> tender.getDeadline() != null && !tender.getDeadline().isBefore(today))
                .sorted(Comparator.comparing(Tender::getDeadline))
                .limit(5)
                .toList();

        List<TenderSummaryCard> topOpportunities = normalized.stream()
                .map(tenderAiSummaryService::summarize)
                .sorted(Comparator.comparingInt(TenderAiSummaryService.AiTenderSummary::opportunityScore).reversed())
                .limit(5)
                .map(summary -> new TenderSummaryCard(
                        summary.title(),
                        summary.organization(),
                        summary.category(),
                        summary.deadline(),
                        summary.opportunityScore(),
                        summary.riskLevel(),
                        summary.bidRecommendation()
                ))
                .toList();

        List<String> recommendedActions = buildRecommendedActions(total, active, expired, closingSoon, byCategory, byStatus);

        return new AiInsights(
                total,
                active,
                expired,
                totalValue,
                byCategory.size(),
                byCategory,
                byStatus,
                closingSoon.stream().map(tenderAiSummaryService::summarize).map(TenderAiSummaryService.AiTenderSummary::summary).toList(),
                topOpportunities,
                recommendedActions
        );
    }

    private List<String> buildRecommendedActions(
            long total,
            long active,
            long expired,
            List<Tender> closingSoon,
            Map<String, Long> byCategory,
            Map<String, Long> byStatus
    ) {
        List<String> actions = new ArrayList<>();

        if (total == 0) {
            actions.add("No tenders are loaded yet. Seed the database or create records to unlock AI insights.");
            return actions;
        }

        if (!closingSoon.isEmpty()) {
            actions.add("Prioritize the tenders closing soon because they need the fastest compliance review.");
        }

        if (expired > active) {
            actions.add("A large share of tenders are expired, so focus on pipeline cleanup and archived opportunity tracking.");
        } else {
            actions.add("The active pipeline is healthy enough to support short-term bid planning.");
        }

        if (!byCategory.isEmpty()) {
            String dominantCategory = byCategory.entrySet().stream()
                    .max(Map.Entry.comparingByValue())
                    .map(Map.Entry::getKey)
                    .orElse("General");
            actions.add("Build reusable bid assets for the dominant category: " + dominantCategory + ".");
        }

        if (byStatus.containsKey("Closing Soon")) {
            actions.add("Set escalation reminders for tenders already marked as closing soon.");
        }

        return actions;
    }

    private String valueOrDefault(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }

    public record AiInsights(
            long total,
            long active,
            long expired,
            long totalValue,
            long categories,
            Map<String, Long> byCategory,
            Map<String, Long> byStatus,
            List<String> closingSoonSummaries,
            List<TenderSummaryCard> topOpportunities,
            List<String> recommendedActions
    ) {
    }

    public record TenderSummaryCard(
            String title,
            String organization,
            String category,
            LocalDate deadline,
            int opportunityScore,
            String riskLevel,
            String bidRecommendation
    ) {
    }
}
