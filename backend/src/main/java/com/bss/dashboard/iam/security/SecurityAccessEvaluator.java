package com.bss.dashboard.iam.security;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import java.util.Locale;

@Component("securityAccessEvaluator")
public class SecurityAccessEvaluator {

    public boolean canViewPage(Authentication authentication, String pageCode) {
        if (authentication == null || !authentication.isAuthenticated() || pageCode == null) {
            return false;
        }
        String normalized = pageCode.toLowerCase(Locale.ROOT).trim();
        String permission = switch (normalized) {
            case "overview" -> "page:overview:view";
            case "security" -> "page:security:view";
            case "business" -> "page:business:view";
            case "terminal" -> "page:terminal:view";
            case "ops" -> "page:ops:view";
            case "system" -> "page:system:view";
            default -> null;
        };
        return permission != null && authentication.getAuthorities().stream().anyMatch(item -> permission.equals(item.getAuthority()));
    }
}
