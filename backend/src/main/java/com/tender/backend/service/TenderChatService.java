package com.tender.backend.service;

import com.tender.backend.dto.ChatRequest;
import com.tender.backend.dto.ChatResponse;
import com.tender.backend.model.AIConversation;
import com.tender.backend.model.Tender;
import com.tender.backend.model.User;
import com.tender.backend.repository.AIConversationRepository;
import com.tender.backend.repository.TenderRepository;
import com.tender.backend.repository.UserRepository;
import com.tender.backend.service.AIService.AIProviderException;
import java.util.List;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TenderChatService {

    private final TenderRepository tenderRepository;
    private final UserRepository userRepository;
    private final AIConversationRepository conversationRepository;
    private final AIService aiService;
    private final TenderAiSummaryService tenderAiSummaryService;

    public TenderChatService(
            TenderRepository tenderRepository,
            UserRepository userRepository,
            AIConversationRepository conversationRepository,
            AIService aiService,
            TenderAiSummaryService tenderAiSummaryService
    ) {
        this.tenderRepository = tenderRepository;
        this.userRepository = userRepository;
        this.conversationRepository = conversationRepository;
        this.aiService = aiService;
        this.tenderAiSummaryService = tenderAiSummaryService;
    }

    @Transactional
    public ChatResponse chat(Long tenderId, ChatRequest request, Authentication authentication) {
        String message = request == null ? "" : request.message();
        if (message == null || message.isBlank()) {
            throw new IllegalArgumentException("Chat message is required.");
        }

        Tender tender = getTender(tenderId);
        User user = getUser(authentication);
        saveMessage(tender, user, "user", message.trim(), null, false);

        List<String> history = conversationRepository.findByTenderIdAndUserIdOrderByCreatedAtAsc(tenderId, user.getId()).stream()
                .filter(item -> !Boolean.TRUE.equals(item.getFallbackUsed()))
                .limit(12)
                .map(item -> item.getRole() + ": " + item.getMessage())
                .toList();

        String answer;
        boolean fallback = false;
        try {
            answer = aiService.askQuestion(tender, message.trim(), history);
        } catch (AIProviderException ex) {
            fallback = true;
            answer = fallbackAnswer(tender, message.trim(), ex.getMessage());
        }

        AIConversation assistantMessage = saveMessage(tender, user, "assistant", answer, aiService.provider(), fallback);
        return ChatResponse.from(assistantMessage);
    }

    @Transactional(readOnly = true)
    public List<ChatResponse> history(Long tenderId, Authentication authentication) {
        User user = getUser(authentication);
        return conversationRepository.findByTenderIdAndUserIdOrderByCreatedAtAsc(tenderId, user.getId()).stream()
                .map(ChatResponse::from)
                .toList();
    }

    @Transactional
    public void clearHistory(Long tenderId, Authentication authentication) {
        User user = getUser(authentication);
        conversationRepository.deleteByTenderIdAndUserId(tenderId, user.getId());
    }

    private AIConversation saveMessage(Tender tender, User user, String role, String message, String provider, boolean fallback) {
        AIConversation conversation = new AIConversation();
        conversation.setTender(tender);
        conversation.setUser(user);
        conversation.setRole(role);
        conversation.setMessage(message);
        conversation.setProvider(provider);
        conversation.setFallbackUsed(fallback);
        return conversationRepository.save(conversation);
    }

    private Tender getTender(Long tenderId) {
        return tenderRepository.findById(tenderId)
                .orElseThrow(() -> new IllegalArgumentException("Tender not found."));
    }

    private User getUser(Authentication authentication) {
        if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
            throw new IllegalArgumentException("Authenticated user is required.");
        }
        return userRepository.findByIdentifier(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("Authenticated user was not found."));
    }

    private String fallbackAnswer(Tender tender, String message, String errorMessage) {
        TenderAiSummaryService.AiTenderSummary summary = tenderAiSummaryService.summarize(tender);
        String normalized = message.toLowerCase();
        String prefix = "The live AI provider is unavailable (" + errorMessage + "), so I used the deterministic tender logic. ";

        if (normalized.contains("document")) {
            return prefix + "Required documents: " + String.join(", ", summary.requiredDocuments()) + ".";
        }
        if (normalized.contains("eligible") || normalized.contains("eligibility")) {
            return prefix + "Key eligibility points: " + String.join("; ", summary.keyRequirements()) + ".";
        }
        if (normalized.contains("win") || normalized.contains("probability")) {
            return prefix + "The opportunity score is " + summary.opportunityScore()
                    + "/100 with " + summary.riskLevel().toLowerCase() + " risk. " + summary.winStrategy();
        }
        if (normalized.contains("deadline") || normalized.contains("date")) {
            return prefix + summary.deadlineSummary();
        }
        return prefix + summary.summary() + " Recommendation: " + summary.bidRecommendation();
    }
}
