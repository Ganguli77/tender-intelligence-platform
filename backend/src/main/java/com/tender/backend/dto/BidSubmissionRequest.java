package com.tender.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record BidSubmissionRequest(
        @NotBlank @Size(max = 180) String supplierOrganization,
        @NotBlank @Size(max = 140) String contactName,
        @NotBlank @Email @Size(max = 180) String contactEmail,
        @Min(0) Long amountValue,
        @NotBlank @Size(max = 4000) String proposal
) {
}