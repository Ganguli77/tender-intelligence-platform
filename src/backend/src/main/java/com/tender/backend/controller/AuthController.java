package com.tender.backend.controller;

import com.tender.backend.model.User;
import com.tender.backend.security.JwtService;
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

    public AuthController(UserService userService, JwtService jwtService) {
        this.userService = userService;
        this.jwtService = jwtService;
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
}
