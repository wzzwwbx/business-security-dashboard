package com.bss.dashboard.ops.service;

import com.bss.dashboard.exception.ResourceNotFoundException;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;

class OpsTopologyServiceTest {

    private final OpsTopologyService service = new OpsTopologyService();

    @Test
    void shouldReturnLayeredTopologyForSelectedSite() {
        var topology = service.getTopology("beijing-core");

        assertEquals("北京中心机房", topology.site().name());
        assertFalse(topology.devices().isEmpty());
        assertFalse(topology.links().isEmpty());
        assertEquals("firewall", service.getDevice(102).deviceType());
    }

    @Test
    void shouldRejectUnknownSite() {
        assertThrows(ResourceNotFoundException.class, () -> service.getTopology("unknown"));
    }
}
