package com.tender.backend.controller;

import com.tender.backend.dto.AIAnalysisResponse;
import com.tender.backend.config.AIConfig;
import com.tender.backend.model.AIAnalysis;
import com.tender.backend.service.AITenderService;
import com.tender.backend.service.AITenderService.DashboardInsights;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai")
public class AIController {

    private final AITenderService aiTenderService;
    private final AIConfig aiConfig;

    public AIController(AITenderService aiTenderService, AIConfig aiConfig) {
        this.aiTenderService = aiTenderService;
        this.aiConfig = aiConfig;
    }

    @GetMapping("/dashboard")
    public DashboardInsights getDashboardInsights() {
        return aiTenderService.getDashboardInsights();
    }

    @GetMapping("/status")
    public Map<String, Object> getAiStatus() {
        return Map.of(
                "provider", aiConfig.provider(),
                "activeModel", aiConfig.activeModel(),
                "configured", aiConfig.hasActiveApiKey(),
                "openAiKeyPresent", !aiConfig.openAiApiKey().isBlank(),
                "geminiApiKeyPresent", !aiConfig.geminiApiKey().isBlank(),
                "geminiProjectPresent", !aiConfig.geminiProjectId().isBlank()
        );
    }

    @GetMapping("/{tenderId}")
    public ResponseEntity<AIAnalysisResponse> getTenderAnalysis(@PathVariable Long tenderId) {
        AIAnalysis analysis = aiTenderService.getAnalysis(tenderId);
        if (analysis == null || Boolean.TRUE.equals(analysis.getFallbackUsed())) {
            analysis = aiTenderService.analyzeTender(tenderId);
        }
        return ResponseEntity.ok(AIAnalysisResponse.from(analysis));
    }

    @PostMapping("/analyze/{tenderId}")
    public ResponseEntity<AIAnalysisResponse> analyzeTender(@PathVariable Long tenderId) {
        return ResponseEntity.ok(AIAnalysisResponse.from(aiTenderService.analyzeTender(tenderId)));
    }

    @GetMapping("/tenders/{tenderId}")
    public ResponseEntity<AIAnalysisResponse> getTenderAnalysisLegacy(@PathVariable Long tenderId) {
        return getTenderAnalysis(tenderId);
    }

    @PostMapping("/tenders/{tenderId}/analyze")
    public ResponseEntity<AIAnalysisResponse> analyzeTenderLegacy(@PathVariable Long tenderId) {
        return analyzeTender(tenderId);
    }

    @GetMapping("/analyses")
    @PreAuthorize("hasRole('ADMIN')")
    public List<AIAnalysisResponse> getAllAnalyses() {
        return aiTenderService.getAllAnalyses().stream()
                .map(AIAnalysisResponse::from)
                .toList();
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleBadRequest(IllegalArgumentException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", ex.getMessage()));
    }
}
