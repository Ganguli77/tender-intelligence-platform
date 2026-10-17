package com.tender.backend.service;

import com.tender.backend.dto.ActivityDTO;
import com.tender.backend.dto.DashboardStatsDTO;
import com.tender.backend.dto.OpportunityDistributionDTO;
import com.tender.backend.dto.RegionalTenderActivityDTO;
import com.tender.backend.dto.RecentTenderDTO;
import com.tender.backend.dto.TenderStatusDTO;
import com.tender.backend.model.AIAnalysis;
import com.tender.backend.model.SavedTender;
import com.tender.backend.model.Tender;
import com.tender.backend.model.UserAlert;
import com.tender.backend.repository.AIAnalysisRepository;
import com.tender.backend.repository.SavedTenderRepository;
import com.tender.backend.repository.TenderRepository;
import com.tender.backend.repository.UserAlertRepository;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Stream;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DashboardService {

    private static final int HIGH_SCORE = 80;
    private static final int MEDIUM_SCORE = 60;

    private final TenderRepository tenderRepository;
    private final SavedTenderRepository savedTenderRepository;
    private final UserAlertRepository userAlertRepository;
    private final AIAnalysisRepository aiAnalysisRepository;

    public DashboardService(
            TenderRepository tenderRepository,
            SavedTenderRepository savedTenderRepository,
            UserAlertRepository userAlertRepository,
            AIAnalysisRepository aiAnalysisRepository
    ) {
        this.tenderRepository = tenderRepository;
        this.savedTenderRepository = savedTenderRepository;
        this.userAlertRepository = userAlertRepository;
        this.aiAnalysisRepository = aiAnalysisRepository;
    }

    @Transactional(readOnly = true)
    public DashboardStatsDTO getStats(String userEmail) {
        TenderStatusDTO status = getStatus();
        List<SavedTender> userSavedTenders = savedTenderRepository.findByUser_EmailOrderBySavedAtDesc(userEmail);
        long savedToday = userSavedTenders.stream()
                .filter(saved -> saved.getSavedAt() != null && saved.getSavedAt().toLocalDate().equals(LocalDate.now()))
                .count();

        return new DashboardStatsDTO(
                tenderRepository.count(),
                status.active(),
                status.closingSoon(),
                status.expired(),
                userSavedTenders.size(),
                aiAnalysisRepository.countByOpportunityScoreGreaterThanEqual(HIGH_SCORE),
                "+12%",
                "+8%",
                savedToday > 0 ? "+" + savedToday + " today" : "Tracked",
                "Strong fit"
        );
    }

    @Transactional(readOnly = true)
    public TenderStatusDTO getStatus() {
        LocalDate today = LocalDate.now();
        LocalDate soon = today.plusDays(7);
        List<Tender> tenders = tenderRepository.findAll();

        long expired = tenders.stream()
                .filter(tender -> tender.getDeadline() != null && tender.getDeadline().isBefore(today))
                .count();
        long closingSoon = tenders.stream()
                .filter(tender -> tender.getDeadline() != null
                        && !tender.getDeadline().isBefore(today)
                        && !tender.getDeadline().isAfter(soon))
                .count();
        long active = tenders.stream()
                .filter(tender -> tender.getDeadline() == null || tender.getDeadline().isAfter(soon))
                .count();
        int activePercentage = tenders.isEmpty() ? 0 : (int) Math.round((active * 100.0) / tenders.size());

        return new TenderStatusDTO(active, closingSoon, expired, activePercentage);
    }

    @Transactional(readOnly = true)
    public List<OpportunityDistributionDTO> getOpportunityDistribution() {
        return List.of(
                new OpportunityDistributionDTO("High", "80+", aiAnalysisRepository.countByOpportunityScoreGreaterThanEqual(HIGH_SCORE)),
                new OpportunityDistributionDTO("Medium", "60-79", aiAnalysisRepository.countByOpportunityScoreBetween(MEDIUM_SCORE, HIGH_SCORE - 1)),
                new OpportunityDistributionDTO("Low", "<60", aiAnalysisRepository.countByOpportunityScoreLessThan(MEDIUM_SCORE))
        );
    }

    @Transactional(readOnly = true)
    public List<RegionalTenderActivityDTO> getRegionalTenderActivity() {
        Map<String, long[]> activityByState = new LinkedHashMap<>();
        List<String> states = List.of(
                "Andaman & Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar",
                "Chandigarh", "Chhattisgarh", "Dadra & Nagar Haveli and Daman & Diu", "Delhi", "Goa",
                "Gujarat", "Haryana", "Himachal Pradesh", "Jammu & Kashmir", "Jharkhand", "Karnataka",
                "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur",
                "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan",
                "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand",
                "West Bengal"
        );

        for (Tender tender : tenderRepository.findAll()) {
            if (tender.getDeadline() != null && tender.getDeadline().isBefore(LocalDate.now())) {
                continue;
            }
            String location = tender.getLocation();
            if (location == null || location.isBlank()) {
                continue;
            }

            String normalizedLocation = location.toLowerCase(Locale.ROOT);
            String state = states.stream()
                    .filter(candidate -> normalizedLocation.contains(candidate.toLowerCase(Locale.ROOT)))
                    .findFirst()
                    .orElse(null);
            if (state == null) {
                continue;
            }

            long[] totals = activityByState.computeIfAbsent(state, ignored -> new long[2]);
            totals[0]++;
            totals[1] += tender.getAmountValue() == null ? 0 : tender.getAmountValue();
        }

        return activityByState.entrySet().stream()
                .map(entry -> new RegionalTenderActivityDTO(entry.getKey(), entry.getValue()[0], entry.getValue()[1]))
                .sorted(Comparator.comparingLong(RegionalTenderActivityDTO::tenderCount).reversed())
                .toList();
    }

    @Transactional(readOnly = true)
    public List<RecentTenderDTO> getRecentHighScoreTenders() {
        return aiAnalysisRepository.findTop5ByOpportunityScoreIsNotNullOrderByOpportunityScoreDesc().stream()
                .filter(analysis -> analysis.getTender() != null)
                .map(RecentTenderDTO::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ActivityDTO> getActivity(String userEmail) {
        Stream<ActivityDTO> savedActivities = savedTenderRepository.findTop5ByUser_EmailOrderBySavedAtDesc(userEmail).stream()
                .map(this::savedTenderActivity);
        Stream<ActivityDTO> alertActivities = userAlertRepository.findTop5ByUserEmailOrderByCreatedAtDesc(userEmail).stream()
                .map(this::alertActivity);
        Stream<ActivityDTO> aiActivities = aiAnalysisRepository.findTop5ByOrderByAnalyzedAtDesc().stream()
                .map(this::aiActivity);

        return Stream.of(savedActivities, alertActivities, aiActivities)
                .flatMap(stream -> stream)
                .filter(Objects::nonNull)
                .sorted(Comparator.comparing(ActivityDTO::createdAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(10)
                .toList();
    }

    private ActivityDTO savedTenderActivity(SavedTender savedTender) {
        Tender tender = savedTender.getTender();
        LocalDateTime createdAt = savedTender.getSavedAt();
        return new ActivityDTO(
                "saved-" + savedTender.getId(),
                "saved",
                "Tender saved",
                tender == null ? "Saved tender added to your workspace." : tender.getTitle(),
                timeAgo(createdAt),
                createdAt
        );
    }

    private ActivityDTO alertActivity(UserAlert alert) {
        LocalDateTime createdAt = alert.getCreatedAt();
        return new ActivityDTO(
                "alert-" + alert.getId(),
                "alert",
                "Alert created",
                valueOrDefault(alert.getName(), "Tender alert") + " is now monitoring matching opportunities.",
                timeAgo(createdAt),
                createdAt
        );
    }

    private ActivityDTO aiActivity(AIAnalysis analysis) {
        Tender tender = analysis.getTender();
        LocalDateTime createdAt = analysis.getAnalyzedAt();
        String title = analysis.getOpportunityScore() != null && analysis.getOpportunityScore() >= HIGH_SCORE
                ? "New AI match found"
                : "AI analysis completed";
        String tenderTitle = tender == null ? "Tender analysis" : tender.getTitle();
        return new ActivityDTO(
                "ai-" + analysis.getId(),
                "ai",
                title,
                tenderTitle + " scored " + valueOrDefault(analysis.getOpportunityScore(), 0) + ".",
                timeAgo(createdAt),
                createdAt
        );
    }

    private String timeAgo(LocalDateTime createdAt) {
        if (createdAt == null) {
            return "Recently";
        }

        Duration duration = Duration.between(createdAt, LocalDateTime.now());
        if (duration.toMinutes() < 1) {
            return "Just now";
        }
        if (duration.toMinutes() < 60) {
            return duration.toMinutes() + " min ago";
        }
        if (duration.toHours() < 24) {
            return duration.toHours() + " hour" + (duration.toHours() == 1 ? "" : "s") + " ago";
        }
        return duration.toDays() + " day" + (duration.toDays() == 1 ? "" : "s") + " ago";
    }

    private String valueOrDefault(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }

    private int valueOrDefault(Integer value, int fallback) {
        return value == null ? fallback : value;
    }
}
