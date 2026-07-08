package com.bss.dashboard.iam.dto;

import java.util.List;

public record BootstrapStatusDto(
        boolean enabled,
        boolean initialized,
        List<String> defaultUsernames
) {
}
