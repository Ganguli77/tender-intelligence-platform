package com.tender.backend.service;

import com.tender.backend.model.User;
import com.tender.backend.repository.UserRepository;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Service
public class GoogleAuthService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final RestClient restClient;
    private final String googleClientId;

    public GoogleAuthService(
            UserRepository userRepository,
            BCryptPasswordEncoder passwordEncoder,
            @Value("${spring.security.oauth2.client.registration.google.client-id:}") String googleClientId
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.googleClientId = googleClientId;
        this.restClient = RestClient.builder()
                .baseUrl("https://oauth2.googleapis.com")
                .build();
    }

    public User authenticate(String googleAccessToken) {
        Map<String, Object> tokenInfo = restClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/tokeninfo")
                        .queryParam("access_token", googleAccessToken)
                        .build())
                .retrieve()
                .body(new ParameterizedTypeReference<>() {
                });

        if (tokenInfo == null || tokenInfo.get("error") != null) {
            throw new IllegalArgumentException("Invalid Google token");
        }

        String audience = stringValue(tokenInfo.get("aud"));
        if (!googleClientId.isBlank() && !googleClientId.equals(audience)) {
            throw new IllegalArgumentException("Google token audience does not match this application");
        }

        String email = stringValue(tokenInfo.get("email")).toLowerCase(Locale.ROOT);
        if (email.isBlank()) {
            throw new IllegalArgumentException("Google account did not provide an email address");
        }

        String verified = stringValue(tokenInfo.get("email_verified"));
        if (!verified.isBlank() && !"true".equalsIgnoreCase(verified)) {
            throw new IllegalArgumentException("Google email address is not verified");
        }

        return userRepository.findByUsername(email).orElseGet(() -> createGoogleUser(email));
    }

    private User createGoogleUser(String email) {
        User user = new User();
        user.setUsername(email);
        user.setPassword(passwordEncoder.encode("GOOGLE:" + UUID.randomUUID()));
        user.setRole("USER");
        return userRepository.save(user);
    }

    private String stringValue(Object value) {
        return value == null ? "" : value.toString().trim();
    }
}
