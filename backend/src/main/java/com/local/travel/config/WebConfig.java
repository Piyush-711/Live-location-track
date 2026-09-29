package com.local.travel.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    private final String[] origins;

    public WebConfig(@Value("${app.cors.allowed-origins}") String origins) {
        this.origins = java.util.Arrays.stream(origins.split(",")).map(String::trim).filter(s -> !s.isEmpty()).toArray(String[]::new);
        if (java.util.Arrays.asList(this.origins).contains("*")) {
            throw new IllegalArgumentException("CORS origins must be explicit origins");
        }
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins(origins)
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD")
                .allowedHeaders("Content-Type", "Authorization", "If-Match", "If-None-Match")
                .exposedHeaders("ETag", "X-Store-Epoch", "X-Sync-Generation", "Retry-After")
                .allowCredentials(false)
                .maxAge(3600);
    }
}
