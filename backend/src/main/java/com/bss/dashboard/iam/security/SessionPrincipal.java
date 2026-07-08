package com.bss.dashboard.iam.security;

import java.io.Serial;
import java.io.Serializable;

public record SessionPrincipal(
        Long userId,
        String username,
        String displayName,
        boolean forcePasswordChange
) implements Serializable {
    @Serial
    private static final long serialVersionUID = 1L;
}
