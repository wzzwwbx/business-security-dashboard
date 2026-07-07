package com.bss.dashboard.situation.service;

import com.bss.dashboard.situation.dto.SituationPageDto;
import com.bss.dashboard.situation.support.SituationDataLoader;
import org.springframework.stereotype.Service;

@Service
public class SituationService {

    private final SituationDataLoader dataLoader;

    public SituationService(SituationDataLoader dataLoader) {
        this.dataLoader = dataLoader;
    }

    public SituationPageDto getPage(String pageCode) {
        return dataLoader.getPage(pageCode);
    }
}
