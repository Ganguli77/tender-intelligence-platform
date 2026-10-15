package com.tender.backend.service;

import com.tender.backend.model.User;
import com.tender.backend.repository.UserRepository;
import com.tender.backend.security.JwtService;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final RestClient googleClient;
    private final String googleClientId;

    public AuthService(
            UserRepository userRepository,
            BCryptPasswordEncoder passwordEncoder,
            JwtService jwtService,
            @Value("${app.google.client-id:}") String googleClientId
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.googleClientId = googleClientId == null ? "" : googleClientId.trim();
        this.googleClient = RestClient.builder()
                .baseUrl("https://oauth2.googleapis.com")
                .build();
    }

    public AuthResponse register(User input) {
        String email = normalizeEmail(firstNonBlank(input.getEmail(), input.getUsername()));
        String name = firstNonBlank(input.getName(), input.getUsername(), email);
        String username = firstNonBlank(input.getUsername(), email);

        if (email.isBlank()) {
            throw new IllegalArgumentException("Email is required");
        }
        if (input.getPassword() == null || input.getPassword().length() < 6) {
            throw new IllegalArgumentException("Password must be at least 6 characters");
        }
        if (userRepository.findByEmailIgnoreCase(email).isPresent()) {
            throw new IllegalArgumentException("Email already exists");
        }
        if (userRepository.findByUsernameIgnoreCase(username).isPresent()) {
            throw new IllegalArgumentException("Username already exists");
        }

        User user = new User();
        user.setEmail(email);
        user.setName(name);
        user.setUsername(username);
        user.setPicture(input.getPicture());
        user.setPassword(passwordEncoder.encode(input.getPassword()));
        user.setRole("USER");

        return buildResponse(userRepository.save(user));
    }

    public Optional<AuthResponse> login(String identifier, String password) {
        if (identifier == null || identifier.isBlank() || password == null) {
            return Optional.empty();
        }

        Optional<User> userOpt = userRepository.findByIdentifier(identifier.trim());
        if (userOpt.isEmpty()) {
            return Optional.empty();
        }

        User user = userOpt.get();
        if (user.getPassword() == null) {
            return Optional.empty();
        }

        String storedPassword = user.getPassword();
        if (isBcryptHash(storedPassword) && passwordEncoder.matches(password, storedPassword)) {
            return Optional.of(buildResponse(user));
        }

        if (storedPassword.equals(password)) {
            user.setPassword(passwordEncoder.encode(password));
            return Optional.of(buildResponse(userRepository.save(user)));
        }

        return Optional.empty();
    }

    private boolean isBcryptHash(String password) {
        return password.startsWith("$2a$") || password.startsWith("$2b$") || password.startsWith("$2y$");
    }

    public AuthResponse loginWithGoogle(String idToken) {
        if (googleClientId.isBlank()) {
            throw new IllegalArgumentException("Google authentication is not configured");
        }

        Map<String, Object> tokenInfo = googleClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/tokeninfo")
                        .queryParam("id_token", idToken)
                        .build())
                .retrieve()
                .body(new ParameterizedTypeReference<>() {
                });

        if (tokenInfo == null || tokenInfo.get("error") != null) {
            throw new IllegalArgumentException("Invalid Google ID token");
        }

        String audience = stringValue(tokenInfo.get("aud"));
        if (!googleClientId.equals(audience)) {
            throw new IllegalArgumentException("Google token audience does not match this application");
        }

        String email = normalizeEmail(tokenInfo.get("email"));
        if (email.isBlank()) {
            throw new IllegalArgumentException("Google account did not provide an email address");
        }

        String verified = stringValue(tokenInfo.get("email_verified"));
        if (!verified.isBlank() && !"true".equalsIgnoreCase(verified)) {
            throw new IllegalArgumentException("Google email address is not verified");
        }

        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseGet(() -> createGoogleUser(tokenInfo, email));

        boolean changed = false;
        String name = firstNonBlank(stringValue(tokenInfo.get("name")), user.getName(), email);
        String picture = firstNonBlank(stringValue(tokenInfo.get("picture")), user.getPicture());
        if (!name.equals(user.getName())) {
            user.setName(name);
            changed = true;
        }
        if (picture != null && !picture.equals(user.getPicture())) {
            user.setPicture(picture);
            changed = true;
        }

        return buildResponse(changed ? userRepository.save(user) : user);
    }

    public AuthResponse buildResponse(User user) {
        return new AuthResponse(jwtService.generateToken(user), UserDto.from(user));
    }

    private User createGoogleUser(Map<String, Object> tokenInfo, String email) {
        User user = new User();
        user.setEmail(email);
        user.setName(firstNonBlank(stringValue(tokenInfo.get("name")), email));
        user.setPicture(stringValue(tokenInfo.get("picture")));
        user.setPassword(passwordEncoder.encode("GOOGLE:" + UUID.randomUUID()));
        user.setRole(User.Role.USER);
        return userRepository.save(user);
    }

    private String normalizeEmail(Object value) {
        return stringValue(value).toLowerCase(Locale.ROOT);
    }

    private String stringValue(Object value) {
        return value == null ? "" : value.toString().trim();
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value.trim();
            }
        }
        return "";
    }

    public record AuthResponse(String token, UserDto user) {
        public String getName() {
            return user.name();
        }

        public String getEmail() {
            return user.email();
        }

        public String getUsername() {
            return user.email();
        }

        public String getRole() {
            return user.role();
        }
    }

    public record UserDto(Long id, String name, String email, String picture, String role, String createdAt) {
        static UserDto from(User user) {
            return new UserDto(
                    user.getId(),
                    user.getName(),
                    user.getEmail(),
                    user.getPicture(),
                    user.getRole(),
                    user.getCreatedAt() == null ? null : user.getCreatedAt().toString()
            );
        }
    }
}
