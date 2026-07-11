package com.tender.backend.config;

import jakarta.annotation.PostConstruct;
import java.time.Duration;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class AIConfig {

    private static final Logger log = LoggerFactory.getLogger(AIConfig.class);

    private final String provider;
    private final String openAiApiKey;
    private final String openAiModel;
    private final String geminiApiKey;
    private final String geminiModel;
    private final String geminiProjectId;
    private final String geminiLocation;
    private final String geminiCredentialsUri;
    private final Duration timeout;

    public AIConfig(
            @Value("${ai.provider:${AI_PROVIDER:openai}}") String provider,
            @Value("${ai.openai.api-key:${OPENAI_API_KEY:}}") String openAiApiKey,
            @Value("${ai.openai.model:${OPENAI_MODEL:gpt-4o-mini}}") String openAiModel,
            @Value("${ai.gemini.api-key:${GEMINI_API_KEY:}}") String geminiApiKey,
            @Value("${ai.gemini.model:${GEMINI_MODEL:gemini-2.0-flash}}") String geminiModel,
            @Value("${spring.ai.vertex.ai.gemini.project-id:${GEMINI_PROJECT_ID:${GOOGLE_CLOUD_PROJECT:}}}") String geminiProjectId,
            @Value("${spring.ai.vertex.ai.gemini.location:${GEMINI_LOCATION:us-central1}}") String geminiLocation,
            @Value("${spring.ai.vertex.ai.gemini.credentials-uri:${GEMINI_CREDENTIALS_URI:}}") String geminiCredentialsUri,
            @Value("${ai.timeout-seconds:${AI_TIMEOUT_SECONDS:30}}") long timeoutSeconds
    ) {
        this.openAiApiKey = openAiApiKey == null ? "" : openAiApiKey.trim();
        this.openAiModel = openAiModel;
        this.geminiApiKey = geminiApiKey == null ? "" : geminiApiKey.trim();
        this.geminiModel = geminiModel;
        this.geminiProjectId = geminiProjectId == null ? "" : geminiProjectId.trim();
        this.geminiLocation = geminiLocation == null ? "" : geminiLocation.trim();
        this.geminiCredentialsUri = geminiCredentialsUri == null ? "" : geminiCredentialsUri.trim();
        this.timeout = Duration.ofSeconds(Math.max(5, timeoutSeconds));
        this.provider = normalizeProvider(provider);
    }

    @PostConstruct
    public void logConfiguration() {
        log.info(
                "AI configuration loaded: provider={}, activeModel={}, configured={}, openAiKeyPresent={}, geminiApiKeyPresent={}, geminiProjectPresent={}",
                provider,
                activeModel(),
                hasActiveApiKey(),
                !openAiApiKey.isBlank(),
                !geminiApiKey.isBlank(),
                !geminiProjectId.isBlank()
        );
    }

    public String provider() {
        return provider;
    }

    public String activeApiKey() {
        return "gemini".equals(provider) ? geminiApiKey : openAiApiKey;
    }

    public String activeModel() {
        return "gemini".equals(provider) ? geminiModel : openAiModel;
    }

    public String openAiApiKey() {
        return openAiApiKey;
    }

    public String openAiModel() {
        return openAiModel;
    }

    public String geminiApiKey() {
        return geminiApiKey;
    }

    public String geminiModel() {
        return geminiModel;
    }

    public String geminiProjectId() {
        return geminiProjectId;
    }

    public String geminiLocation() {
        return geminiLocation;
    }

    public String geminiCredentialsUri() {
        return geminiCredentialsUri;
    }

    public Duration timeout() {
        return timeout;
    }

    public boolean hasActiveApiKey() {
        if ("gemini".equals(provider)) {
            return !geminiApiKey.isBlank() || !geminiProjectId.isBlank();
        }
        return !openAiApiKey.isBlank();
    }

    private String normalizeProvider(String value) {
        if (value == null) {
            return "openai";
        }
        String normalized = value.trim().toLowerCase();
        if ("gemini".equals(normalized) || "vertexai".equals(normalized)) {
            return "gemini";
        }
        if (openAiApiKey.isBlank() && (!geminiApiKey.isBlank() || !geminiProjectId.isBlank())) {
            return "gemini";
        }
        return "openai";
    }
}
