package com.tender.backend.controller;

import com.tender.backend.dto.AuthDtos.LoginRequest;
import com.tender.backend.dto.AuthDtos.RegisterRequest;
import com.tender.backend.model.User;
import com.tender.backend.service.AuthService;
import com.tender.backend.service.PasswordResetService;
import jakarta.validation.Valid;
import java.util.Map;
import java.util.Optional;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final PasswordResetService passwordResetService;

    public AuthController(AuthService authService, PasswordResetService passwordResetService) {
        this.authService = authService;
        this.passwordResetService = passwordResetService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        try {
            User user = new User();
            user.setName(request.name());
            user.setEmail(request.email());
            user.setPassword(request.password());
            user.setPicture(request.picture());
            user.setRole(request.role());
            return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(user));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", ex.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request.resolvedIdentifier(), request.password())
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "Invalid credentials")));
    }

    @PostMapping("/google")
    public ResponseEntity<?> googleLogin(@RequestBody Map<String, String> request) {
        String googleToken = Optional.ofNullable(request.get("idToken"))
                .orElse(Optional.ofNullable(request.get("credential")).orElse(request.get("token")));

        if (googleToken == null || googleToken.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Google ID token is required"));
        }

        try {
            return ResponseEntity.ok(authService.loginWithGoogle(googleToken));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", ex.getMessage()));
        }
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> request) {
        String username = Optional.ofNullable(request.get("username"))
                .orElse(request.get("identifier"));

        if (username == null || username.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Username or email is required"));
        }

        Optional<String> resetToken = passwordResetService.createResetToken(username.trim());

        if (resetToken.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "No account found for that username or email"));
        }

        return ResponseEntity.ok(Map.of(
                "message", "Use this temporary reset token to set a new password.",
                "resetToken", resetToken.get()
        ));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
        String token = request.get("token");
        String password = request.get("password");

        if (token == null || token.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Reset token is required"));
        }

        try {
            passwordResetService.resetPassword(token.trim(), password);
            return ResponseEntity.ok(Map.of("message", "Password reset successfully"));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
        }
    }
}
