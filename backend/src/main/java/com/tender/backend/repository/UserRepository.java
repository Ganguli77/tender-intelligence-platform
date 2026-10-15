package com.tender.backend.repository;

import com.tender.backend.model.User;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmailIgnoreCase(String email);

    Optional<User> findByNameIgnoreCase(String name);

    Optional<User> findByUsernameIgnoreCase(String username);

    long countByCreatedAtAfter(LocalDateTime createdAt);

    @Query("""
            select u from User u
            where lower(u.email) = lower(:identifier)
               or lower(u.username) = lower(:identifier)
               or lower(u.name) = lower(:identifier)
            order by u.id asc
            """)
    List<User> findAllByIdentifier(@Param("identifier") String identifier);

    default Optional<User> findByIdentifier(String identifier) {
        return findAllByIdentifier(identifier).stream().findFirst();
    }

    default Optional<User> findByUsername(String username) {
        return findByIdentifier(username);
    }
}
