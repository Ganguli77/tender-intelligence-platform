package com.tender.backend.specification;

import com.tender.backend.model.Tender;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

public final class TenderSpecification {

    private TenderSpecification() {
    }

    public static Specification<Tender> searchAndFilter(
            String keyword,
            String category,
            String location,
            String status,
            String buyerType,
            Long minAmount,
            Long maxAmount
    ) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (StringUtils.hasText(keyword)) {
                String like = like(keyword);
                predicates.add(criteriaBuilder.or(
                        containsIgnoreCase(criteriaBuilder, root.get("title"), like),
                        containsIgnoreCase(criteriaBuilder, root.get("organization"), like),
                        containsIgnoreCase(criteriaBuilder, root.get("category"), like),
                        containsIgnoreCase(criteriaBuilder, root.get("location"), like),
                        containsIgnoreCase(criteriaBuilder, root.get("referenceNo"), like)
                ));
            }

            addContainsPredicate(predicates, criteriaBuilder, root.get("category"), category);
            addContainsPredicate(predicates, criteriaBuilder, root.get("location"), location);
            addEqualsPredicate(predicates, criteriaBuilder, root.get("status"), status);
            addEqualsPredicate(predicates, criteriaBuilder, root.get("buyerType"), buyerType);

            if (minAmount != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("amountValue"), minAmount));
            }
            if (maxAmount != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("amountValue"), maxAmount));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }

    private static void addContainsPredicate(
            List<Predicate> predicates,
            jakarta.persistence.criteria.CriteriaBuilder criteriaBuilder,
            Expression<String> field,
            String value
    ) {
        if (StringUtils.hasText(value)) {
            predicates.add(containsIgnoreCase(criteriaBuilder, field, like(value)));
        }
    }

    private static void addEqualsPredicate(
            List<Predicate> predicates,
            jakarta.persistence.criteria.CriteriaBuilder criteriaBuilder,
            Expression<String> field,
            String value
    ) {
        if (StringUtils.hasText(value)) {
            predicates.add(criteriaBuilder.equal(
                    criteriaBuilder.lower(criteriaBuilder.coalesce(field, "")),
                    value.trim().toLowerCase()
            ));
        }
    }

    private static Predicate containsIgnoreCase(
            jakarta.persistence.criteria.CriteriaBuilder criteriaBuilder,
            Expression<String> field,
            String like
    ) {
        return criteriaBuilder.like(criteriaBuilder.lower(criteriaBuilder.coalesce(field, "")), like);
    }

    private static String like(String value) {
        return "%" + value.trim().toLowerCase() + "%";
    }
}
