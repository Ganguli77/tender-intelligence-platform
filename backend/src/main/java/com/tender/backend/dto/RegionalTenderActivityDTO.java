package com.tender.backend.dto;

public record RegionalTenderActivityDTO(
        String state,
        long tenderCount,
        long pipelineValue
) {
}
