package com.tender.backend.controller;

import com.tender.backend.model.User;
import com.tender.backend.security.JwtService;
import com.tender.backend.service.GoogleAuthService;
import com.tender.backend.service.UserService;
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

    private final UserService userService;
    private final JwtService jwtService;
    private final GoogleAuthService googleAuthService;

    public AuthController(UserService userService, JwtService jwtService, GoogleAuthService googleAuthService) {
        this.userService = userService;
        this.jwtService = jwtService;
        this.googleAuthService = googleAuthService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {
        try {
            User savedUser = userService.register(user);
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                    "message", "User registered successfully",
                    "username", savedUser.getUsername(),
                    "role", savedUser.getRole()
            ));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", ex.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody User user) {
        Optional<User> authenticated = userService.authenticate(user.getUsername(), user.getPassword());

        if (authenticated.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Invalid credentials"));
        }

        User dbUser = authenticated.get();
        String token = jwtService.generateToken(dbUser.getUsername(), dbUser.getRole());
        return ResponseEntity.ok(Map.of(
                "token", token,
                "username", dbUser.getUsername(),
                "role", dbUser.getRole()
        ));
    }

    @PostMapping("/google")
    public ResponseEntity<?> googleLogin(@RequestBody Map<String, String> request) {
        String googleToken = Optional.ofNullable(request.get("token"))
                .orElse(request.get("credential"));

        if (googleToken == null || googleToken.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Google token is required"));
        }

        try {
            User googleUser = googleAuthService.authenticate(googleToken);
            String token = jwtService.generateToken(googleUser.getUsername(), googleUser.getRole());
            return ResponseEntity.ok(Map.of(
                    "token", token,
                    "username", googleUser.getUsername(),
                    "role", googleUser.getRole()
            ));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", ex.getMessage()));
        }
    }
}
