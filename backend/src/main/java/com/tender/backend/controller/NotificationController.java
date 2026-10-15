package com.tender.backend.controller;

import com.tender.backend.model.UserNotification;
import com.tender.backend.repository.UserNotificationRepository;
import java.security.Principal;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final UserNotificationRepository notificationRepository;

    public NotificationController(UserNotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    @GetMapping
    public List<UserNotification> getNotifications(Principal principal) {
        return notificationRepository.findByRecipientEmailOrderByCreatedAtDesc(principal.getName());
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<UserNotification> markRead(@PathVariable Long id, Principal principal) {
        return notificationRepository.findByIdAndRecipientEmail(id, principal.getName())
                .map(notification -> {
                    notification.setRead(true);
                    return ResponseEntity.ok(notificationRepository.save(notification));
                })
                .orElse(ResponseEntity.notFound().build());
    }
}