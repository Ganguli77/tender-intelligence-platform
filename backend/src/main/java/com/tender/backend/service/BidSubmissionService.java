package com.tender.backend.service;

import com.tender.backend.dto.BidSubmissionRequest;
import com.tender.backend.model.BidDocument;
import com.tender.backend.model.BidSubmission;
import com.tender.backend.model.Tender;
import com.tender.backend.model.UserNotification;
import com.tender.backend.repository.BidSubmissionRepository;
import com.tender.backend.repository.UserNotificationRepository;
import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
public class BidSubmissionService {

    private static final long MAX_FILE_SIZE = 10L * 1024 * 1024;
    private static final int MAX_FILES = 5;

    private final BidSubmissionRepository bidSubmissionRepository;
    private final UserNotificationRepository notificationRepository;

    public BidSubmissionService(BidSubmissionRepository bidSubmissionRepository, UserNotificationRepository notificationRepository) {
        this.bidSubmissionRepository = bidSubmissionRepository;
        this.notificationRepository = notificationRepository;
    }

    @Transactional
    public BidSubmission submit(Tender tender, String supplierEmail, BidSubmissionRequest request, List<MultipartFile> files) {
        if (!"PLATFORM".equalsIgnoreCase(tender.getSubmissionMode())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This tender accepts bids through its official external portal");
        }
        if (tender.getDeadline() != null && tender.getDeadline().isBefore(LocalDate.now())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "The submission deadline has passed");
        }
        if (bidSubmissionRepository.findByTender_IdAndSupplierEmail(tender.getId(), supplierEmail).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Your organization has already submitted a bid for this tender");
        }

        List<MultipartFile> uploadedFiles = files == null ? List.of() : files.stream().filter(file -> !file.isEmpty()).toList();
        if (uploadedFiles.size() > MAX_FILES) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Upload no more than five PDF files");
        }

        BidSubmission submission = new BidSubmission();
        submission.setTender(tender);
        submission.setSupplierEmail(supplierEmail);
        submission.setSupplierOrganization(request.supplierOrganization().trim());
        submission.setContactName(request.contactName().trim());
        submission.setContactEmail(request.contactEmail().trim());
        submission.setAmountValue(request.amountValue());
        submission.setProposal(request.proposal().trim());
        submission.setSubmittedAt(LocalDateTime.now());

        for (MultipartFile file : uploadedFiles) {
            validatePdf(file);
            try {
                BidDocument document = new BidDocument();
                document.setSubmission(submission);
                document.setFileName(safeFileName(file.getOriginalFilename()));
                document.setContentType("application/pdf");
                document.setContent(file.getBytes());
                submission.getDocuments().add(document);
            } catch (IOException ex) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A bid document could not be read");
            }
        }

        BidSubmission saved = bidSubmissionRepository.save(submission);
        if (tender.getOwnerEmail() != null && !tender.getOwnerEmail().equalsIgnoreCase(supplierEmail)) {
            UserNotification notification = new UserNotification();
            notification.setRecipientEmail(tender.getOwnerEmail());
            notification.setTitle("New bid received");
            notification.setMessage(submission.getSupplierOrganization() + " submitted a bid for " + tender.getTitle());
            notification.setTenderId(tender.getId());
            notification.setSubmissionId(saved.getId());
            notificationRepository.save(notification);
        }
        return saved;
    }

    @Transactional(readOnly = true)
    public List<BidSubmission> getForTender(Long tenderId) {
        return bidSubmissionRepository.findByTender_IdOrderBySubmittedAtDesc(tenderId);
    }

    @Transactional(readOnly = true)
    public BidDocument getDocument(Long tenderId, Long submissionId, Long documentId, Authentication authentication) {
        BidSubmission submission = bidSubmissionRepository.findById(submissionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Bid submission not found"));
        if (!submission.getTender().getId().equals(tenderId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Bid document not found");
        }
        boolean isOwner = submission.getTender().getOwnerEmail() != null
                && submission.getTender().getOwnerEmail().equalsIgnoreCase(authentication.getName());
        boolean isPlatformAdmin = authentication.getAuthorities().stream()
                .anyMatch(authority -> "ROLE_ADMIN".equals(authority.getAuthority()));
        boolean isSupplier = submission.getSupplierEmail().equalsIgnoreCase(authentication.getName());
        if (!isOwner && !isPlatformAdmin && !isSupplier) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You cannot access this bid document");
        }
        return submission.getDocuments().stream()
                .filter(document -> document.getId().equals(documentId))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Bid document not found"));
    }

    private void validatePdf(MultipartFile file) {
        String name = file.getOriginalFilename() == null ? "" : file.getOriginalFilename();
        if (file.getSize() > MAX_FILE_SIZE || !name.toLowerCase().endsWith(".pdf")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Each attachment must be a PDF no larger than 10 MB");
        }
        try {
            byte[] header = file.getBytes();
            if (header.length < 5 || header[0] != '%' || header[1] != 'P' || header[2] != 'D' || header[3] != 'F' || header[4] != '-') {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "An attachment is not a valid PDF file");
            }
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A bid document could not be read");
        }
    }

    private String safeFileName(String name) {
        String safe = name == null ? "bid-document.pdf" : name.replaceAll("[^a-zA-Z0-9._-]", "-");
        return safe.isBlank() ? "bid-document.pdf" : safe;
    }
}