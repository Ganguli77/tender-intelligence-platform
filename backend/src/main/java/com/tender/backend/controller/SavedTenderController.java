package com.tender.backend.controller;

import com.tender.backend.model.SavedTender;
import com.tender.backend.model.Tender;
import com.tender.backend.service.SavedTenderService;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/saved-tenders")
public class SavedTenderController {

    private final SavedTenderService savedTenderService;

    public SavedTenderController(SavedTenderService savedTenderService) {
        this.savedTenderService = savedTenderService;
    }

    @GetMapping
    public SavedTendersPageResponse getSavedTenders(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Page<SavedTender> savedTenders = savedTenderService.getSavedTenders(userEmail(authentication), page, size);
        return SavedTendersPageResponse.from(savedTenders);
    }

    @PostMapping("/{tenderId}")
    public ResponseEntity<SaveTenderResponse> saveTender(Authentication authentication, @PathVariable Long tenderId) {
        savedTenderService.saveTender(tenderId, userEmail(authentication));
        return ResponseEntity
                .status(HttpStatus.OK)
                .body(new SaveTenderResponse("Tender saved successfully", true));
    }

    @DeleteMapping("/{tenderId}")
    public ResponseEntity<SaveTenderResponse> removeSavedTender(Authentication authentication, @PathVariable Long tenderId) {
        savedTenderService.removeSavedTender(tenderId, userEmail(authentication));
        return ResponseEntity.ok(new SaveTenderResponse("Tender removed successfully", false));
    }

    @GetMapping("/{tenderId}/status")
    public SavedTenderStatusResponse isTenderSaved(Authentication authentication, @PathVariable Long tenderId) {
        return new SavedTenderStatusResponse(savedTenderService.isTenderSaved(tenderId, userEmail(authentication)));
    }

    @GetMapping("/count")
    public SavedTenderCountResponse getSavedCount(Authentication authentication) {
        return new SavedTenderCountResponse(savedTenderService.getSavedCount(userEmail(authentication)));
    }

    private String userEmail(Authentication authentication) {
        return authentication == null ? null : authentication.getName();
    }

    public record SaveTenderResponse(String message, boolean saved) {
    }

    public record SavedTenderStatusResponse(boolean saved) {
    }

    public record SavedTenderCountResponse(long count) {
    }

    public record SavedTenderItemResponse(Long id, LocalDateTime savedAt, Tender tender) {
        static SavedTenderItemResponse from(SavedTender savedTender) {
            return new SavedTenderItemResponse(
                    savedTender.getId(),
                    savedTender.getSavedAt(),
                    savedTender.getTender()
            );
        }
    }

    public record SavedTendersPageResponse(
            List<SavedTenderItemResponse> content,
            long totalElements,
            int totalPages
    ) {
        static SavedTendersPageResponse from(Page<SavedTender> page) {
            return new SavedTendersPageResponse(
                    page.getContent().stream().map(SavedTenderItemResponse::from).toList(),
                    page.getTotalElements(),
                    page.getTotalPages()
            );
        }
    }
}
