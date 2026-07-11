package com.tender.backend.dto;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.util.List;

public record TenderRequest(
        @NotBlank(message = "Tender title is required")
        @Size(max = 180, message = "Tender title must be under 180 characters")
        String title,

        @NotBlank(message = "Organization is required")
        @Size(max = 140, message = "Organization must be under 140 characters")
        String organization,

        String referenceNo,
        String buyerType,

        @NotBlank(message = "Category is required")
        String category,

        @NotBlank(message = "Location is required")
        String location,

        @Min(value = 0, message = "Amount cannot be negative")
        Long amountValue,

        String amount,
        String bidSecurity,
        String status,
        LocalDate publishedDate,

        @FutureOrPresent(message = "Deadline cannot be in the past")
        LocalDate deadline,

        String contact,
        List<String> eligibility,
        List<String> documents,

        @Size(max = 4000, message = "Description must be under 4000 characters")
        String description
) {
}
