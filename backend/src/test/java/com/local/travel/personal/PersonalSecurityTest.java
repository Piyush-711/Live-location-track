package com.local.travel.personal;

import com.local.travel.config.SecurityConfig;
import com.nimbusds.jose.jwk.*;
import com.nimbusds.jose.jwk.source.ImmutableJWKSet;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.*;
import org.springframework.http.HttpHeaders;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.test.web.servlet.MockMvc;

import java.security.*;
import java.security.interfaces.RSAPublicKey;
import java.security.interfaces.RSAPrivateKey;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Import(PersonalSecurityTest.TestKeys.class)
class PersonalSecurityTest {
    private static final String ISSUER = "https://identity.example.test";
    private static final String AUDIENCE = "local-travel";
    private static final RSAKey KEY = createKey();
    private static final String PATH = "/v1/me/saved/p-kyoto-01";
    @Autowired MockMvc mvc;

    @TestConfiguration
    static class TestKeys {
        @Bean @Primary JwtDecoder testDecoder() throws Exception {
            NimbusJwtDecoder decoder = NimbusJwtDecoder.withPublicKey(KEY.toRSAPublicKey()).build();
            decoder.setJwtValidator(SecurityConfig.validators(ISSUER, AUDIENCE));
            return decoder;
        }
    }

    private static RSAKey createKey() {
        try {
            KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
            generator.initialize(2048);
            KeyPair pair = generator.generateKeyPair();
            return new RSAKey.Builder((RSAPublicKey) pair.getPublic()).privateKey((RSAPrivateKey) pair.getPrivate()).keyID("test-key").build();
        } catch (GeneralSecurityException ex) { throw new IllegalStateException(ex); }
    }

    private String token(String subject) { return token(subject, ISSUER, AUDIENCE, Instant.now().plusSeconds(600)); }

    private String token(String subject, String issuer, String audience, Instant expiration) {
        JwtClaimsSet.Builder claims = JwtClaimsSet.builder().issuer(issuer).audience(List.of(audience));
        if (subject != null) claims.subject(subject);
        if (expiration != null) claims.expiresAt(expiration);
        return new NimbusJwtEncoder(new ImmutableJWKSet<>(new JWKSet(KEY)))
                .encode(JwtEncoderParameters.from(claims.build())).getTokenValue();
    }

    private String create(String token) throws Exception {
        return mvc.perform(put(PATH).header(HttpHeaders.AUTHORIZATION, "Bearer " + token).header(HttpHeaders.IF_NONE_MATCH, "*"))
                .andExpect(status().isOk()).andExpect(header().string(HttpHeaders.CACHE_CONTROL, "no-store"))
                .andReturn().getResponse().getHeader(HttpHeaders.ETAG);
    }

    @Test void privateApiRequiresRealBearerAuthentication() throws Exception {
        mvc.perform(get("/v1/me/saved")).andExpect(status().isUnauthorized()).andExpect(jsonPath("$.code").value("AUTH_REQUIRED"));
        mvc.perform(get("/v1/me/saved").header("X-User-Id", "victim")) .andExpect(status().isUnauthorized());
        mvc.perform(get("/v1/me/saved").header(HttpHeaders.AUTHORIZATION, "Bearer invalid")).andExpect(status().isUnauthorized());
        for (String invalid : List.of(
                token("user", "https://wrong.example.test", AUDIENCE, Instant.now().plusSeconds(600)),
                token("user", ISSUER, "other-api", Instant.now().plusSeconds(600)),
                token("user", ISSUER, AUDIENCE, Instant.now().minusSeconds(120)),
                token(null, ISSUER, AUDIENCE, Instant.now().plusSeconds(600)),
                token("user", ISSUER, AUDIENCE, null))) {
            mvc.perform(get("/v1/me/saved").header(HttpHeaders.AUTHORIZATION, "Bearer " + invalid)).andExpect(status().isUnauthorized());
        }
    }

    @Test void accountsCannotReadOrModifyEachOthersSavedState() throws Exception {
        String alice = token("alice-" + UUID.randomUUID());
        String bob = token("bob-" + UUID.randomUUID());
        String aliceEtag = create(alice);
        mvc.perform(get("/v1/me/saved").header(HttpHeaders.AUTHORIZATION, "Bearer " + bob))
                .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(0));
        mvc.perform(delete(PATH).header(HttpHeaders.AUTHORIZATION, "Bearer " + bob).header(HttpHeaders.IF_MATCH, aliceEtag))
                .andExpect(status().isNotFound());
        String bobEtag = create(bob);
        assertThat(bobEtag).isNotEqualTo(aliceEtag);
        mvc.perform(delete(PATH).header(HttpHeaders.AUTHORIZATION, "Bearer " + bob).header(HttpHeaders.IF_MATCH, aliceEtag))
                .andExpect(status().isPreconditionFailed());
        mvc.perform(get(PATH).header(HttpHeaders.AUTHORIZATION, "Bearer " + alice))
                .andExpect(status().isOk()).andExpect(jsonPath("$.saved").value(true)).andExpect(header().string(HttpHeaders.ETAG, aliceEtag));
    }

    @Test void conditionalWritesPreventLostUpdatesAndRepeatedStateDoesNotIncrementVersion() throws Exception {
        String token = token(UUID.randomUUID().toString());
        mvc.perform(put(PATH).header(HttpHeaders.AUTHORIZATION, "Bearer " + token)).andExpect(status().is(428));
        String original = create(token);
        mvc.perform(put(PATH).header(HttpHeaders.AUTHORIZATION, "Bearer " + token).header(HttpHeaders.IF_MATCH, original))
                .andExpect(status().isOk()).andExpect(header().string(HttpHeaders.ETAG, original));
        mvc.perform(put(PATH).header(HttpHeaders.AUTHORIZATION, "Bearer " + token).header(HttpHeaders.IF_NONE_MATCH, "*"))
                .andExpect(status().isPreconditionFailed());
        String deleted = mvc.perform(delete(PATH).header(HttpHeaders.AUTHORIZATION, "Bearer " + token).header(HttpHeaders.IF_MATCH, original))
                .andExpect(status().isOk()).andExpect(jsonPath("$.version").value("2")).andReturn().getResponse().getHeader(HttpHeaders.ETAG);
        mvc.perform(put(PATH).header(HttpHeaders.AUTHORIZATION, "Bearer " + token).header(HttpHeaders.IF_MATCH, original))
                .andExpect(status().isPreconditionFailed());
        mvc.perform(get(PATH).header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk()).andExpect(jsonPath("$.saved").value(false)).andExpect(header().string(HttpHeaders.ETAG, deleted));
        mvc.perform(put(PATH).header(HttpHeaders.AUTHORIZATION, "Bearer " + token).header(HttpHeaders.IF_MATCH, deleted))
                .andExpect(status().isOk()).andExpect(jsonPath("$.version").value("3"));
    }

    @Test void concurrentSameVersionWritesHaveExactlyOneWinner() throws Exception {
        String token = token(UUID.randomUUID().toString());
        String etag = create(token);
        int workers = 8;
        CountDownLatch ready = new CountDownLatch(workers);
        CountDownLatch start = new CountDownLatch(1);
        try (ExecutorService executor = Executors.newFixedThreadPool(workers)) {
            List<Future<Integer>> results = new ArrayList<>();
            for (int i = 0; i < workers; i++) results.add(executor.submit(() -> {
                ready.countDown();
                start.await(10, TimeUnit.SECONDS);
                return mvc.perform(delete(PATH).header(HttpHeaders.AUTHORIZATION, "Bearer " + token).header(HttpHeaders.IF_MATCH, etag))
                        .andReturn().getResponse().getStatus();
            }));
            assertThat(ready.await(10, TimeUnit.SECONDS)).isTrue();
            start.countDown();
            List<Integer> statuses = new ArrayList<>();
            for (Future<Integer> result : results) statuses.add(result.get(15, TimeUnit.SECONDS));
            assertThat(statuses).containsOnly(200, 412);
            assertThat(statuses.stream().filter(s -> s == 200).count()).isEqualTo(1);
        }
        mvc.perform(get(PATH).header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk()).andExpect(jsonPath("$.version").value("2"));
    }
}
