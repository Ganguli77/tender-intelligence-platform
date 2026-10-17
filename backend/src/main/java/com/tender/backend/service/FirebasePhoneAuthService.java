package com.tender.backend.service;

import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

@Service
public class FirebasePhoneAuthService {

    private final RestClient firebaseClient;
    private final String webApiKey;

    public FirebasePhoneAuthService(@Value("${app.firebase.web-api-key:}") String webApiKey) {
        this.webApiKey = webApiKey == null ? "" : webApiKey.trim();
        this.firebaseClient = RestClient.builder()
                .baseUrl("https://identitytoolkit.googleapis.com/v1")
                .build();
    }

    public String verifyPhoneIdToken(String idToken) {
        if (webApiKey.isBlank()) {
            throw new IllegalStateException("Firebase phone authentication is not configured");
        }
        if (idToken == null || idToken.isBlank()) {
            throw new IllegalArgumentException("Firebase ID token is required");
        }

        Map<String, Object> response;
        try {
            response = firebaseClient.post()
                    .uri(uriBuilder -> uriBuilder
                            .path("/accounts:lookup")
                            .queryParam("key", webApiKey)
                            .build())
                    .body(Map.of("idToken", idToken))
                    .retrieve()
                    .body(new ParameterizedTypeReference<>() {
                    });
        } catch (RestClientResponseException exception) {
            throw new IllegalArgumentException("Firebase phone token could not be verified");
        }

        Object rawUsers = response == null ? null : response.get("users");
        if (!(rawUsers instanceof List<?> users) || users.isEmpty() || !(users.get(0) instanceof Map<?, ?> user)) {
            throw new IllegalArgumentException("Firebase token does not identify a phone account");
        }

        Object rawPhoneNumber = user.get("phoneNumber");
        String phoneNumber = rawPhoneNumber == null ? "" : rawPhoneNumber.toString().trim();
        if (!phoneNumber.matches("^\\+[1-9]\\d{7,14}$")) {
            throw new IllegalArgumentException("Firebase token does not contain a valid verified phone number");
        }

        return phoneNumber;
    }
}
