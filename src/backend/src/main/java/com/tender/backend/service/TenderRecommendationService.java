package com.tender.backend.service;

import com.tender.backend.model.Tender;
import com.tender.backend.repository.TenderRepository;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

@Service
public class TenderRecommendationService {

    private static final int DEFAULT_LIMIT = 6;
    private static final int MAX_LIMIT = 12;

    private static final int CATEGORY_WEIGHT = 35;
    private static final int ORGANIZATION_WEIGHT = 20;
    private static final int LOCATION_WEIGHT = 20;
    private static final int BUDGET_WEIGHT = 15;
    private static final int KEYWORD_WEIGHT = 20;
    private static final int RECENT_TENDER_WEIGHT = 10;
    private static final int OPEN_TENDER_WEIGHT = 10;
    private static final int CLOSING_SOON_BONUS = 8;
    private static final int CLOSING_IMMEDIATE_BONUS = 15;
    private static final int PERSONALIZED_MAX_SCORE = CATEGORY_WEIGHT
            + ORGANIZATION_WEIGHT
            + LOCATION_WEIGHT
            + BUDGET_WEIGHT
            + KEYWORD_WEIGHT
            + RECENT_TENDER_WEIGHT
            + OPEN_TENDER_WEIGHT
            + CLOSING_IMMEDIATE_BONUS;
    private static final int TRENDING_MAX_SCORE = BUDGET_WEIGHT
            + RECENT_TENDER_WEIGHT
            + OPEN_TENDER_WEIGHT
            + CLOSING_IMMEDIATE_BONUS;

    private final TenderRepository tenderRepository;

    public TenderRecommendationService(TenderRepository tenderRepository) {
        this.tenderRepository = tenderRepository;
    }

    public List<TenderRecommendation> recommend(List<Long> recentlyViewedIds, String keywords, Integer limit) {
        List<Tender> tenders = tenderRepository.findAll();
        int resultLimit = limit == null || limit < 1 ? DEFAULT_LIMIT : Math.min(limit, MAX_LIMIT);
        Set<Long> viewedSet = new LinkedHashSet<>(recentlyViewedIds == null ? List.of() : recentlyViewedIds);
        List<Tender> viewedTenders = tenders.stream()
                .filter(tender -> tender.getId() != null && viewedSet.contains(tender.getId()))
                .toList();

        if (viewedTenders.isEmpty()) {
            return trending(tenders, resultLimit);
        }

        RecommendationProfile profile = buildProfile(viewedTenders, keywords);
        List<TenderRecommendation> recommendations = tenders.stream()
                .filter(tender -> tender.getId() != null && !viewedSet.contains(tender.getId()))
                .map(tender -> scorePersonalizedTender(tender, profile))
                .filter(recommendation -> recommendation.score() > 0)
                .sorted(recommendationOrder())
                .limit(resultLimit)
                .toList();

        return recommendations.isEmpty() ? trending(tenders, resultLimit) : recommendations;
    }

    private TenderRecommendation scorePersonalizedTender(Tender tender, RecommendationProfile profile) {
        List<ScoringSignal> signals = new ArrayList<>();

        addCategorySignal(tender, profile, signals);
        addOrganizationSignal(tender, profile, signals);
        addLocationSignal(tender, profile, signals);
        addBudgetSignal(tender, profile.averageBudget(), signals);
        addKeywordSignal(tender, profile.keywords(), signals);
        addRecentTenderSignal(tender, signals);
        addOpenTenderSignal(tender, signals);
        addClosingSoonSignal(tender, signals);

        int score = normalizeScore(rawScore(signals), PERSONALIZED_MAX_SCORE);
        return buildRecommendation(tender, score, signals);
    }

    private List<TenderRecommendation> trending(List<Tender> tenders, int limit) {
        return tenders.stream()
                .map(this::scoreTrendingTender)
                .filter(recommendation -> recommendation.score() > 0)
                .sorted(recommendationOrder())
                .limit(limit)
                .toList();
    }

    private TenderRecommendation scoreTrendingTender(Tender tender) {
        List<ScoringSignal> signals = new ArrayList<>();

        addBudgetStrengthSignal(tender, signals);
        addRecentTenderSignal(tender, signals);
        addOpenTenderSignal(tender, signals);
        addClosingSoonSignal(tender, signals);

        int score = normalizeScore(rawScore(signals), TRENDING_MAX_SCORE);
        return buildRecommendation(tender, score, signals);
    }

    private void addCategorySignal(Tender tender, RecommendationProfile profile, List<ScoringSignal> signals) {
        String category = normalized(tender.getCategory());
        int viewedCount = profile.categories().getOrDefault(category, 0);
        if (viewedCount == 0) {
            return;
        }

        String categoryName = displayValue(tender.getCategory(), "this category");
        String explanation = viewedCount > 1
                ? "Highly relevant because you frequently view " + categoryName + " tenders."
                : "Matches your recent interest in " + categoryName + " tenders.";
        signals.add(new ScoringSignal("Category Match", CATEGORY_WEIGHT, explanation));
    }

    private void addOrganizationSignal(Tender tender, RecommendationProfile profile, List<ScoringSignal> signals) {
        String organization = normalized(tender.getOrganization());
        if (!profile.organizations().containsKey(organization)) {
            return;
        }

        String organizationName = displayValue(tender.getOrganization(), "a familiar organization");
        signals.add(new ScoringSignal(
                "Organization Match",
                ORGANIZATION_WEIGHT,
                "Same organization as previous interest: " + organizationName + "."
        ));
    }

    private void addLocationSignal(Tender tender, RecommendationProfile profile, List<ScoringSignal> signals) {
        String state = normalized(extractState(tender.getLocation()));
        if (!profile.states().containsKey(state)) {
            return;
        }

        String locationName = displayValue(extractState(tender.getLocation()), "your preferred location");
        signals.add(new ScoringSignal(
                "Location Match",
                LOCATION_WEIGHT,
                "Location matches your preference for " + locationName + "."
        ));
    }

    private void addBudgetSignal(Tender tender, long averageBudget, List<ScoringSignal> signals) {
        int points = budgetSimilarityScore(tender.getAmountValue(), averageBudget);
        if (points == 0) {
            return;
        }

        signals.add(new ScoringSignal(
                "Budget Similarity",
                points,
                "Budget closely matches previous tenders."
        ));
    }

    private void addBudgetStrengthSignal(Tender tender, List<ScoringSignal> signals) {
        int points = budgetStrengthScore(tender.getAmountValue());
        if (points == 0) {
            return;
        }

        signals.add(new ScoringSignal(
                "Budget Strength",
                points,
                "Budget value makes this a strong opportunity."
        ));
    }

    private void addKeywordSignal(Tender tender, Set<String> keywords, List<ScoringSignal> signals) {
        int matches = keywordMatches(tender, keywords);
        if (matches == 0) {
            return;
        }

        int points = Math.min(matches * 5, KEYWORD_WEIGHT);
        String keywordText = matches == 1 ? "keyword" : "keywords";
        signals.add(new ScoringSignal(
                "Keyword Match",
                points,
                "Shares " + matches + " relevant " + keywordText + " with your recent interests."
        ));
    }

    private void addRecentTenderSignal(Tender tender, List<ScoringSignal> signals) {
        int points = recentTenderScore(tender.getPublishedDate());
        if (points == 0) {
            return;
        }

        String explanation = points == RECENT_TENDER_WEIGHT
                ? "Published in the last week."
                : "Published recently.";
        signals.add(new ScoringSignal("Recent Tender", points, explanation));
    }

    private void addOpenTenderSignal(Tender tender, List<ScoringSignal> signals) {
        if (!isOpenTender(tender)) {
            return;
        }

        signals.add(new ScoringSignal(
                "Open Tender",
                OPEN_TENDER_WEIGHT,
                "Open for bidding."
        ));
    }

    private void addClosingSoonSignal(Tender tender, List<ScoringSignal> signals) {
        Long daysLeft = daysUntilDeadline(tender);
        if (daysLeft == null || daysLeft < 0 || daysLeft > 7 || !isOpenTender(tender)) {
            return;
        }

        int points = daysLeft <= 3 ? CLOSING_IMMEDIATE_BONUS : CLOSING_SOON_BONUS;
        String explanation = daysLeft <= 3
                ? "Closing very soon, with " + daysLeft + " days left."
                : "Closing soon, with " + daysLeft + " days left.";
        signals.add(new ScoringSignal("Closing Soon", points, explanation));
    }

    private TenderRecommendation buildRecommendation(Tender tender, int score, List<ScoringSignal> signals) {
        String confidence = confidence(score);
        String badge = badge(score, signals);
        List<String> explanations = signals.stream()
                .sorted(Comparator.comparingInt(ScoringSignal::points).reversed())
                .map(ScoringSignal::explanation)
                .distinct()
                .toList();
        List<String> reasonLabels = signals.stream().map(ScoringSignal::factor).distinct().toList();
        List<ScoreBreakdown> scoreBreakdown = signals.stream()
                .map(signal -> new ScoreBreakdown(signal.factor(), signal.points()))
                .toList();

        return new TenderRecommendation(
                tender,
                score,
                confidence,
                badge,
                explanations,
                score,
                confidence,
                badge,
                String.join(" ", explanations),
                scoreBreakdown,
                reasonLabels
        );
    }

    private Comparator<TenderRecommendation> recommendationOrder() {
        return Comparator
                .comparingInt(TenderRecommendation::score).reversed()
                .thenComparing(Comparator.comparingInt((TenderRecommendation recommendation) ->
                        confidenceRank(recommendation.confidence())).reversed())
                .thenComparing(recommendation -> publishedDateOrMin(recommendation.tender()), Comparator.reverseOrder())
                .thenComparing(recommendation -> budgetOrZero(recommendation.tender()), Comparator.reverseOrder());
    }

    private RecommendationProfile buildProfile(List<Tender> viewedTenders, String keywords) {
        Map<String, Integer> categories = new HashMap<>();
        Map<String, Integer> states = new HashMap<>();
        Map<String, Integer> organizations = new HashMap<>();
        Set<String> keywordSet = tokenize(keywords);
        long totalBudget = 0;
        long budgetCount = 0;

        for (Tender tender : viewedTenders) {
            increment(categories, normalized(tender.getCategory()));
            increment(states, normalized(extractState(tender.getLocation())));
            increment(organizations, normalized(tender.getOrganization()));
            keywordSet.addAll(tokenize(tender.getTitle()));
            keywordSet.addAll(tokenize(tender.getCategory()));
            keywordSet.addAll(tokenize(tender.getOrganization()));
            keywordSet.addAll(tokenize(tender.getDescription()));

            if (tender.getAmountValue() != null && tender.getAmountValue() > 0) {
                totalBudget += tender.getAmountValue();
                budgetCount += 1;
            }
        }

        return new RecommendationProfile(
                categories,
                states,
                organizations,
                keywordSet,
                budgetCount == 0 ? 0 : totalBudget / budgetCount
        );
    }

    private int budgetSimilarityScore(Long amountValue, long averageBudget) {
        if (amountValue == null || amountValue <= 0 || averageBudget <= 0) {
            return 0;
        }

        double difference = Math.abs(amountValue - averageBudget) / (double) averageBudget;
        if (difference <= 0.15) return BUDGET_WEIGHT;
        if (difference <= 0.35) return 10;
        if (difference <= 0.6) return 5;
        return 0;
    }

    private int budgetStrengthScore(Long amountValue) {
        if (amountValue == null || amountValue <= 0) {
            return 0;
        }
        if (amountValue >= 100_000_000L) return BUDGET_WEIGHT;
        if (amountValue >= 25_000_000L) return 10;
        return 5;
    }

    private int recentTenderScore(LocalDate publishedDate) {
        if (publishedDate == null) {
            return 0;
        }

        long age = ChronoUnit.DAYS.between(publishedDate, LocalDate.now());
        if (age < 0) return RECENT_TENDER_WEIGHT;
        if (age <= 7) return RECENT_TENDER_WEIGHT;
        if (age <= 30) return 6;
        if (age <= 90) return 3;
        return 0;
    }

    private int keywordMatches(Tender tender, Set<String> keywords) {
        if (keywords.isEmpty()) {
            return 0;
        }

        Set<String> tenderTokens = tokenize(String.join(" ",
                Objects.toString(tender.getTitle(), ""),
                Objects.toString(tender.getCategory(), ""),
                Objects.toString(tender.getOrganization(), ""),
                Objects.toString(tender.getDescription(), "")
        ));
        return (int) keywords.stream().filter(tenderTokens::contains).count();
    }

    private int rawScore(List<ScoringSignal> signals) {
        return signals.stream().mapToInt(ScoringSignal::points).sum();
    }

    private int normalizeScore(int rawScore, int maxScore) {
        if (rawScore <= 0 || maxScore <= 0) {
            return 0;
        }
        return Math.min(100, Math.round(rawScore * 100f / maxScore));
    }

    private String confidence(int score) {
        if (score >= 90) {
            return "High";
        }
        if (score >= 75) {
            return "Medium";
        }
        return "Low";
    }

    private int confidenceRank(String confidence) {
        return switch (confidence) {
            case "High" -> 3;
            case "Medium" -> 2;
            default -> 1;
        };
    }

    private String badge(int score, List<ScoringSignal> signals) {
        if (score >= 90) {
            return "Highly Recommended";
        }
        if (hasSignal(signals, "Closing Soon")) {
            return "Closing Soon";
        }
        if (score >= 75) {
            return "Strong Match";
        }
        if (hasSignal(signals, "Recent Tender")) {
            return "New Opportunity";
        }
        if (hasSignal(signals, "Budget Similarity") || hasSignal(signals, "Budget Strength")) {
            return "Budget Match";
        }
        return "Trending";
    }

    private boolean hasSignal(List<ScoringSignal> signals, String factor) {
        return signals.stream().anyMatch(signal -> signal.factor().equals(factor));
    }

    private boolean isOpenTender(Tender tender) {
        String status = normalized(tender.getStatus());
        boolean statusAllowsBidding = status.isBlank()
                || status.equals("open")
                || status.equals("active")
                || status.equals("published");
        boolean deadlineAllowsBidding = tender.getDeadline() == null || !tender.getDeadline().isBefore(LocalDate.now());
        return statusAllowsBidding && deadlineAllowsBidding;
    }

    private Long daysUntilDeadline(Tender tender) {
        if (tender.getDeadline() == null) {
            return null;
        }
        return ChronoUnit.DAYS.between(LocalDate.now(), tender.getDeadline());
    }

    private LocalDate publishedDateOrMin(Tender tender) {
        return tender.getPublishedDate() == null ? LocalDate.MIN : tender.getPublishedDate();
    }

    private long budgetOrZero(Tender tender) {
        return tender.getAmountValue() == null ? 0L : tender.getAmountValue();
    }

    private String extractState(String location) {
        if (location == null || location.isBlank()) {
            return "";
        }
        String[] parts = location.split(",");
        return parts[parts.length - 1].trim();
    }

    private Set<String> tokenize(String value) {
        if (value == null || value.isBlank()) {
            return Set.of();
        }

        return Arrays.stream(value.toLowerCase(Locale.ROOT).split("[^a-z0-9]+"))
                .map(String::trim)
                .filter(token -> token.length() > 2)
                .filter(token -> !Set.of("the", "and", "for", "with", "from", "this", "that").contains(token))
                .collect(Collectors.toSet());
    }

    private void increment(Map<String, Integer> map, String value) {
        if (!value.isBlank()) {
            map.merge(value, 1, Integer::sum);
        }
    }

    private String normalized(String value) {
        return Objects.toString(value, "").trim().toLowerCase(Locale.ROOT);
    }

    private String displayValue(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.trim();
    }

    private record RecommendationProfile(
            Map<String, Integer> categories,
            Map<String, Integer> states,
            Map<String, Integer> organizations,
            Set<String> keywords,
            long averageBudget
    ) {
    }

    private record ScoringSignal(String factor, int points, String explanation) {
    }

    public record TenderRecommendation(
            Tender tender,
            int score,
            String confidence,
            String badge,
            List<String> explanations,
            int matchPercentage,
            String confidenceLabel,
            String reasonBadge,
            String aiExplanation,
            List<ScoreBreakdown> scoreBreakdown,
            List<String> reasons
    ) {
    }

    public record ScoreBreakdown(
            String factor,
            int points
    ) {
    }
}
