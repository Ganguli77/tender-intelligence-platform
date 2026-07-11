package com.tender.backend.dto;

public record DashboardStatsDTO(
        long totalTenders,
        long activeTenders,
        long closingSoonTenders,
        long expiredTenders,
        long savedTenders,
        long aiMatches,
        String totalTrend,
        String activeTrend,
        String savedTrend,
        String aiMatchesTrend
) {
}
