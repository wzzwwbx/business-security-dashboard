package com.bss.dashboard.terminal.support;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

/**
 * 终端域时间格式化工具。
 */
public final class TerminalTimeFormats {

    private static final ZoneId ZONE = ZoneId.systemDefault();
    private static final DateTimeFormatter ISO_FORMATTER = DateTimeFormatter.ISO_OFFSET_DATE_TIME;

    private TerminalTimeFormats() {
    }

    public static String format(LocalDateTime value) {
        return value == null ? null : value.atZone(ZONE).format(ISO_FORMATTER);
    }

    public static String format(Timestamp value) {
        return value == null ? null : format(value.toLocalDateTime());
    }

    public static LocalDateTime parseToLocalDateTime(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        if (value.endsWith("Z") || value.matches(".*[+-][0-9]{2}:[0-9]{2}$")) {
            return OffsetDateTime.parse(value).atZoneSameInstant(ZONE).toLocalDateTime();
        }
        return LocalDateTime.parse(value);
    }
}
