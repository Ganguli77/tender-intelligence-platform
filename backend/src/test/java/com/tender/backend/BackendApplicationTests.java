package com.tender.backend;

import static org.junit.jupiter.api.Assertions.assertTrue;

import com.tender.backend.model.User;
import com.tender.backend.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class BackendApplicationTests {
	@Autowired
	private AuthService authService;

	@Test
	void contextLoads() {
	}

	@Test
	void newlyRegisteredUserCanLogInWithChosenUsername() {
		User registration = new User();
		registration.setName("Login Test User");
		registration.setEmail("login-test@example.com");
		registration.setUsername("login-test-user");
		registration.setPassword("password123");

		authService.register(registration);

		assertTrue(authService.login("LOGIN-TEST-USER", "password123").isPresent());
	}

}
