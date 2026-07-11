package com.tender.backend.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tender.backend.config.AIConfig;
import com.tender.backend.model.Tender;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

@Service
public class AIService {

    private static final Logger log = LoggerFactory.getLogger(AIService.class);

    private final AIConfig aiConfig;
    private final ObjectMapper objectMapper;
    private final ObjectProvider<ChatClient.Builder> chatClientBuilder;

    public AIService(AIConfig aiConfig, ObjectMapper objectMapper, ObjectProvider<ChatClient.Builder> chatClientBuilder) {
        this.aiConfig = aiConfig;
        this.objectMapper = objectMapper;
        this.chatClientBuilder = chatClientBuilder;
    }

    public ProviderAnalysis analyzeTender(Tender tender) {
        String prompt = buildAnalysisPrompt(tender);
        String raw = callProvider(prompt);
        return parseAnalysis(raw);
    }

    public String askQuestion(Tender tender, String question) {
        return askQuestion(tender, question, List.of());
    }

    public String askQuestion(Tender tender, String question, List<String> history) {
        String prompt = buildChatPrompt(tender, question, history);
        String content = callProvider(prompt);
        if (content == null || content.isBlank()) {
            return "I could not read the AI provider response. Please try again.";
        }
        try {
            JsonNode root = objectMapper.readTree(stripCodeFence(content));
            String answer = text(root, "answer");
            return answer.isBlank() ? content.trim() : answer;
        } catch (JsonProcessingException ex) {
            return content.trim();
        }
    }

    public String chat(Tender tender, String userMessage, List<String> history) {
        return askQuestion(tender, userMessage, history);
    }

    public String provider() {
        return aiConfig.provider();
    }

    public boolean isConfigured() {
        return aiConfig.hasActiveApiKey();
    }

    private String callProvider(String prompt) {
        if (!aiConfig.hasActiveApiKey()) {
            String requirement = "gemini".equals(aiConfig.provider())
                    ? "Gemini API key or Vertex AI project/credentials"
                    : "OpenAI API key";
            throw new AIProviderException("Missing " + requirement + ".");
        }

        if ("gemini".equals(aiConfig.provider()) && !aiConfig.geminiApiKey().isBlank()) {
            return callGeminiDeveloperApi(prompt);
        }

        ChatClient.Builder builder = chatClientBuilder.getIfAvailable();
        if (builder == null) {
            throw new AIProviderException("Spring AI ChatClient is not configured for provider " + aiConfig.provider() + ".");
        }

        try {
            CompletableFuture<String> request = CompletableFuture.supplyAsync(() -> builder.build()
                    .prompt()
                    .system("You are a tender intelligence analyst for NexTender AI. Return valid JSON when JSON is requested.")
                    .user(prompt)
                    .call()
                    .content());
            String response = request.get(aiConfig.timeout().toSeconds(), TimeUnit.SECONDS);
            if (response == null || response.isBlank()) {
                throw new AIProviderException("AI provider returned an empty response.");
            }
            return response;
        } catch (RestClientResponseException ex) {
            String message = switch (ex.getStatusCode().value()) {
                case 401, 403 -> "AI provider rejected the API key.";
                case 408, 504 -> "AI provider timeout.";
                case 429 -> "AI provider rate limit reached.";
                default -> "AI provider returned HTTP " + ex.getStatusCode().value() + ".";
            };
            log.warn("{} Body: {}", message, ex.getResponseBodyAsString());
            throw new AIProviderException(message, ex);
        } catch (TimeoutException ex) {
            throw new AIProviderException("AI provider timeout.", ex);
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new AIProviderException("AI provider request was interrupted.", ex);
        } catch (ExecutionException ex) {
            Throwable cause = ex.getCause() == null ? ex : ex.getCause();
            String message = classifyProviderFailure(cause);
            log.warn(message, cause);
            throw new AIProviderException(message, cause);
        }
    }

    private String callGeminiDeveloperApi(String prompt) {
        try {
            RestClient client = RestClient.builder()
                    .baseUrl("https://generativelanguage.googleapis.com/v1beta")
                    .requestFactory(ClientHttpRequestFactories.withTimeout(aiConfig.timeout()))
                    .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                    .defaultHeader("x-goog-api-key", aiConfig.geminiApiKey())
                    .build();

            var body = java.util.Map.of(
                    "contents", List.of(java.util.Map.of(
                            "role", "user",
                            "parts", List.of(java.util.Map.of("text", prompt))
                    )),
                    "generationConfig", java.util.Map.of(
                            "temperature", 0.2,
                            "responseMimeType", "application/json"
                    )
            );

            String response = client.post()
                    .uri("/models/{model}:generateContent", aiConfig.geminiModel())
                    .body(body)
                    .retrieve()
                    .body(String.class);

            if (response == null || response.isBlank()) {
                throw new AIProviderException("AI provider returned an empty response.");
            }
            return response;
        } catch (RestClientResponseException ex) {
            String providerDetail = providerErrorDetail(ex);
            String message = switch (ex.getStatusCode().value()) {
                case 400 -> "Gemini API rejected the request" + providerDetail + ".";
                case 401, 403 -> "AI provider rejected the API key" + providerDetail + ".";
                case 408, 504 -> "AI provider timeout.";
                case 429 -> "AI provider rate limit reached.";
                default -> "AI provider returned HTTP " + ex.getStatusCode().value() + providerDetail + ".";
            };
            log.warn("{} Body: {}", message, ex.getResponseBodyAsString());
            throw new AIProviderException(message, ex);
        } catch (ResourceAccessException ex) {
            log.warn("Network failure while calling Gemini API.", ex);
            throw new AIProviderException("Network failure while calling AI provider.", ex);
        }
    }

    private ProviderAnalysis parseAnalysis(String rawResponse) {
        String content = extractProviderText(rawResponse);
        if (content == null || content.isBlank()) {
            throw new AIProviderException("Invalid JSON response from AI provider.");
        }

        try {
            JsonNode root = objectMapper.readTree(stripCodeFence(content));
            return new ProviderAnalysis(
                    text(root, "summary"),
                    integer(root, "opportunityScore", 50),
                    text(root, "riskLevel"),
                    list(root, "eligibilityRequirements"),
                    list(root, "requiredDocuments"),
                    list(root, "riskFactors"),
                    list(root, "recommendedActions"),
                    text(root, "recommendation"),
                    integer(root, "winProbability", 50),
                    list(root, "importantDeadlines"),
                    rawResponse
            );
        } catch (JsonProcessingException ex) {
            log.warn("Invalid JSON response from AI provider: {}", content);
            throw new AIProviderException("Invalid JSON response from AI provider.", ex);
        }
    }

    private String extractProviderText(String rawResponse) {
        try {
            JsonNode root = objectMapper.readTree(rawResponse);
            if (root.has("choices")) {
                return root.path("choices").path(0).path("message").path("content").asText();
            }
            if (root.has("candidates")) {
                return root.path("candidates").path(0).path("content").path("parts").path(0).path("text").asText();
            }
            return rawResponse;
        } catch (JsonProcessingException ex) {
            return rawResponse;
        }
    }

    private String classifyProviderFailure(Throwable ex) {
        if (ex instanceof AIProviderException providerException) {
            return providerException.getMessage();
        }
        if (ex instanceof RestClientResponseException responseException) {
            return switch (responseException.getStatusCode().value()) {
                case 401, 403 -> "AI provider rejected the API key.";
                case 408, 504 -> "AI provider timeout.";
                case 429 -> "AI provider rate limit reached.";
                default -> "AI provider returned HTTP " + responseException.getStatusCode().value() + ".";
            };
        }
        String message = ex.getMessage() == null ? "" : ex.getMessage().toLowerCase();
        if (message.contains("timeout") || message.contains("timed out")) {
            return "AI provider timeout.";
        }
        if (message.contains("429") || message.contains("rate limit")) {
            return "AI provider rate limit reached.";
        }
        if (message.contains("401") || message.contains("403") || message.contains("unauthorized")) {
            return "AI provider rejected the API key.";
        }
        if (message.contains("json")) {
            return "Invalid JSON response from AI provider.";
        }
        return "Network failure while calling AI provider.";
    }

    private String providerErrorDetail(RestClientResponseException ex) {
        String body = ex.getResponseBodyAsString();
        if (body == null || body.isBlank()) {
            return "";
        }
        try {
            JsonNode error = objectMapper.readTree(body).path("error");
            String message = error.path("message").asText("");
            String status = error.path("status").asText("");
            String detail = (status.isBlank() ? "" : status + ": ") + message;
            if (!detail.isBlank()) {
                return ": " + abbreviate(detail);
            }
        } catch (JsonProcessingException ignored) {
            return ": " + abbreviate(body);
        }
        return "";
    }

    private String abbreviate(String value) {
        String normalized = value.replaceAll("\\s+", " ").trim();
        return normalized.length() <= 180 ? normalized : normalized.substring(0, 177) + "...";
    }

    private String buildAnalysisPrompt(Tender tender) {
        return """
                Analyze this tender and return one valid JSON object with exactly these keys:
                summary: string,
                opportunityScore: integer 0-100,
                riskLevel: "Low" | "Medium" | "High",
                eligibilityRequirements: string[],
                requiredDocuments: string[],
                riskFactors: string[],
                recommendedActions: string[],
                recommendation: string,
                winProbability: integer 0-100,
                importantDeadlines: string[].

                Tender:
                %s
                """.formatted(tenderContext(tender));
    }

    private String buildChatPrompt(Tender tender, String userMessage, List<String> history) {
        return """
                You are NexTender AI, a practical tender analyst. Answer the user's question using the tender data.
                Keep the response concise, specific, and useful. Return JSON: {"answer":"..."}.

                Tender:
                %s

                Recent chat:
                %s

                User question:
                %s
                """.formatted(tenderContext(tender), String.join("\n", history), userMessage);
    }

    private String tenderContext(Tender tender) {
        DateTimeFormatter formatter = DateTimeFormatter.ISO_LOCAL_DATE;
        return """
                ID: %s
                Reference: %s
                Title: %s
                Organization: %s
                Buyer type: %s
                Category: %s
                Location: %s
                Amount: %s
                Bid security: %s
                Status: %s
                Published date: %s
                Deadline: %s
                Contact: %s
                Eligibility: %s
                Documents: %s
                Description: %s
                """.formatted(
                tender.getId(),
                tender.getReferenceNo(),
                tender.getTitle(),
                tender.getOrganization(),
                tender.getBuyerType(),
                tender.getCategory(),
                tender.getLocation(),
                tender.getAmount(),
                tender.getBidSecurity(),
                tender.getStatus(),
                tender.getPublishedDate() == null ? "Not specified" : tender.getPublishedDate().format(formatter),
                tender.getDeadline() == null ? "Not specified" : tender.getDeadline().format(formatter),
                tender.getContact(),
                tender.getEligibility(),
                tender.getDocuments(),
                tender.getDescription()
        );
    }

    private String stripCodeFence(String value) {
        String trimmed = value.trim();
        if (!trimmed.startsWith("```")) {
            return trimmed;
        }
        return trimmed.replaceFirst("^```(?:json)?", "").replaceFirst("```$", "").trim();
    }

    private String text(JsonNode root, String key) {
        JsonNode node = root.path(key);
        if ("answer".equals(key) && node.isMissingNode()) {
            node = root.path("message");
        }
        return node.isMissingNode() || node.isNull() ? "" : node.asText();
    }

    private int integer(JsonNode root, String key, int fallback) {
        JsonNode node = root.path(key);
        if (!node.isNumber()) {
            return fallback;
        }
        return Math.max(0, Math.min(100, node.asInt()));
    }

    private List<String> list(JsonNode root, String key) {
        List<String> values = new ArrayList<>();
        JsonNode node = root.path(key);
        if (node.isArray()) {
            node.forEach(item -> {
                String value = item.asText("");
                if (!value.isBlank()) {
                    values.add(value);
                }
            });
        }
        return values;
    }

    public record ProviderAnalysis(
            String summary,
            Integer opportunityScore,
            String riskLevel,
            List<String> eligibilityRequirements,
            List<String> requiredDocuments,
            List<String> riskFactors,
            List<String> recommendedActions,
            String recommendation,
            Integer winProbability,
            List<String> importantDeadlines,
            String rawResponse
    ) {
    }

    public static class AIProviderException extends RuntimeException {
        public AIProviderException(String message) {
            super(message);
        }

        public AIProviderException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
