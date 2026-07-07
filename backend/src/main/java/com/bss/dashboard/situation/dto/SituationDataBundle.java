package com.bss.dashboard.situation.dto;

import java.util.List;

public record SituationDataBundle(
        List<SituationPageDto> pages
) {
}
