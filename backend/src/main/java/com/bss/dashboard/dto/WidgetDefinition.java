package com.bss.dashboard.dto;

import java.util.List;
import java.util.Map;

public record WidgetDefinition(
        String code,
        String title,
        String type,
        Integer colSpan,
        Integer minHeight,
        List<String> tags,
        Map<String, Object> payload
) {
}
