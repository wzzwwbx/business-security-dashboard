package com.bss.dashboard.situation.service;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

class SituationGeoServiceTest {

    @Test
    void shouldExposeSitesTerminalRegionsAndFourDomains() {
        var result = new SituationGeoService().getOverview();

        assertFalse(result.sites().isEmpty());
        assertFalse(result.terminalRegions().isEmpty());
        assertEquals(4, result.domains().size());
        assertEquals("beijing-core", result.sites().get(0).siteCode());
    }
}
