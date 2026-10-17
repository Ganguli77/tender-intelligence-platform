package com.tender.backend.repository;

import com.tender.backend.model.User;
import java.time.LocalDateTime;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmailIgnoreCase(String email);

    Optional<User> findByPhoneNumber(String phoneNumber);

    Optional<User> findByNameIgnoreCase(String name);

    Optional<User> findByUsernameIgnoreCase(String username);

    long countByCreatedAtAfter(LocalDateTime createdAt);

    default Optional<User> findByIdentifier(String identifier) {
        if (identifier == null || identifier.isBlank()) {
            return Optional.empty();
        }

        String normalizedIdentifier = identifier.trim();
        return findByEmailIgnoreCase(normalizedIdentifier)
                .or(() -> findByUsernameIgnoreCase(normalizedIdentifier))
                .or(() -> findByNameIgnoreCase(normalizedIdentifier));
    }

    default Optional<User> findByUsername(String username) {
        return findByIdentifier(username);
    }
}
