package com.tender.backend.service;

import com.tender.backend.model.User;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Service;

@Service
public class PasswordResetService {

    private static final long TOKEN_TTL_SECONDS = 15 * 60;

    private final UserService userService;
    private final Map<String, ResetToken> resetTokens = new ConcurrentHashMap<>();

    public PasswordResetService(UserService userService) {
        this.userService = userService;
    }

    public Optional<String> createResetToken(String username) {
        return userService.findByUsername(username)
                .map(user -> {
                    String token = UUID.randomUUID().toString();
                    resetTokens.put(token, new ResetToken(user.getUsername(), Instant.now().plusSeconds(TOKEN_TTL_SECONDS)));
                    return token;
                });
    }

    public void resetPassword(String token, String password) {
        ResetToken resetToken = resetTokens.get(token);

        if (resetToken == null || resetToken.expiresAt().isBefore(Instant.now())) {
            resetTokens.remove(token);
            throw new IllegalArgumentException("Reset link is invalid or expired");
        }

        User updatedUser = userService.updatePassword(resetToken.username(), password);
        resetTokens.remove(token);

        if (updatedUser == null) {
            throw new IllegalArgumentException("Reset link is invalid or expired");
        }
    }

    private record ResetToken(String username, Instant expiresAt) {
    }
}
