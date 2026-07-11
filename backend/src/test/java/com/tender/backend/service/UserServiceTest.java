package com.tender.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

import com.tender.backend.model.User;
import com.tender.backend.repository.UserRepository;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserService userService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void authenticateShouldSupportLegacyPlaintextPasswords() {
        User user = new User();
        user.setUsername("admin");
        user.setPassword("admin123");
        user.setRole("ADMIN");

        when(userRepository.findByUsername("admin")).thenReturn(Optional.of(user));

        Optional<User> authenticated = userService.authenticate("admin", "admin123");

        assertTrue(authenticated.isPresent());
        assertEquals("admin", authenticated.get().getUsername());
    }
}
