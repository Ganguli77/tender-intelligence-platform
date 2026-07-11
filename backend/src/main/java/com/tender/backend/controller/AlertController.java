package com.tender.backend.controller;

import com.tender.backend.model.UserAlert;
import com.tender.backend.service.AlertService;
import java.security.Principal;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/alerts")
public class AlertController {

    private final AlertService alertService;

    public AlertController(AlertService alertService) {
        this.alertService = alertService;
    }

    @GetMapping
    public List<UserAlert> getAlerts(Principal principal) {
        return alertService.getAlerts(userEmail(principal));
    }

    @PostMapping
    public UserAlert createAlert(Principal principal, @RequestBody UserAlert alert) {
        return alertService.createAlert(userEmail(principal), alert);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAlert(Principal principal, @PathVariable Long id) {
        alertService.deleteAlert(userEmail(principal), id);
        return ResponseEntity.noContent().build();
    }

    private String userEmail(Principal principal) {
        return principal == null ? "anonymous@nextender.local" : principal.getName();
    }
}
