package com.tender.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.tender.backend.dto.BidSubmissionRequest;
import com.tender.backend.model.BidSubmission;
import com.tender.backend.model.Tender;
import com.tender.backend.model.UserNotification;
import com.tender.backend.repository.BidSubmissionRepository;
import com.tender.backend.repository.UserNotificationRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.server.ResponseStatusException;

class BidSubmissionServiceTest {

    private final BidSubmissionRepository submissions = org.mockito.Mockito.mock(BidSubmissionRepository.class);
    private final UserNotificationRepository notifications = org.mockito.Mockito.mock(UserNotificationRepository.class);
    private final BidSubmissionService service = new BidSubmissionService(submissions, notifications);

    @Test
    void savesPlatformBidAndNotifiesTenderOwner() {
        Tender tender = tender("PLATFORM");
        when(submissions.findByTender_IdAndSupplierEmail(12L, "supplier@example.com")).thenReturn(Optional.empty());
        when(submissions.save(any(BidSubmission.class))).thenAnswer(invocation -> {
            BidSubmission saved = invocation.getArgument(0);
            saved.setId(41L);
            return saved;
        });
        MockMultipartFile pdf = new MockMultipartFile("files", "proposal.pdf", "application/pdf", "%PDF-1.7 proposal".getBytes());
        BidSubmissionRequest request = new BidSubmissionRequest(
                "Supplier Ltd", "Sam Supplier", "sam@example.com", 250000L, "Delivery plan and experience"
        );

        BidSubmission saved = service.submit(tender, "supplier@example.com", request, List.of(pdf));

        assertEquals(41L, saved.getId());
        assertEquals("proposal.pdf", saved.getDocuments().get(0).getFileName());
        verify(notifications).save(any(UserNotification.class));
    }

    @Test
    void rejectsPlatformSubmissionForExternalTender() {
        Tender tender = tender("EXTERNAL_LINK");
        BidSubmissionRequest request = new BidSubmissionRequest(
                "Supplier Ltd", "Sam Supplier", "sam@example.com", null, "Proposal"
        );

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> service.submit(tender, "supplier@example.com", request, List.of())
        );

        assertEquals(HttpStatus.CONFLICT, error.getStatusCode());
        verify(submissions, never()).save(any(BidSubmission.class));
        verify(notifications, never()).save(any(UserNotification.class));
    }

    private Tender tender(String mode) {
        Tender tender = new Tender();
        tender.setId(12L);
        tender.setTitle("Water pipeline tender");
        tender.setOwnerEmail("issuer@example.com");
        tender.setSubmissionMode(mode);
        tender.setDeadline(LocalDate.now().plusDays(5));
        return tender;
    }
}
