package com.tender.backend.model;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "bid_submissions")
public class BidSubmission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    private Tender tender;

    private String supplierEmail;
    private String supplierOrganization;
    private String contactName;
    private String contactEmail;
    private Long amountValue;
    private String status = "Submitted";
    private LocalDateTime submittedAt;

    @jakarta.persistence.Column(length = 4000)
    private String proposal;

    @OneToMany(mappedBy = "submission", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<BidDocument> documents = new ArrayList<>();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Tender getTender() { return tender; }
    public void setTender(Tender tender) { this.tender = tender; }
    public String getSupplierEmail() { return supplierEmail; }
    public void setSupplierEmail(String supplierEmail) { this.supplierEmail = supplierEmail; }
    public String getSupplierOrganization() { return supplierOrganization; }
    public void setSupplierOrganization(String supplierOrganization) { this.supplierOrganization = supplierOrganization; }
    public String getContactName() { return contactName; }
    public void setContactName(String contactName) { this.contactName = contactName; }
    public String getContactEmail() { return contactEmail; }
    public void setContactEmail(String contactEmail) { this.contactEmail = contactEmail; }
    public Long getAmountValue() { return amountValue; }
    public void setAmountValue(Long amountValue) { this.amountValue = amountValue; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDateTime getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(LocalDateTime submittedAt) { this.submittedAt = submittedAt; }
    public String getProposal() { return proposal; }
    public void setProposal(String proposal) { this.proposal = proposal; }
    public List<BidDocument> getDocuments() { return documents; }
    public void setDocuments(List<BidDocument> documents) { this.documents = documents; }
}