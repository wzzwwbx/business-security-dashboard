package com.bss.dashboard.situation.support;

import com.bss.dashboard.exception.ResourceNotFoundException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;

class SituationDataLoaderTest {

    private final SituationDataLoader loader = new SituationDataLoader(new ObjectMapper().findAndRegisterModules());

    @Test
    void shouldLoadAllSituationPages() {
        var bundle = loader.load();

        assertEquals(4, bundle.pages().size());
        var overview = loader.getPage("overview");
        assertEquals("overview", overview.code());
        assertFalse(overview.sections().isEmpty());
        assertEquals("matrix", overview.sections().get(0).kind());
    }

    @Test
    void shouldFailForUnknownPageCode() {
        assertThrows(ResourceNotFoundException.class, () -> loader.getPage("unknown"));
    }
}
