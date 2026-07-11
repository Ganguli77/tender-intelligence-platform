package com.tender.backend.service;

import com.tender.backend.model.SavedTender;
import com.tender.backend.model.Tender;
import com.tender.backend.model.User;
import com.tender.backend.repository.SavedTenderRepository;
import com.tender.backend.repository.TenderRepository;
import com.tender.backend.repository.UserRepository;
import java.time.LocalDateTime;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class SavedTenderServiceImpl implements SavedTenderService {

    private static final int MAX_PAGE_SIZE = 50;

    private final SavedTenderRepository savedTenderRepository;
    private final TenderRepository tenderRepository;
    private final UserRepository userRepository;

    public SavedTenderServiceImpl(
            SavedTenderRepository savedTenderRepository,
            TenderRepository tenderRepository,
            UserRepository userRepository
    ) {
        this.savedTenderRepository = savedTenderRepository;
        this.tenderRepository = tenderRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional
    public SavedTender saveTender(Long tenderId, String userEmail) {
        User user = findUser(userEmail);
        Tender tender = findTender(tenderId);

        return savedTenderRepository.findByUserAndTender(user, tender)
                .orElseGet(() -> createSavedTender(user, tender));
    }

    @Override
    @Transactional
    public void removeSavedTender(Long tenderId, String userEmail) {
        User user = findUser(userEmail);
        Tender tender = findTender(tenderId);
        SavedTender savedTender = savedTenderRepository.findByUserAndTender(user, tender)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Saved tender not found"));

        savedTenderRepository.delete(savedTender);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<SavedTender> getSavedTenders(String userEmail, int page, int size) {
        User user = findUser(userEmail);
        Pageable pageable = PageRequest.of(
                Math.max(page, 0),
                Math.min(Math.max(size, 1), MAX_PAGE_SIZE),
                Sort.by(Sort.Direction.DESC, "savedAt")
        );

        return savedTenderRepository.findByUser(user, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isTenderSaved(Long tenderId, String userEmail) {
        User user = findUser(userEmail);
        Tender tender = findTender(tenderId);
        return savedTenderRepository.existsByUserAndTender(user, tender);
    }

    @Override
    @Transactional(readOnly = true)
    public long getSavedCount(String userEmail) {
        return savedTenderRepository.countByUser(findUser(userEmail));
    }

    private SavedTender createSavedTender(User user, Tender tender) {
        SavedTender savedTender = new SavedTender();
        savedTender.setUser(user);
        savedTender.setTender(tender);
        savedTender.setSavedAt(LocalDateTime.now());

        try {
            return savedTenderRepository.save(savedTender);
        } catch (DataIntegrityViolationException ex) {
            return savedTenderRepository.findByUserAndTender(user, tender)
                    .orElseThrow(() -> ex);
        }
    }

    private User findUser(String userEmail) {
        if (userEmail == null || userEmail.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication is required");
        }

        return userRepository.findByIdentifier(userEmail.trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authenticated user was not found"));
    }

    private Tender findTender(Long tenderId) {
        return tenderRepository.findById(tenderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tender not found"));
    }
}
