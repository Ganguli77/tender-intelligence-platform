package com.tender.backend.dto;

import com.tender.backend.model.BidDocument;
import com.tender.backend.model.BidSubmission;
import java.time.LocalDateTime;
import java.util.List;

public record BidSubmissionResponse(
        Long id,
        Long tenderId,
        String supplierEmail,
        String supplierOrganization,
        String contactName,
        String contactEmail,
        Long amountValue,
        String status,
        String proposal,
        LocalDateTime submittedAt,
        List<DocumentInfo> documents
) {
    public static BidSubmissionResponse from(BidSubmission submission) {
        return new BidSubmissionResponse(
                submission.getId(),
                submission.getTender().getId(),
                submission.getSupplierEmail(),
                submission.getSupplierOrganization(),
                submission.getContactName(),
                submission.getContactEmail(),
                submission.getAmountValue(),
                submission.getStatus(),
                submission.getProposal(),
                submission.getSubmittedAt(),
                submission.getDocuments().stream()
                        .map(document -> new DocumentInfo(document.getId(), document.getFileName()))
                        .toList()
        );
    }

    public record DocumentInfo(Long id, String fileName) {
    }
}