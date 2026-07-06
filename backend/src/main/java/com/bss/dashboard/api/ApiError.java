package com.bss.dashboard.api;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.UUID;

public record ApiError(
        int code,
        String message,
        Map<String, Object> details,
        String traceId,
        String timestamp
) {

    public static ApiError of(int code, String message, Map<String, Object> details) {
        return new ApiError(code, message, details, UUID.randomUUID().toString(), now());
    }

    private static String now() {
        return OffsetDateTime.now(ZoneOffset.UTC).format(DateTimeFormatter.ISO_OFFSET_DATE_TIME);
    }
}
