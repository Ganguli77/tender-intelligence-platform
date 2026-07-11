package com.tender.backend.service;

import com.tender.backend.model.UserAlert;
import com.tender.backend.repository.UserAlertRepository;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class AlertService {

    private final UserAlertRepository userAlertRepository;

    public AlertService(UserAlertRepository userAlertRepository) {
        this.userAlertRepository = userAlertRepository;
    }

    public List<UserAlert> getAlerts(String userEmail) {
        return userAlertRepository.findByUserEmailOrderByCreatedAtDesc(userEmail);
    }

    public UserAlert createAlert(String userEmail, UserAlert alert) {
        alert.setId(null);
        alert.setUserEmail(userEmail);
        if (alert.getName() == null || alert.getName().isBlank()) {
            alert.setName("AI Tender Alert");
        }
        if (alert.getMinOpportunityScore() == null) {
            alert.setMinOpportunityScore(70);
        }
        if (alert.getActive() == null) {
            alert.setActive(true);
        }
        return userAlertRepository.save(alert);
    }

    public void deleteAlert(String userEmail, Long id) {
        userAlertRepository.findById(id)
                .filter(alert -> userEmail.equals(alert.getUserEmail()))
                .ifPresent(userAlertRepository::delete);
    }
}
