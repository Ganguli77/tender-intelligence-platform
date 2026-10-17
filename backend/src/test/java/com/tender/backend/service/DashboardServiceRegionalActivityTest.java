package com.tender.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.tender.backend.dto.RegionalTenderActivityDTO;
import com.tender.backend.model.Tender;
import com.tender.backend.repository.AIAnalysisRepository;
import com.tender.backend.repository.SavedTenderRepository;
import com.tender.backend.repository.TenderRepository;
import com.tender.backend.repository.UserAlertRepository;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.Test;

class DashboardServiceRegionalActivityTest {

    private final TenderRepository tenders = mock(TenderRepository.class);
    private final DashboardService service = new DashboardService(
            tenders,
            mock(SavedTenderRepository.class),
            mock(UserAlertRepository.class),
            mock(AIAnalysisRepository.class)
    );

    @Test
    void groupsCurrentTenderValueByRecognizedStateAndOmitsExpiredOrUnknownLocations() {
        when(tenders.findAll()).thenReturn(List.of(
                tender("Mumbai, Maharashtra", 300_000L, LocalDate.now().plusDays(5)),
                tender("Pune, Maharashtra", 200_000L, null),
                tender("Nagpur, Maharashtra", 900_000L, LocalDate.now().minusDays(1)),
                tender("Bengaluru, Karnataka", 100_000L, LocalDate.now().plusDays(2)),
                tender("Unknown", 500_000L, null)
        ));

        List<RegionalTenderActivityDTO> activity = service.getRegionalTenderActivity();

        assertEquals(List.of(
                new RegionalTenderActivityDTO("Maharashtra", 2, 500_000L),
                new RegionalTenderActivityDTO("Karnataka", 1, 100_000L)
        ), activity);
    }

    private Tender tender(String location, long amountValue, LocalDate deadline) {
        Tender tender = new Tender();
        tender.setLocation(location);
        tender.setAmountValue(amountValue);
        tender.setDeadline(deadline);
        return tender;
    }
}
