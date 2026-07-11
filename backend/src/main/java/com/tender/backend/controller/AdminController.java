package com.tender.backend.controller;

import com.tender.backend.dto.TenderRequest;
import com.tender.backend.dto.TenderResponse;
import com.tender.backend.model.Tender;
import com.tender.backend.model.User;
import com.tender.backend.repository.TenderRepository;
import com.tender.backend.repository.UserRepository;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final UserRepository userRepository;
    private final TenderRepository tenderRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    public AdminController(UserRepository userRepository, TenderRepository tenderRepository, BCryptPasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.tenderRepository = tenderRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping("/dashboard")
    public AdminDashboardResponse dashboard() {
        LocalDate today = LocalDate.now();
        List<Tender> tenders = tenderRepository.findAll();
        List<User> users = userRepository.findAll();

        long activeTenders = tenders.stream()
                .filter(tender -> tender.getDeadline() == null || !tender.getDeadline().isBefore(today))
                .count();
        long expiredTenders = tenders.stream()
                .filter(tender -> tender.getDeadline() != null && tender.getDeadline().isBefore(today))
                .count();
        long newTendersToday = tenders.stream()
                .filter(tender -> today.equals(tender.getPublishedDate()))
                .count();

        List<UserSummary> recentUsers = users.stream()
                .sorted(Comparator.comparing(User::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(8)
                .map(UserSummary::from)
                .toList();

        List<TenderSummary> recentTenders = tenders.stream()
                .sorted(Comparator.comparing(
                        tender -> tender.getPublishedDate() == null ? LocalDate.MIN.atStartOfDay() : tender.getPublishedDate().atTime(LocalTime.MAX),
                        Comparator.reverseOrder()
                ))
                .limit(8)
                .map(TenderSummary::from)
                .toList();

        return new AdminDashboardResponse(
                users.size(),
                activeTenders,
                expiredTenders,
                newTendersToday,
                recentUsers,
                recentTenders
        );
    }

    @GetMapping("/users")
    public List<UserSummary> users() {
        return userRepository.findAll().stream()
                .sorted(Comparator.comparing(User::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(UserSummary::from)
                .toList();
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<UserSummary> updateUser(@PathVariable Long id, @RequestBody Map<String, String> request) {
        return userRepository.findById(id)
                .map(user -> {
                    if (request.containsKey("name")) user.setName(request.get("name"));
                    if (request.containsKey("email")) user.setEmail(request.get("email"));
                    if (request.containsKey("role")) user.setRole(request.get("role"));
                    return ResponseEntity.ok(UserSummary.from(userRepository.save(user)));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        if (!userRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        userRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/tenders")
    public List<TenderResponse> tenders() {
        return tenderRepository.findAll().stream()
                .sorted(Comparator.comparing(
                        tender -> tender.getPublishedDate() == null ? LocalDate.MIN : tender.getPublishedDate(),
                        Comparator.reverseOrder()
                ))
                .map(TenderResponse::from)
                .toList();
    }

    @PostMapping("/tenders")
    public TenderResponse createTender(@Valid @RequestBody TenderRequest request) {
        Tender tender = new Tender();
        copyTender(request, tender);
        applyDefaults(tender);
        return TenderResponse.from(tenderRepository.save(tender));
    }

    @PutMapping("/tenders/{id}")
    public ResponseEntity<TenderResponse> updateTender(@PathVariable Long id, @Valid @RequestBody TenderRequest request) {
        return tenderRepository.findById(id)
                .map(tender -> {
                    copyTender(request, tender);
                    applyDefaults(tender);
                    return ResponseEntity.ok(TenderResponse.from(tenderRepository.save(tender)));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/tenders/{id}")
    public ResponseEntity<Void> deleteTender(@PathVariable Long id) {
        if (!tenderRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        tenderRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/users")
    public UserSummary createUser(@RequestBody Map<String, String> request) {
        String email = request.getOrDefault("email", "").trim();
        if (email.isBlank()) {
            throw new IllegalArgumentException("Email is required");
        }
        if (userRepository.findByEmailIgnoreCase(email).isPresent()) {
            throw new IllegalArgumentException("Email already exists");
        }
        User user = new User();
        user.setName(request.getOrDefault("name", email));
        user.setEmail(email);
        user.setRole(request.getOrDefault("role", "USER"));
        user.setPassword(passwordEncoder.encode(request.getOrDefault("password", "nextender123")));
        return UserSummary.from(userRepository.save(user));
    }

    public record AdminDashboardResponse(
            long totalUsers,
            long activeTenders,
            long expiredTenders,
            long newTendersToday,
            List<UserSummary> recentUsers,
            List<TenderSummary> recentTenders
    ) {
    }

    public record UserSummary(Long id, String name, String email, String role, String createdAt) {
        static UserSummary from(User user) {
            return new UserSummary(
                    user.getId(),
                    user.getName(),
                    user.getEmail(),
                    user.getRole(),
                    user.getCreatedAt() == null ? "" : user.getCreatedAt().toString()
            );
        }
    }

    public record TenderSummary(Long id, String title, String organization, String status, String publishedDate, String deadline, String amount) {
        static TenderSummary from(Tender tender) {
            return new TenderSummary(
                    tender.getId(),
                    tender.getTitle(),
                    tender.getOrganization(),
                    tender.getStatus(),
                    tender.getPublishedDate() == null ? "" : tender.getPublishedDate().toString(),
                    tender.getDeadline() == null ? "" : tender.getDeadline().toString(),
                    tender.getAmount()
            );
        }
    }

    private void copyTender(TenderRequest source, Tender target) {
        target.setReferenceNo(source.referenceNo());
        target.setTitle(source.title());
        target.setOrganization(source.organization());
        target.setBuyerType(source.buyerType());
        target.setCategory(source.category());
        target.setLocation(source.location());
        target.setAmountValue(source.amountValue());
        target.setAmount(source.amount());
        target.setBidSecurity(source.bidSecurity());
        target.setStatus(source.status());
        target.setPublishedDate(source.publishedDate());
        target.setDeadline(source.deadline());
        target.setContact(source.contact());
        target.setEligibility(source.eligibility() == null ? List.of() : source.eligibility());
        target.setDocuments(source.documents() == null ? List.of() : source.documents());
        target.setDescription(source.description());
    }

    private void applyDefaults(Tender tender) {
        if (tender.getStatus() == null || tender.getStatus().isBlank()) tender.setStatus("Open");
        if (tender.getBuyerType() == null || tender.getBuyerType().isBlank()) tender.setBuyerType("Government");
        if (tender.getPublishedDate() == null) tender.setPublishedDate(LocalDate.now());
        if (tender.getAmountValue() == null) tender.setAmountValue(0L);
        if (tender.getReferenceNo() == null || tender.getReferenceNo().isBlank()) tender.setReferenceNo("TND-" + System.currentTimeMillis());
        if (tender.getAmount() == null || tender.getAmount().isBlank()) tender.setAmount("Value on request");
    }
}
