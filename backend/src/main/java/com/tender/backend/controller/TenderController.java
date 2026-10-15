package com.tender.backend.controller;

import com.tender.backend.dto.TenderRequest;
import com.tender.backend.dto.TenderResponse;
import com.tender.backend.dto.BidSubmissionRequest;
import com.tender.backend.dto.BidSubmissionResponse;
import com.tender.backend.model.BidDocument;
import com.tender.backend.model.BidSubmission;
import com.tender.backend.model.Tender;
import com.tender.backend.repository.TenderRepository;
import com.tender.backend.service.BidSubmissionService;
import com.tender.backend.service.TenderAiInsightsService;
import com.tender.backend.service.TenderAiInsightsService.AiInsights;
import com.tender.backend.service.TenderAiSummaryService;
import com.tender.backend.service.TenderAiSummaryService.AiTenderSummary;
import com.tender.backend.service.TenderRecommendationService;
import com.tender.backend.service.TenderRecommendationService.TenderRecommendation;
import com.tender.backend.service.TenderService;
import java.math.BigDecimal;
import java.net.URI;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.TreeMap;
import java.util.stream.Collectors;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/tenders")
public class TenderController {

    private final TenderRepository tenderRepository;
    private final TenderService tenderService;
    private final TenderAiSummaryService tenderAiSummaryService;
    private final TenderAiInsightsService tenderAiInsightsService;
    private final TenderRecommendationService tenderRecommendationService;
    private final BidSubmissionService bidSubmissionService;

    public TenderController(
            TenderRepository tenderRepository,
            TenderService tenderService,
            TenderAiSummaryService tenderAiSummaryService,
            TenderAiInsightsService tenderAiInsightsService,
            TenderRecommendationService tenderRecommendationService,
            BidSubmissionService bidSubmissionService
    ) {
        this.tenderRepository = tenderRepository;
        this.tenderService = tenderService;
        this.tenderAiSummaryService = tenderAiSummaryService;
        this.tenderAiInsightsService = tenderAiInsightsService;
        this.tenderRecommendationService = tenderRecommendationService;
        this.bidSubmissionService = bidSubmissionService;
    }

    @GetMapping("/mine")
    @Transactional(readOnly = true)
    public List<TenderResponse> getMyTenders(Authentication authentication) {
        return tenderRepository.findByOwnerEmailOrderByPublishedDateDesc(authentication.getName()).stream()
                .map(this::initializeTenderCollections)
                .map(TenderResponse::from)
                .toList();
    }

    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<Page<Tender>> getAllTenders(
            @RequestParam(required = false, name = "q") String query,
            @RequestParam(required = false) String state,
            @RequestParam(required = false) String organization,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) BigDecimal minValue,
            @RequestParam(required = false) BigDecimal maxValue,
            @RequestParam(required = false) LocalDate publishedFrom,
            @RequestParam(required = false) LocalDate publishedTo,
            @RequestParam(required = false) LocalDate closingFrom,
            @RequestParam(required = false) LocalDate closingTo,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "publishedDate") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir
    ) {
        if (!isValidPaginationRequest(page, size, sortBy, sortDir)) {
            return ResponseEntity.badRequest().build();
        }

        Sort sort = sortDir.equalsIgnoreCase("asc")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<Tender> tenders = tenderService.searchTenders(
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
                closingTo,
                pageable
        ).map(this::initializeTenderCollections);

        return ResponseEntity.ok(tenders);
    }

    @GetMapping("/insights")
    @Transactional(readOnly = true)
    public TenderInsights getTenderInsights() {
        List<Tender> tenders = tenderService.findAll();
        initializeTenderCollections(tenders);
        LocalDate today = LocalDate.now();
        long total = tenderRepository.count();

        long active = tenders.stream()
                .filter(tender -> tender.getDeadline() == null || !tender.getDeadline().isBefore(today))
                .count();
        long expired = Math.max(total - active, 0);
        long totalValue = tenders.stream()
                .map(Tender::getAmountValue)
                .filter(Objects::nonNull)
                .mapToLong(Long::longValue)
                .sum();

        Map<String, Long> byCategory = tenders.stream()
                .collect(Collectors.groupingBy(
                        tender -> valueOrDefault(tender.getCategory(), "General"),
                        TreeMap::new,
                        Collectors.counting()
                ));

        Map<String, Long> byStatus = tenders.stream()
                .collect(Collectors.groupingBy(
                        tender -> valueOrDefault(tender.getStatus(), "Open"),
                        TreeMap::new,
                        Collectors.counting()
                ));

        List<Tender> closingSoon = tenders.stream()
                .filter(tender -> tender.getDeadline() != null && !tender.getDeadline().isBefore(today))
                .sorted(Comparator.comparing(Tender::getDeadline))
                .limit(5)
                .toList();

        return new TenderInsights(
                total,
                active,
                expired,
                totalValue,
                byCategory.size(),
                byCategory,
                byStatus,
                closingSoon
        );
    }

    @GetMapping("/search")
    @Transactional(readOnly = true)
    public Page<TenderResponse> searchTenders(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String buyerType,
            @RequestParam(required = false) Long minAmount,
            @RequestParam(required = false) Long maxAmount,
            @RequestParam(defaultValue = "deadline") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir,
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "10") Integer size
    ) {
        Pageable pageable = PageRequest.of(
                Math.max(page, 0),
                Math.max(size, 1),
                buildSearchSort(sortBy, sortDir)
        );

        return tenderService.searchTenders(
                keyword,
                category,
                location,
                status,
                buyerType,
                minAmount,
                maxAmount,
                pageable
        ).map(tender -> TenderResponse.from(initializeTenderCollections(tender)));
    }

    @GetMapping("/ai-insights")
    @Transactional(readOnly = true)
    public AiInsights getTenderAiInsights() {
        List<Tender> tenders = tenderService.findAll();
        initializeTenderCollections(tenders);
        try {
            return tenderAiInsightsService.summarize(tenders);
        } catch (Exception ex) {
            return buildFallbackAiInsights(tenders);
        }
    }

    @GetMapping("/recommendations")
    @Transactional(readOnly = true)
    public List<TenderRecommendation> getTenderRecommendations(
            @RequestParam(required = false) String viewedTenderIds,
            @RequestParam(required = false) String keywords,
            @RequestParam(required = false) Integer limit
    ) {
        return tenderRecommendationService.recommend(parseIds(viewedTenderIds), keywords, limit);
    }

    @GetMapping("/{id:\\d+}")
    @Transactional(readOnly = true)
    public ResponseEntity<TenderResponse> getTenderById(@PathVariable Long id) {
        return tenderRepository.findById(id)
                .map(this::initializeTenderCollections)
                .map(TenderResponse::from)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

            @PostMapping(value = "/{id}/submissions", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
            @Transactional
            public ResponseEntity<BidSubmissionResponse> submitBid(
                @PathVariable Long id,
                @Valid @RequestPart("submission") BidSubmissionRequest request,
                @RequestPart(value = "files", required = false) List<MultipartFile> files,
                Authentication authentication
            ) {
            Tender tender = tenderRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tender not found"));
            BidSubmission submission = bidSubmissionService.submit(tender, authentication.getName(), request, files);
            return ResponseEntity.status(HttpStatus.CREATED).body(BidSubmissionResponse.from(submission));
            }

            @GetMapping("/{id}/submissions")
            @Transactional(readOnly = true)
            public List<BidSubmissionResponse> getTenderSubmissions(@PathVariable Long id, Authentication authentication) {
            Tender tender = tenderRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tender not found"));
            requireTenderManager(tender, authentication);
            return bidSubmissionService.getForTender(id).stream().map(BidSubmissionResponse::from).toList();
            }

            @GetMapping("/{id}/submissions/{submissionId}/documents/{documentId}")
            @Transactional(readOnly = true)
            public ResponseEntity<byte[]> downloadBidDocument(
                @PathVariable Long id,
                @PathVariable Long submissionId,
                @PathVariable Long documentId,
                Authentication authentication
            ) {
            BidDocument document = bidSubmissionService.getDocument(id, submissionId, documentId, authentication);
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDisposition(ContentDisposition.attachment().filename(document.getFileName()).build());
            headers.set("X-Content-Type-Options", "nosniff");
            return new ResponseEntity<>(document.getContent(), headers, HttpStatus.OK);
            }

    @GetMapping("/{id:\\d+}/ai-summary")
    @Transactional(readOnly = true)
    public ResponseEntity<AiTenderSummary> getTenderAiSummary(@PathVariable Long id) {
        return tenderRepository.findById(id)
                .map(tenderAiSummaryService::summarize)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public TenderResponse createTender(@Valid @RequestBody TenderRequest request, Authentication authentication) {
        Tender tender = toTender(request);
        tender.setOwnerEmail(authentication.getName());
        applyDefaults(tender);
        return TenderResponse.from(initializeTenderCollections(tenderRepository.save(tender)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TenderResponse> updateTender(
            @PathVariable Long id,
            @Valid @RequestBody TenderRequest request,
            Authentication authentication
    ) {
        return tenderRepository.findById(id)
                .map(tender -> {
                requireTenderManager(tender, authentication);
                    copyTenderFields(request, tender);
                    applyDefaults(tender);
                    return ResponseEntity.ok(TenderResponse.from(initializeTenderCollections(tenderRepository.save(tender))));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTender(@PathVariable Long id, Authentication authentication) {
        Tender tender = tenderRepository.findById(id).orElse(null);
        if (tender == null) return ResponseEntity.notFound().build();
        requireTenderManager(tender, authentication);
        tenderRepository.delete(tender);
        return ResponseEntity.noContent().build();
    }

    private List<Tender> initializeTenderCollections(List<Tender> tenders) {
        tenders.forEach(this::initializeTenderCollections);
        return tenders;
    }

    private Tender initializeTenderCollections(Tender tender) {
        if (tender.getEligibility() != null) {
            tender.getEligibility().size();
        }
        if (tender.getDocuments() != null) {
            tender.getDocuments().size();
        }
        return tender;
    }

    private Tender toTender(TenderRequest source) {
        Tender tender = new Tender();
        copyTenderFields(source, tender);
        return tender;
    }

    private void copyTenderFields(TenderRequest source, Tender target) {
        target.setReferenceNo(source.referenceNo());
        target.setTitle(source.title());
        target.setOrganization(source.organization());
        target.setBuyerType(source.buyerType());
        target.setCategory(source.category());
        target.setLocation(source.location());
        target.setAmountValue(source.amountValue());
        target.setAmount(source.amount());
        target.setBidSecurity(source.bidSecurity());
        target.setStatus(source.status());
        target.setPublishedDate(source.publishedDate());
        target.setDeadline(source.deadline());
        target.setContact(source.contact());
        target.setEligibility(source.eligibility() == null ? List.of() : source.eligibility());
        target.setDocuments(source.documents() == null ? List.of() : source.documents());
        target.setDescription(source.description());
        target.setSubmissionMode(source.submissionMode());
        target.setOfficialUrl(source.officialUrl());
    }

    private void applyDefaults(Tender tender) {
        if (tender.getStatus() == null || tender.getStatus().isBlank()) {
            tender.setStatus("Open");
        }
        if (tender.getBuyerType() == null || tender.getBuyerType().isBlank()) {
            tender.setBuyerType("Government");
        }
        if (tender.getCategory() == null || tender.getCategory().isBlank()) {
            tender.setCategory("General");
        }
        if (tender.getPublishedDate() == null) {
            tender.setPublishedDate(LocalDate.now());
        }
        if (tender.getAmountValue() == null) {
            tender.setAmountValue(0L);
        }
        if (tender.getAmount() == null || tender.getAmount().isBlank()) {
            tender.setAmount("Value on request");
        }
        if (tender.getReferenceNo() == null || tender.getReferenceNo().isBlank()) {
            tender.setReferenceNo("TND-" + System.currentTimeMillis());
        }
        if (tender.getSubmissionMode() == null || tender.getSubmissionMode().isBlank()) {
            tender.setSubmissionMode("INFO_ONLY");
        }
        tender.setSubmissionMode(tender.getSubmissionMode().trim().toUpperCase());
        if (!Set.of("INFO_ONLY", "EXTERNAL_LINK", "PLATFORM").contains(tender.getSubmissionMode())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Choose a valid bid submission method");
        }
        if ("EXTERNAL_LINK".equals(tender.getSubmissionMode())) {
            try {
                URI uri = URI.create(tender.getOfficialUrl() == null ? "" : tender.getOfficialUrl().trim());
                if (uri.getHost() == null || !("https".equalsIgnoreCase(uri.getScheme()) || "http".equalsIgnoreCase(uri.getScheme()))) {
                    throw new IllegalArgumentException();
                }
            } catch (IllegalArgumentException ex) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Enter a valid http or https official tender URL");
            }
        }
    }

    private void requireTenderManager(Tender tender, Authentication authentication) {
        boolean isPlatformAdmin = authentication.getAuthorities().stream()
                .anyMatch(authority -> "ROLE_ADMIN".equals(authority.getAuthority()));
        if (!isPlatformAdmin && (tender.getOwnerEmail() == null || !tender.getOwnerEmail().equalsIgnoreCase(authentication.getName()))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the tender owner can manage this tender");
        }
    }

    private String valueOrDefault(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }

    private List<Long> parseIds(String ids) {
        if (ids == null || ids.isBlank()) {
            return List.of();
        }

        return Arrays.stream(ids.split(","))
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .map(value -> {
                    try {
                        return Long.parseLong(value);
                    } catch (NumberFormatException ex) {
                        return null;
                    }
                })
                .filter(Objects::nonNull)
                .toList();
    }

    private boolean isValidPaginationRequest(int page, int size, String sortBy, String sortDir) {
        Set<String> allowedSortFields = Set.of("publishedDate", "deadline", "amountValue", "title");
        return page >= 0
                && size >= 1
                && size <= 50
                && allowedSortFields.contains(sortBy)
                && ("asc".equalsIgnoreCase(sortDir) || "desc".equalsIgnoreCase(sortDir));
    }

    private Sort buildSearchSort(String sortBy, String sortDir) {
        Set<String> allowedSortFields = Set.of("deadline", "publishedDate", "amountValue", "title");
        String property = allowedSortFields.contains(sortBy) ? sortBy : "deadline";
        Sort.Direction direction = "desc".equalsIgnoreCase(sortDir) ? Sort.Direction.DESC : Sort.Direction.ASC;
        return Sort.by(direction, property);
    }

    public record TenderInsights(
            long total,
            long active,
            long expired,
            long totalValue,
            long categories,
            Map<String, Long> byCategory,
            Map<String, Long> byStatus,
            List<Tender> closingSoon
    ) {
    }

    private AiInsights buildFallbackAiInsights(List<Tender> tenders) {
        LocalDate today = LocalDate.now();

        long total = tenders.size();
        long active = tenders.stream()
                .filter(tender -> tender.getDeadline() == null || !tender.getDeadline().isBefore(today))
                .count();
        long expired = Math.max(total - active, 0);
        long totalValue = tenders.stream()
                .map(Tender::getAmountValue)
                .filter(Objects::nonNull)
                .mapToLong(Long::longValue)
                .sum();

        Map<String, Long> byCategory = tenders.stream()
                .collect(Collectors.groupingBy(
                        tender -> valueOrDefault(tender.getCategory(), "General"),
                        TreeMap::new,
                        Collectors.counting()
                ));

        Map<String, Long> byStatus = tenders.stream()
                .collect(Collectors.groupingBy(
                        tender -> valueOrDefault(tender.getStatus(), "Open"),
                        TreeMap::new,
                        Collectors.counting()
                ));

        List<Tender> closingSoon = tenders.stream()
                .filter(tender -> tender.getDeadline() != null && !tender.getDeadline().isBefore(today))
                .sorted(Comparator.comparing(Tender::getDeadline))
                .limit(5)
                .toList();

        return new AiInsights(
                total,
                active,
                expired,
                totalValue,
                byCategory.size(),
                byCategory,
                byStatus,
                closingSoon.stream().map(tender -> valueOrDefault(tender.getTitle(), "Untitled Tender")).toList(),
                List.of(),
                List.of("AI insights fallback activated because the summarizer could not complete.")
        );
    }
}
