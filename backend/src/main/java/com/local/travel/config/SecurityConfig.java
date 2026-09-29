package com.local.travel.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.local.travel.common.error.RFC9457ProblemDetail;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.core.*;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.security.oauth2.server.resource.web.authentication.BearerTokenAuthenticationFilter;
import org.springframework.security.web.SecurityFilterChain;

import java.net.URI;

@Configuration
public class SecurityConfig {
    @Bean
    JwtDecoder jwtDecoder(@Value("${app.auth.issuer}") String issuer,
                          @Value("${app.auth.audience}") String audience,
                          @Value("${app.auth.jwk-set-uri}") String jwks) {
        if (issuer.isBlank() && audience.isBlank() && jwks.isBlank()) {
            // Public browsing works in development; private endpoints never become public.
            return token -> { throw new BadJwtException("Authentication is not configured"); };
        }
        if (issuer.isBlank() || audience.isBlank() || jwks.isBlank()) {
            throw new IllegalStateException("Configure AUTH_ISSUER, AUTH_AUDIENCE and AUTH_JWK_SET_URI together");
        }
        requireHttps(issuer);
        requireHttps(jwks);
        NimbusJwtDecoder decoder = NimbusJwtDecoder.withJwkSetUri(jwks).build();
        decoder.setJwtValidator(validators(issuer, audience));
        return decoder;
    }

    public static OAuth2TokenValidator<Jwt> validators(String issuer, String audience) {
        OAuth2TokenValidator<Jwt> identity = token -> {
            String subject = token.getSubject();
            boolean valid = token.getAudience() != null && token.getAudience().contains(audience) && token.getExpiresAt() != null
                    && subject != null && !subject.isBlank() && subject.length() <= 256;
            return valid ? OAuth2TokenValidatorResult.success() : OAuth2TokenValidatorResult.failure(
                    new OAuth2Error("invalid_token", "Token identity, expiration or audience is invalid", null));
        };
        return new DelegatingOAuth2TokenValidator<>(JwtValidators.createDefaultWithIssuer(issuer), identity);
    }

    private static void requireHttps(String address) {
        URI uri = URI.create(address);
        if (!"https".equalsIgnoreCase(uri.getScheme()) || uri.getHost() == null || uri.getUserInfo() != null) {
            throw new IllegalStateException("Authentication issuer and JWK endpoints must use HTTPS");
        }
    }

    @Bean
    SecurityFilterChain security(HttpSecurity http, JwtDecoder decoder, ObjectMapper mapper) throws Exception {
        return http.cors(Customizer.withDefaults())
                // The API accepts only Authorization bearer tokens, never ambient cookie credentials.
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .requestCache(cache -> cache.disable())
                .httpBasic(basic -> basic.disable()).formLogin(form -> form.disable()).logout(logout -> logout.disable())
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/v1/me/**").authenticated()
                        .anyRequest().permitAll())
                .oauth2ResourceServer(oauth -> oauth.jwt(jwt -> jwt.decoder(decoder))
                        .authenticationEntryPoint((req, res, ex) -> {
                            res.setStatus(401);
                            res.setHeader("WWW-Authenticate", "Bearer");
                            res.setContentType("application/problem+json");
                            mapper.writeValue(res.getOutputStream(), RFC9457ProblemDetail.of(
                                    "AUTH_REQUIRED", "Authentication Required", 401,
                                    "A valid access token is required.", req.getRequestURI()));
                        }))
                .exceptionHandling(errors -> errors.accessDeniedHandler((req, res, ex) -> {
                    res.setStatus(403);
                    res.setContentType("application/problem+json");
                    mapper.writeValue(res.getOutputStream(), RFC9457ProblemDetail.of(
                            "ACCESS_DENIED", "Access Denied", 403, "Access is denied.", req.getRequestURI()));
                }))
                .addFilterAfter(new RequestSizeFilter(mapper), BearerTokenAuthenticationFilter.class)
                .build();
    }
}
