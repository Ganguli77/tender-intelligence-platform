package com.tender.backend.service;

import com.tender.backend.model.Tender;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class TenderAiSummaryService {

    public AiTenderSummary summarize(Tender tender) {
        long daysLeft = daysLeft(tender);
        String urgency = urgency(daysLeft);
        String riskLevel = riskLevel(tender, daysLeft);
        int opportunityScore = opportunityScore(tender, daysLeft, riskLevel);
        String scope = scopeSummary(tender);
        String deadlineSummary = deadlineSummary(tender, daysLeft, urgency);
        String eligibilitySummary = eligibilitySummary(tender);
        List<String> riskFactorsList = riskFactors(tender, daysLeft, riskLevel);
        List<String> keyRequirements = keyRequirements(tender);
        List<String> requiredDocuments = requiredDocuments(tender);
        String bidRecommendation = bidRecommendation(opportunityScore, riskLevel, daysLeft);
        String whyThisMatters = whyThisMatters(tender, opportunityScore, urgency, daysLeft);
        List<String> recommendedActions = recommendedActions(tender, daysLeft, riskLevel);

        return new AiTenderSummary(
                valueOrDefault(tender.getTitle(), "Untitled Tender"),
                valueOrDefault(tender.getOrganization(), "Not specified"),
                valueOrDefault(tender.getCategory(), "General"),
                tender.getDeadline(),
                summaryText(tender, urgency, riskLevel),
                opportunityScore,
                urgency,
                riskLevel,
                daysLeft,
                idealBidder(tender),
                winStrategy(tender, riskLevel),
                scope,
                deadlineSummary,
                eligibilitySummary,
                riskFactorsList,
                keyRequirements,
                requiredDocuments,
                bidRecommendation,
                whyThisMatters,
                recommendedActions
        );
    }

    private String summaryText(Tender tender, String urgency, String riskLevel) {
        return "%s is a %s tender from %s in %s. The estimated value is %s, the deadline urgency is %s, and the current bid risk is %s."
                .formatted(
                        valueOrDefault(tender.getTitle(), "This opportunity"),
                        valueOrDefault(tender.getCategory(), "general"),
                        valueOrDefault(tender.getOrganization(), "the buyer"),
                        valueOrDefault(tender.getLocation(), "the listed location"),
                        valueOrDefault(tender.getAmount(), "not specified"),
                        urgency.toLowerCase(),
                        riskLevel.toLowerCase()
                );
    }

    private int opportunityScore(Tender tender, long daysLeft, String riskLevel) {
        int score = 55;

        if (tender.getAmountValue() != null) {
            if (tender.getAmountValue() >= 150_000_000L) {
                score += 18;
            } else if (tender.getAmountValue() >= 50_000_000L) {
                score += 12;
            } else if (tender.getAmountValue() > 0) {
                score += 6;
            }
        }

        if (daysLeft >= 30) {
            score += 14;
        } else if (daysLeft >= 14) {
            score += 8;
        } else if (daysLeft >= 0) {
            score -= 8;
        } else {
            score -= 25;
        }

        if ("High".equals(riskLevel)) {
            score -= 14;
        } else if ("Medium".equals(riskLevel)) {
            score -= 6;
        }

        if (tender.getDocuments() != null && tender.getDocuments().size() >= 5) {
            score -= 4;
        }

        return Math.max(1, Math.min(score, 100));
    }

    private String urgency(long daysLeft) {
        if (daysLeft < 0) {
            return "Expired";
        }
        if (daysLeft <= 7) {
            return "Critical";
        }
        if (daysLeft <= 21) {
            return "High";
        }
        if (daysLeft <= 45) {
            return "Medium";
        }
        return "Comfortable";
    }

    private String riskLevel(Tender tender, long daysLeft) {
        int risk = 0;

        if (daysLeft < 0) {
            risk += 4;
        } else if (daysLeft <= 10) {
            risk += 2;
        }

        if (tender.getAmountValue() != null && tender.getAmountValue() >= 150_000_000L) {
            risk += 2;
        }

        if (tender.getEligibility() != null && tender.getEligibility().size() >= 4) {
            risk += 1;
        }

        if (tender.getDocuments() != null && tender.getDocuments().size() >= 5) {
            risk += 1;
        }

        if (risk >= 4) {
            return "High";
        }
        if (risk >= 2) {
            return "Medium";
        }
        return "Low";
    }

    private long daysLeft(Tender tender) {
        if (tender.getDeadline() == null) {
            return -1;
        }

        return ChronoUnit.DAYS.between(LocalDate.now(), tender.getDeadline());
    }

    private String idealBidder(Tender tender) {
        String category = valueOrDefault(tender.getCategory(), "General");
        String buyerType = valueOrDefault(tender.getBuyerType(), "Government");

        return "Best suited for a %s vendor with prior %s procurement experience, local delivery capability, and complete compliance documents."
                .formatted(category.toLowerCase(), buyerType.toLowerCase());
    }

    private String winStrategy(Tender tender, String riskLevel) {
        if ("High".equals(riskLevel)) {
            return "Prioritize eligibility proof, execution timeline, and risk controls before pricing aggressively.";
        }

        if (tender.getAmountValue() != null && tender.getAmountValue() >= 100_000_000L) {
            return "Lead with past project scale, financial strength, milestone delivery, and a clear implementation team.";
        }

        return "Submit a compliance-first bid with crisp technical documents, service support details, and competitive pricing.";
    }

    private String scopeSummary(Tender tender) {
        String description = valueOrDefault(tender.getDescription(), "");
        if (!description.isBlank()) {
            return description.length() > 220 ? description.substring(0, 217) + "..." : description;
        }

        return "This tender focuses on %s work for %s in %s."
                .formatted(
                        valueOrDefault(tender.getCategory(), "general").toLowerCase(),
                        valueOrDefault(tender.getOrganization(), "the buyer"),
                        valueOrDefault(tender.getLocation(), "the listed location")
                );
    }

    private String deadlineSummary(Tender tender, long daysLeft, String urgency) {
        if (daysLeft < 0) {
            return "The deadline has passed, so this opportunity is closed unless the buyer reopens it.";
        }
        if (tender.getDeadline() == null) {
            return "No submission deadline is listed, so confirm the schedule with the buyer before planning work.";
        }

        String when = daysLeft == 0 ? "today" : "in " + daysLeft + " day(s)";
        return "Submission closes %s on %s, which makes the urgency %s."
                .formatted(when, tender.getDeadline(), urgency.toLowerCase());
    }

    private String eligibilitySummary(Tender tender) {
        if (tender.getEligibility() == null || tender.getEligibility().isEmpty()) {
            return "No explicit eligibility criteria are listed, so the buyer's instructions should be verified carefully.";
        }

        String summary = String.join("; ", tender.getEligibility().stream().limit(2).toList());
        return summary.length() > 220 ? summary.substring(0, 217) + "..." : summary;
    }

    private List<String> riskFactors(Tender tender, long daysLeft, String riskLevel) {
        List<String> risks = new ArrayList<>();

        if (daysLeft < 0) {
            risks.add("Deadline already passed.");
        } else if (daysLeft <= 7) {
            risks.add("Very little time remains for compliance and pricing review.");
        }

        if (tender.getAmountValue() != null && tender.getAmountValue() >= 150_000_000L) {
            risks.add("High value can bring more scrutiny and documentation overhead.");
        }

        if (tender.getEligibility() != null && tender.getEligibility().size() >= 4) {
            risks.add("Multiple eligibility conditions may require strong supporting evidence.");
        }

        if (tender.getDocuments() != null && tender.getDocuments().size() >= 5) {
            risks.add("Large document set increases preparation time.");
        }

        if (risks.isEmpty()) {
            risks.add("No major risks are obvious from the available tender data.");
        }

        if ("High".equals(riskLevel) && risks.size() < 3) {
            risks.add("Overall risk remains high based on the current tender profile.");
        }

        return risks;
    }

    private List<String> requiredDocuments(Tender tender) {
        List<String> docs = new ArrayList<>();

        if (tender.getDocuments() != null) {
            docs.addAll(tender.getDocuments().stream().limit(4).toList());
        }

        if (docs.isEmpty()) {
            docs.add("No document list provided in the tender data.");
        }

        return docs;
    }

    private String bidRecommendation(int opportunityScore, String riskLevel, long daysLeft) {
        if (daysLeft < 0) {
            return "Skip unless the tender is reissued.";
        }
        if (opportunityScore >= 75 && !"High".equals(riskLevel)) {
            return "Bid now. It looks strong enough to justify immediate preparation.";
        }
        if (daysLeft <= 7 || "High".equals(riskLevel)) {
            return "Review carefully before bidding. The tender has potential, but risk is elevated.";
        }
        return "Worth reviewing if the scope and compliance requirements fit your team.";
    }

    private String whyThisMatters(Tender tender, int opportunityScore, String urgency, long daysLeft) {
        String title = valueOrDefault(tender.getTitle(), "This tender");
        String value = valueOrDefault(tender.getAmount(), "an unspecified value");

        return "%s matters because it combines %s, %s urgency, and a %s opportunity score. That makes it important for quick bid triage and ownership."
                .formatted(title, value, urgency.toLowerCase(), opportunityScore);
    }

    private List<String> keyRequirements(Tender tender) {
        List<String> requirements = new ArrayList<>();

        if (tender.getEligibility() != null) {
            requirements.addAll(tender.getEligibility().stream().limit(3).toList());
        }

        if (requirements.isEmpty()) {
            requirements.add("Verify buyer eligibility criteria before preparing the technical bid.");
        }

        if (tender.getDocuments() != null && !tender.getDocuments().isEmpty()) {
            requirements.add("Prepare documents: " + String.join(", ", tender.getDocuments().stream().limit(3).toList()));
        }

        return requirements;
    }

    private List<String> recommendedActions(Tender tender, long daysLeft, String riskLevel) {
        List<String> actions = new ArrayList<>();

        if (daysLeft >= 0 && daysLeft <= 10) {
            actions.add("Start compliance review immediately because the deadline is close.");
        } else if (daysLeft > 10) {
            actions.add("Create a bid calendar with document collection, pricing, and review milestones.");
        } else {
            actions.add("Treat this tender as archived unless the buyer reopens or extends the deadline.");
        }

        actions.add("Map every eligibility point to a certificate, work order, or declaration.");

        if ("High".equals(riskLevel)) {
            actions.add("Run a management review on delivery risk, cash flow, and bid security before submission.");
        } else {
            actions.add("Prepare a concise technical response that highlights similar completed work.");
        }

        actions.add("Contact the buyer for clarifications if scope, dates, or document formats are unclear.");
        return actions;
    }

    private String valueOrDefault(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }

    public record AiTenderSummary(
            String title,
            String organization,
            String category,
            LocalDate deadline,
            String summary,
            int opportunityScore,
            String urgency,
            String riskLevel,
            long daysLeft,
            String idealBidder,
            String winStrategy,
            String scope,
            String deadlineSummary,
            String eligibilitySummary,
            List<String> riskFactors,
            List<String> keyRequirements,
            List<String> requiredDocuments,
            String bidRecommendation,
            String whyThisMatters,
            List<String> recommendedActions
    ) {
    }
}
