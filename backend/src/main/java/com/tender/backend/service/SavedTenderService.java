package com.tender.backend.service;

import com.tender.backend.model.SavedTender;
import org.springframework.data.domain.Page;

public interface SavedTenderService {
    SavedTender saveTender(Long tenderId, String userEmail);

    void removeSavedTender(Long tenderId, String userEmail);

    Page<SavedTender> getSavedTenders(String userEmail, int page, int size);

    boolean isTenderSaved(Long tenderId, String userEmail);

    long getSavedCount(String userEmail);
}
