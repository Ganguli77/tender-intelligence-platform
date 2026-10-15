package com.tender.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class AuthDtos {
    private AuthDtos() {
    }

    public record RegisterRequest(
            @NotBlank(message = "Name is required")
            String name,

            @Email(message = "Enter a valid email address")
            @NotBlank(message = "Email is required")
            String email,

            String username,

            @Size(min = 6, message = "Password must be at least 6 characters")
            String password,

            String role,
            String picture
    ) {
    }

    public record LoginRequest(
            String identifier,
            String email,
            String username,

            @NotBlank(message = "Password is required")
            String password
    ) {
        public String resolvedIdentifier() {
            if (identifier != null && !identifier.isBlank()) return identifier;
            if (email != null && !email.isBlank()) return email;
            return username;
        }
    }
}
