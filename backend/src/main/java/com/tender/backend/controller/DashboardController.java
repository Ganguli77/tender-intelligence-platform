package com.tender.backend.controller;

import com.tender.backend.dto.ActivityDTO;
import com.tender.backend.dto.DashboardStatsDTO;
import com.tender.backend.dto.OpportunityDistributionDTO;
import com.tender.backend.dto.RecentTenderDTO;
import com.tender.backend.dto.TenderStatusDTO;
import com.tender.backend.service.DashboardService;
import java.security.Principal;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/stats")
    public DashboardStatsDTO getStats(Principal principal) {
        return dashboardService.getStats(userEmail(principal));
    }

    @GetMapping("/status")
    public TenderStatusDTO getStatus() {
        return dashboardService.getStatus();
    }

    @GetMapping("/opportunities")
    public List<OpportunityDistributionDTO> getOpportunities() {
        return dashboardService.getOpportunityDistribution();
    }

    @GetMapping("/recent")
    public List<RecentTenderDTO> getRecent() {
        return dashboardService.getRecentHighScoreTenders();
    }

    @GetMapping("/activity")
    public List<ActivityDTO> getActivity(Principal principal) {
        return dashboardService.getActivity(userEmail(principal));
    }

    private String userEmail(Principal principal) {
        return principal == null ? "anonymous@nextender.local" : principal.getName();
    }
}
