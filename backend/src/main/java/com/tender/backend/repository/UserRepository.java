package com.tender.backend.repository;

import com.tender.backend.model.User;
import java.time.LocalDateTime;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmailIgnoreCase(String email);

    Optional<User> findByNameIgnoreCase(String name);

    long countByCreatedAtAfter(LocalDateTime createdAt);

    @Query("""
            select u from User u
            where lower(u.email) = lower(:identifier)
               or lower(u.name) = lower(:identifier)
            """)
    Optional<User> findByIdentifier(@Param("identifier") String identifier);

    default Optional<User> findByUsername(String username) {
        return findByIdentifier(username);
    }
}
