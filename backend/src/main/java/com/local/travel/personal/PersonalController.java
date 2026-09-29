package com.local.travel.personal;

import jakarta.validation.constraints.*;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.List;

@RestController
@Validated
@RequestMapping("/v1/me/saved")
public class PersonalController {
    private final PersonalService service;

    public PersonalController(PersonalService service) { this.service = service; }

    @GetMapping
    public ResponseEntity<List<SavedStateResponse>> getSavedPlaces(@AuthenticationPrincipal Jwt jwt,
            @RequestParam(defaultValue = "100") @Min(1) @Max(100) int limit,
            @RequestParam(defaultValue = "0") @Min(0) @Max(10000) int offset) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(service.getAllSaved(accountId(jwt), limit, offset));
    }

    @GetMapping("/{placeId}")
    public ResponseEntity<SavedStateResponse> getSavedPlace(@AuthenticationPrincipal Jwt jwt,
            @PathVariable @Pattern(regexp = "[A-Za-z0-9_-]{1,128}") String placeId) {
        return response(service.getSaved(accountId(jwt), placeId));
    }

    @PutMapping("/{placeId}")
    public ResponseEntity<SavedStateResponse> savePlace(@AuthenticationPrincipal Jwt jwt,
            @PathVariable @Pattern(regexp = "[A-Za-z0-9_-]{1,128}") String placeId,
            @RequestHeader(value = "If-Match", required = false) @Size(max = 256) String ifMatch,
            @RequestHeader(value = "If-None-Match", required = false) @Size(max = 256) String ifNoneMatch) {
        return response(service.setSaved(accountId(jwt), placeId, true, ifMatch, ifNoneMatch));
    }

    @DeleteMapping("/{placeId}")
    public ResponseEntity<SavedStateResponse> deletePlace(@AuthenticationPrincipal Jwt jwt,
            @PathVariable @Pattern(regexp = "[A-Za-z0-9_-]{1,128}") String placeId,
            @RequestHeader(value = "If-Match", required = false) @Size(max = 256) String ifMatch,
            @RequestHeader(value = "If-None-Match", required = false) @Size(max = 256) String ifNoneMatch) {
        return response(service.setSaved(accountId(jwt), placeId, false, ifMatch, ifNoneMatch));
    }

    private ResponseEntity<SavedStateResponse> response(SavedStateResponse state) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).eTag(PersonalService.etag(state)).body(state);
    }

    private static String accountId(Jwt jwt) {
        // Include issuer so switching an identity provider cannot mix identical subjects.
        try {
            byte[] identity = (jwt.getIssuer() + "\u0000" + jwt.getSubject()).getBytes(StandardCharsets.UTF_8);
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(identity));
        } catch (NoSuchAlgorithmException ex) { throw new IllegalStateException(ex); }
    }
}
