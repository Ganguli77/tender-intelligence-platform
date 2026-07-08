package com.tender.backend.service;

import com.tender.backend.model.User;
import com.tender.backend.repository.UserRepository;
import java.util.Optional;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = new BCryptPasswordEncoder();
    }

    public User register(User input) {
        if (userRepository.findByUsername(input.getUsername()).isPresent()) {
            throw new IllegalArgumentException("Username already exists");
        }

        User user = new User();
        user.setUsername(input.getUsername());
        user.setPassword(passwordEncoder.encode(input.getPassword()));
        user.setRole(input.getRole() == null || input.getRole().isBlank() ? "USER" : input.getRole().toUpperCase());
        return userRepository.save(user);
    }

    public Optional<User> authenticate(String username, String password) {
        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isEmpty()) {
            return Optional.empty();
        }

        User user = userOpt.get();
        if (user.getPassword() != null && passwordEncoder.matches(password, user.getPassword())) {
            return Optional.of(user);
        }

        if (user.getPassword() != null && user.getPassword().equals(password)) {
            user.setPassword(passwordEncoder.encode(password));
            userRepository.save(user);
            return Optional.of(user);
        }

        return Optional.empty();
    }

    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsername(username);
    }
}
