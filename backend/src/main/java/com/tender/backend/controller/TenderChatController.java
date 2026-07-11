package com.tender.backend.controller;

import com.tender.backend.dto.ChatRequest;
import com.tender.backend.dto.ChatResponse;
import com.tender.backend.service.TenderChatService;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai/chat")
public class TenderChatController {

    private final TenderChatService tenderChatService;

    public TenderChatController(TenderChatService tenderChatService) {
        this.tenderChatService = tenderChatService;
    }

    @PostMapping("/{tenderId}")
    public ChatResponse chat(@PathVariable Long tenderId, @RequestBody ChatRequest request, Authentication authentication) {
        return tenderChatService.chat(tenderId, request, authentication);
    }

    @GetMapping("/{tenderId}/history")
    public List<ChatResponse> history(@PathVariable Long tenderId, Authentication authentication) {
        return tenderChatService.history(tenderId, authentication);
    }

    @DeleteMapping("/{tenderId}/history")
    public ResponseEntity<Void> clearHistory(@PathVariable Long tenderId, Authentication authentication) {
        tenderChatService.clearHistory(tenderId, authentication);
        return ResponseEntity.noContent().build();
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleBadRequest(IllegalArgumentException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", ex.getMessage()));
    }
}
