package com.tender.backend.dto;

import com.tender.backend.model.Tender;
import java.time.LocalDate;
import java.util.List;

public record TenderResponse(
        Long id,
        String referenceNo,
        String title,
        String organization,
        String buyerType,
        String category,
        String location,
        Long amountValue,
        String amount,
        String bidSecurity,
        String status,
        LocalDate publishedDate,
        LocalDate deadline,
        String contact,
        List<String> eligibility,
        List<String> documents,
        String description
) {
    public static TenderResponse from(Tender tender) {
        return new TenderResponse(
                tender.getId(),
                tender.getReferenceNo(),
                tender.getTitle(),
                tender.getOrganization(),
                tender.getBuyerType(),
                tender.getCategory(),
                tender.getLocation(),
                tender.getAmountValue(),
                tender.getAmount(),
                tender.getBidSecurity(),
                tender.getStatus(),
                tender.getPublishedDate(),
                tender.getDeadline(),
                tender.getContact(),
                tender.getEligibility() == null ? List.of() : tender.getEligibility(),
                tender.getDocuments() == null ? List.of() : tender.getDocuments(),
                tender.getDescription()
        );
    }
}
