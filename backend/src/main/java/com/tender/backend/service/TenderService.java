package com.tender.backend.service;

import com.tender.backend.model.Tender;
import com.tender.backend.repository.TenderRepository;
import com.tender.backend.specification.TenderSpecification;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Predicate;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class TenderService {

    private final TenderRepository tenderRepository;

    public TenderService(TenderRepository tenderRepository) {
        this.tenderRepository = tenderRepository;
    }

    public List<Tender> searchTenders(
            String query,
            String state,
            String organization,
            String category,
            String status,
            BigDecimal minValue,
            BigDecimal maxValue,
            LocalDate publishedFrom,
            LocalDate publishedTo,
            LocalDate closingFrom,
            LocalDate closingTo
    ) {
        Specification<Tender> specification = buildSpecification(
                query,
                state,
                organization,
                category,
                status,
                minValue,
                maxValue,
                publishedFrom,
                publishedTo,
                closingFrom,
                closingTo
        );

        return tenderRepository.findAll(specification);
    }

    public Page<Tender> searchTenders(
            String query,
            String state,
            String organization,
            String category,
            String status,
            BigDecimal minValue,
            BigDecimal maxValue,
            LocalDate publishedFrom,
            LocalDate publishedTo,
            LocalDate closingFrom,
            LocalDate closingTo,
            Pageable pageable
    ) {
        Specification<Tender> specification = buildSpecification(
                query,
                state,
                organization,
                category,
                status,
                minValue,
                maxValue,
                publishedFrom,
                publishedTo,
                closingFrom,
                closingTo
        );

        return tenderRepository.findAll(specification, pageable);
    }

    public Page<Tender> searchTenders(
            String keyword,
            String category,
            String location,
            String status,
            String buyerType,
            Long minAmount,
            Long maxAmount,
            Pageable pageable
    ) {
        Specification<Tender> specification = TenderSpecification.searchAndFilter(
                keyword,
                category,
                location,
                status,
                buyerType,
                minAmount,
                maxAmount
        );

        return tenderRepository.findAll(specification, pageable);
    }

    public List<Tender> findAll() {
        return tenderRepository.findAll();
    }

    public Page<Tender> findAll(Pageable pageable) {
        return tenderRepository.findAll(pageable);
    }

    private Specification<Tender> buildSpecification(
            String query,
            String state,
            String organization,
            String category,
            String status,
            BigDecimal minValue,
            BigDecimal maxValue,
            LocalDate publishedFrom,
            LocalDate publishedTo,
            LocalDate closingFrom,
            LocalDate closingTo
    ) {
        return Specification.where(matchesQuery(query))
                .and(matchesState(state))
                .and(matchesContains("organization", organization))
                .and(matchesContains("category", category))
                .and(matchesTenderStatus(status))
                .and(matchesAmountRange(minValue, maxValue))
                .and(matchesDateRange("publishedDate", publishedFrom, publishedTo))
                .and(matchesDateRange("deadline", closingFrom, closingTo));
    }

    private Specification<Tender> matchesQuery(String query) {
        if (!StringUtils.hasText(query)) {
            return null;
        }

        String like = like(query);
        return (root, criteriaQuery, criteriaBuilder) -> criteriaBuilder.or(
                criteriaBuilder.like(criteriaBuilder.lower(criteriaBuilder.coalesce(root.get("title"), "")), like),
                criteriaBuilder.like(criteriaBuilder.lower(criteriaBuilder.coalesce(root.get("organization"), "")), like),
                criteriaBuilder.like(criteriaBuilder.lower(criteriaBuilder.coalesce(root.get("category"), "")), like),
                criteriaBuilder.like(criteriaBuilder.lower(criteriaBuilder.coalesce(root.get("location"), "")), like),
                criteriaBuilder.like(criteriaBuilder.lower(criteriaBuilder.coalesce(root.get("referenceNo"), "")), like),
                criteriaBuilder.like(criteriaBuilder.lower(criteriaBuilder.coalesce(root.get("description"), "")), like),
                criteriaBuilder.like(criteriaBuilder.lower(criteriaBuilder.coalesce(root.get("contact"), "")), like),
                criteriaBuilder.like(criteriaBuilder.lower(criteriaBuilder.coalesce(root.get("buyerType"), "")), like)
        );
    }

    private Specification<Tender> matchesState(String state) {
        if (!StringUtils.hasText(state) || "all".equalsIgnoreCase(state)) {
            return null;
        }

        String like = like(state);
        return (root, criteriaQuery, criteriaBuilder) -> {
            Expression<String> location = criteriaBuilder.lower(criteriaBuilder.coalesce(root.get("location"), ""));
            return criteriaBuilder.or(
                    criteriaBuilder.like(location, like),
                    criteriaBuilder.like(criteriaBuilder.lower(criteriaBuilder.coalesce(root.get("organization"), "")), like)
            );
        };
    }

    private Specification<Tender> matchesContains(String field, String value) {
        if (!StringUtils.hasText(value) || "all".equalsIgnoreCase(value)) {
            return null;
        }

        String like = like(value);
        return (root, criteriaQuery, criteriaBuilder) ->
                criteriaBuilder.like(criteriaBuilder.lower(criteriaBuilder.coalesce(root.get(field), "")), like);
    }

    private Specification<Tender> matchesTenderStatus(String status) {
        if (!StringUtils.hasText(status) || "all".equalsIgnoreCase(status)) {
            return null;
        }

        return (root, criteriaQuery, criteriaBuilder) -> {
            LocalDate today = LocalDate.now();
            String normalized = status.trim().toLowerCase();
            Expression<String> statusField = criteriaBuilder.lower(criteriaBuilder.coalesce(root.get("status"), ""));

            Predicate statusMatches = criteriaBuilder.equal(statusField, normalized);

            if ("open".equals(normalized)) {
                return criteriaBuilder.or(
                        statusMatches,
                        criteriaBuilder.and(
                                criteriaBuilder.or(
                                        criteriaBuilder.isNull(root.get("deadline")),
                                        criteriaBuilder.greaterThanOrEqualTo(root.get("deadline"), today)
                                ),
                                criteriaBuilder.notEqual(statusField, "closed")
                        )
                );
            }

            if ("closed".equals(normalized)) {
                return criteriaBuilder.or(
                        statusMatches,
                        criteriaBuilder.lessThan(root.get("deadline"), today)
                );
            }

            if ("upcoming".equals(normalized)) {
                return criteriaBuilder.or(
                        statusMatches,
                        criteriaBuilder.greaterThan(root.get("publishedDate"), today)
                );
            }

            return statusMatches;
        };
    }

    private Specification<Tender> matchesAmountRange(BigDecimal minValue, BigDecimal maxValue) {
        if (minValue == null && maxValue == null) {
            return null;
        }

        return (root, criteriaQuery, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (minValue != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("amountValue"), minValue.longValue()));
            }
            if (maxValue != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("amountValue"), maxValue.longValue()));
            }
            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }

    private Specification<Tender> matchesDateRange(String field, LocalDate from, LocalDate to) {
        if (from == null && to == null) {
            return null;
        }

        return (root, criteriaQuery, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (from != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get(field), from));
            }
            if (to != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get(field), to));
            }
            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }

    private String like(String value) {
        return "%" + value.trim().toLowerCase() + "%";
    }
}
