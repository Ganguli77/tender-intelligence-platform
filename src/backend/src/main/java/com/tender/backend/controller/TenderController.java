package com.tender.backend.controller;

import com.tender.backend.model.Tender;
import com.tender.backend.repository.TenderRepository;
import com.tender.backend.service.TenderAiInsightsService;
import com.tender.backend.service.TenderAiInsightsService.AiInsights;
import com.tender.backend.service.TenderAiSummaryService;
import com.tender.backend.service.TenderAiSummaryService.AiTenderSummary;
import com.tender.backend.service.TenderRecommendationService;
import com.tender.backend.service.TenderRecommendationService.TenderRecommendation;
import com.tender.backend.service.TenderService;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.TreeMap;
import java.util.stream.Collectors;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/tenders")
public class TenderController {

    private final TenderRepository tenderRepository;
    private final TenderService tenderService;
    private final TenderAiSummaryService tenderAiSummaryService;
    private final TenderAiInsightsService tenderAiInsightsService;
    private final TenderRecommendationService tenderRecommendationService;

    public TenderController(
            TenderRepository tenderRepository,
            TenderService tenderService,
            TenderAiSummaryService tenderAiSummaryService,
            TenderAiInsightsService tenderAiInsightsService,
            TenderRecommendationService tenderRecommendationService
    ) {
        this.tenderRepository = tenderRepository;
        this.tenderService = tenderService;
        this.tenderAiSummaryService = tenderAiSummaryService;
        this.tenderAiInsightsService = tenderAiInsightsService;
        this.tenderRecommendationService = tenderRecommendationService;
    }

    @GetMapping
    @Transactional(readOnly = true)
    public List<Tender> getAllTenders(
            @RequestParam(required = false, name = "q") String query,
            @RequestParam(required = false) String state,
            @RequestParam(required = false) String organization,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) BigDecimal minValue,
            @RequestParam(required = false) BigDecimal maxValue,
            @RequestParam(required = false) LocalDate publishedFrom,
            @RequestParam(required = false) LocalDate publishedTo,
            @RequestParam(required = false) LocalDate closingFrom,
            @RequestParam(required = false) LocalDate closingTo
    ) {
        return initializeTenderCollections(tenderService.searchTenders(
                query,
                state,
                organization,
                category,
                status,
                minValue,
                maxValue,
                publishedFrom,
                publishedTo,
                closingFrom,
                closingTo
        ));
    }

    @GetMapping("/insights")
    @Transactional(readOnly = true)
    public TenderInsights getTenderInsights() {
        List<Tender> tenders = tenderService.findAll();
        initializeTenderCollections(tenders);
        LocalDate today = LocalDate.now();
        long total = tenderRepository.count();

        long active = tenders.stream()
                .filter(tender -> tender.getDeadline() == null || !tender.getDeadline().isBefore(today))
                .count();
        long expired = Math.max(total - active, 0);
        long totalValue = tenders.stream()
                .map(Tender::getAmountValue)
                .filter(Objects::nonNull)
                .mapToLong(Long::longValue)
                .sum();

        Map<String, Long> byCategory = tenders.stream()
                .collect(Collectors.groupingBy(
                        tender -> valueOrDefault(tender.getCategory(), "General"),
                        TreeMap::new,
                        Collectors.counting()
                ));

        Map<String, Long> byStatus = tenders.stream()
                .collect(Collectors.groupingBy(
                        tender -> valueOrDefault(tender.getStatus(), "Open"),
                        TreeMap::new,
                        Collectors.counting()
                ));

        List<Tender> closingSoon = tenders.stream()
                .filter(tender -> tender.getDeadline() != null && !tender.getDeadline().isBefore(today))
                .sorted(Comparator.comparing(Tender::getDeadline))
                .limit(5)
                .toList();

        return new TenderInsights(
                total,
                active,
                expired,
                totalValue,
                byCategory.size(),
                byCategory,
                byStatus,
                closingSoon
        );
    }

    @GetMapping("/ai-insights")
    @Transactional(readOnly = true)
    public AiInsights getTenderAiInsights() {
        List<Tender> tenders = tenderService.findAll();
        initializeTenderCollections(tenders);
        try {
            return tenderAiInsightsService.summarize(tenders);
        } catch (Exception ex) {
            return buildFallbackAiInsights(tenders);
        }
    }

    @GetMapping("/recommendations")
    @Transactional(readOnly = true)
    public List<TenderRecommendation> getTenderRecommendations(
            @RequestParam(required = false) String viewedTenderIds,
            @RequestParam(required = false) String keywords,
            @RequestParam(required = false) Integer limit
    ) {
        return tenderRecommendationService.recommend(parseIds(viewedTenderIds), keywords, limit);
    }

    @GetMapping("/{id:\\d+}")
    @Transactional(readOnly = true)
    public ResponseEntity<Tender> getTenderById(@PathVariable Long id) {
        return tenderRepository.findById(id)
                .map(this::initializeTenderCollections)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id:\\d+}/ai-summary")
    @Transactional(readOnly = true)
    public ResponseEntity<AiTenderSummary> getTenderAiSummary(@PathVariable Long id) {
        return tenderRepository.findById(id)
                .map(tenderAiSummaryService::summarize)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Tender createTender(@RequestBody Tender tender) {
        applyDefaults(tender);
        return tenderRepository.save(tender);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Tender> updateTender(
            @PathVariable Long id,
            @RequestBody Tender updatedTender
    ) {
        return tenderRepository.findById(id)
                .map(tender -> {
                    copyTenderFields(updatedTender, tender);
                    applyDefaults(tender);
                    return ResponseEntity.ok(tenderRepository.save(tender));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTender(@PathVariable Long id) {
        if (!tenderRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        tenderRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private List<Tender> initializeTenderCollections(List<Tender> tenders) {
        tenders.forEach(this::initializeTenderCollections);
        return tenders;
    }

    private Tender initializeTenderCollections(Tender tender) {
        if (tender.getEligibility() != null) {
            tender.getEligibility().size();
        }
        if (tender.getDocuments() != null) {
            tender.getDocuments().size();
        }
        return tender;
    }

    private void copyTenderFields(Tender source, Tender target) {
        target.setReferenceNo(source.getReferenceNo());
        target.setTitle(source.getTitle());
        target.setOrganization(source.getOrganization());
        target.setBuyerType(source.getBuyerType());
        target.setCategory(source.getCategory());
        target.setLocation(source.getLocation());
        target.setAmountValue(source.getAmountValue());
        target.setAmount(source.getAmount());
        target.setBidSecurity(source.getBidSecurity());
        target.setStatus(source.getStatus());
        target.setPublishedDate(source.getPublishedDate());
        target.setDeadline(source.getDeadline());
        target.setContact(source.getContact());
        target.setEligibility(source.getEligibility());
        target.setDocuments(source.getDocuments());
        target.setDescription(source.getDescription());
    }

    private void applyDefaults(Tender tender) {
        if (tender.getStatus() == null || tender.getStatus().isBlank()) {
            tender.setStatus("Open");
        }
        if (tender.getBuyerType() == null || tender.getBuyerType().isBlank()) {
            tender.setBuyerType("Government");
        }
        if (tender.getCategory() == null || tender.getCategory().isBlank()) {
            tender.setCategory("General");
        }
        if (tender.getPublishedDate() == null) {
            tender.setPublishedDate(LocalDate.now());
        }
        if (tender.getAmountValue() == null) {
            tender.setAmountValue(0L);
        }
        if (tender.getAmount() == null || tender.getAmount().isBlank()) {
            tender.setAmount("Value on request");
        }
        if (tender.getReferenceNo() == null || tender.getReferenceNo().isBlank()) {
            tender.setReferenceNo("TND-" + System.currentTimeMillis());
        }
    }

    private String valueOrDefault(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }

    private List<Long> parseIds(String ids) {
        if (ids == null || ids.isBlank()) {
            return List.of();
        }

        return Arrays.stream(ids.split(","))
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .map(value -> {
                    try {
                        return Long.parseLong(value);
                    } catch (NumberFormatException ex) {
                        return null;
                    }
                })
                .filter(Objects::nonNull)
                .toList();
    }

    public record TenderInsights(
            long total,
            long active,
            long expired,
            long totalValue,
            long categories,
            Map<String, Long> byCategory,
            Map<String, Long> byStatus,
            List<Tender> closingSoon
    ) {
    }

    private AiInsights buildFallbackAiInsights(List<Tender> tenders) {
        LocalDate today = LocalDate.now();

        long total = tenders.size();
        long active = tenders.stream()
                .filter(tender -> tender.getDeadline() == null || !tender.getDeadline().isBefore(today))
                .count();
        long expired = Math.max(total - active, 0);
        long totalValue = tenders.stream()
                .map(Tender::getAmountValue)
                .filter(Objects::nonNull)
                .mapToLong(Long::longValue)
                .sum();

        Map<String, Long> byCategory = tenders.stream()
                .collect(Collectors.groupingBy(
                        tender -> valueOrDefault(tender.getCategory(), "General"),
                        TreeMap::new,
                        Collectors.counting()
                ));

        Map<String, Long> byStatus = tenders.stream()
                .collect(Collectors.groupingBy(
                        tender -> valueOrDefault(tender.getStatus(), "Open"),
                        TreeMap::new,
                        Collectors.counting()
                ));

        List<Tender> closingSoon = tenders.stream()
                .filter(tender -> tender.getDeadline() != null && !tender.getDeadline().isBefore(today))
                .sorted(Comparator.comparing(Tender::getDeadline))
                .limit(5)
                .toList();

        return new AiInsights(
                total,
                active,
                expired,
                totalValue,
                byCategory.size(),
                byCategory,
                byStatus,
                closingSoon.stream().map(tender -> valueOrDefault(tender.getTitle(), "Untitled Tender")).toList(),
                List.of(),
                List.of("AI insights fallback activated because the summarizer could not complete.")
        );
    }
}
