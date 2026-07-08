package com.bss.dashboard.iam.security;

import com.bss.dashboard.api.ApiError;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

import java.util.Map;

@Configuration
@Profile("mysql")
@EnableMethodSecurity
public class SecurityConfig {
    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }


    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http, ObjectMapper objectMapper) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable)
                .logout(AbstractHttpConfigurer::disable)
                .cors(Customizer.withDefaults())
                .authorizeHttpRequests(registry -> registry
                        .requestMatchers("/actuator/health", "/error").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/iam/auth/login").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/iam/bootstrap/status").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/iam/bootstrap/init").permitAll()
                        .requestMatchers("/api/ops/ingest/**").permitAll()
                        .anyRequest().authenticated())
                .exceptionHandling(configurer -> configurer
                        .authenticationEntryPoint((request, response, exception) -> writeError(objectMapper, response, 401, "请先登录后再访问系统资源"))
                        .accessDeniedHandler((request, response, exception) -> writeError(objectMapper, response, 403, "当前账号无权执行该操作")));
        return http.build();
    }

    private void writeError(ObjectMapper objectMapper, HttpServletResponse response, int status, String message) {
        response.setStatus(status);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        try {
            objectMapper.writeValue(response.getWriter(), ApiError.of(status, message, Map.of("error", status == 401 ? "Unauthorized" : "Forbidden")));
        } catch (java.io.IOException exception) {
            throw new IllegalStateException("写入安全异常响应失败", exception);
        }
    }
}
