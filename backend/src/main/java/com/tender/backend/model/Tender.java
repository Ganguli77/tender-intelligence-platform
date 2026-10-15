package com.tender.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
public class Tender {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String referenceNo;
    private String title;
    private String organization;
    private String buyerType;
    private String category;
    private String location;
    private Long amountValue;
    private String amount;
    private String bidSecurity;
    private String status;
    private LocalDate publishedDate;
    private LocalDate deadline;
    private String contact;

    @JsonIgnore
    private String ownerEmail;

    private String submissionMode;

    @Column(length = 1000)
    private String officialUrl;

    @ElementCollection(fetch = FetchType.EAGER)
    @Column(length = 500)
    private List<String> eligibility = new ArrayList<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @Column(length = 500)
    private List<String> documents = new ArrayList<>();

    @Column(length = 2000)
    private String description;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getReferenceNo() {
        return referenceNo;
    }

    public void setReferenceNo(String referenceNo) {
        this.referenceNo = referenceNo;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getOrganization() {
        return organization;
    }

    public void setOrganization(String organization) {
        this.organization = organization;
    }

    public String getBuyerType() {
        return buyerType;
    }

    public void setBuyerType(String buyerType) {
        this.buyerType = buyerType;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public Long getAmountValue() {
        return amountValue;
    }

    public void setAmountValue(Long amountValue) {
        this.amountValue = amountValue;
    }

    public String getAmount() {
        return amount;
    }

    public void setAmount(String amount) {
        this.amount = amount;
    }

    public String getBidSecurity() {
        return bidSecurity;
    }

    public void setBidSecurity(String bidSecurity) {
        this.bidSecurity = bidSecurity;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDate getPublishedDate() {
        return publishedDate;
    }

    public void setPublishedDate(LocalDate publishedDate) {
        this.publishedDate = publishedDate;
    }

    public LocalDate getDeadline() {
        return deadline;
    }

    public void setDeadline(LocalDate deadline) {
        this.deadline = deadline;
    }

    public String getContact() {
        return contact;
    }

    public void setContact(String contact) {
        this.contact = contact;
    }

    public String getOwnerEmail() {
        return ownerEmail;
    }

    public void setOwnerEmail(String ownerEmail) {
        this.ownerEmail = ownerEmail;
    }

    public String getSubmissionMode() {
        return submissionMode;
    }

    public void setSubmissionMode(String submissionMode) {
        this.submissionMode = submissionMode;
    }

    public String getOfficialUrl() {
        return officialUrl;
    }

    public void setOfficialUrl(String officialUrl) {
        this.officialUrl = officialUrl;
    }

    public List<String> getEligibility() {
        return eligibility;
    }

    public void setEligibility(List<String> eligibility) {
        this.eligibility = eligibility;
    }

    public List<String> getDocuments() {
        return documents;
    }

    public void setDocuments(List<String> documents) {
        this.documents = documents;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
