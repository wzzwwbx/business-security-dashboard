package com.bss.dashboard.iam.support;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;

public final class IamTimeFormats {

    private IamTimeFormats() {
    }

    public static String format(LocalDateTime value) {
        if (value == null) {
            return null;
        }
        return value.atOffset(ZoneOffset.UTC).format(DateTimeFormatter.ISO_OFFSET_DATE_TIME);
    }

    public static String format(Timestamp value) {
        return value == null ? null : format(value.toLocalDateTime());
    }

    public static LocalDateTime now() {
        return OffsetDateTime.now(ZoneOffset.UTC).toLocalDateTime();
    }
}
