package com.local.travel.personal;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.local.travel.common.error.AppException;
import com.local.travel.discovery.Place;
import com.local.travel.discovery.PlaceRepository;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class PersonalService {
    private final JdbcTemplate jdbc;
    private final PlaceRepository places;
    private final ObjectMapper mapper;

    public PersonalService(JdbcTemplate jdbc, PlaceRepository places, ObjectMapper mapper) {
        this.jdbc = jdbc;
        this.places = places;
        this.mapper = mapper;
    }

    public List<SavedStateResponse> getAllSaved(String accountId, int limit, int offset) {
        return jdbc.query("SELECT * FROM saved_places WHERE account_id = ? AND saved = TRUE ORDER BY updated_at DESC, place_id LIMIT ? OFFSET ?",
                (row, n) -> new SavedStateResponse(row.getString("place_id"), row.getBoolean("saved"),
                        row.getString("version"), row.getString("updated_at"), row.getString("store_epoch"), "1", readPlace(row.getString("place_json"))),
                accountId, limit, offset);
    }

    public SavedStateResponse getSaved(String accountId, String placeId) {
        SavedStateResponse state = find(accountId, placeId);
        if (state == null) throw new AppException("OBJECT_NOT_FOUND", "Saved Place Not Found", 404, "No saved state exists for this place.");
        return state;
    }

    private SavedStateResponse find(String accountId, String placeId) {
        return jdbc.query("SELECT * FROM saved_places WHERE account_id = ? AND place_id = ?",
                (row, n) -> new SavedStateResponse(row.getString("place_id"), row.getBoolean("saved"),
                        row.getString("version"), row.getString("updated_at"), row.getString("store_epoch"), "1", readPlace(row.getString("place_json"))),
                accountId, placeId).stream().findFirst().orElse(null);
    }

    @Transactional
    public SavedStateResponse setSaved(String accountId, String placeId, boolean saved, String ifMatch, String ifNoneMatch) {
        if (ifMatch != null && ifNoneMatch != null) {
            throw new AppException("VALIDATION_FAILED", "Validation Failed", 400, "Supply only one conditional request header.");
        }
        SavedStateResponse current = find(accountId, placeId);
        if (current == null) {
            if (!saved) throw new AppException("OBJECT_NOT_FOUND", "Saved Place Not Found", 404, "No saved state exists for this place.");
            if (ifMatch != null) throw conflict();
            if (!"*".equals(ifNoneMatch)) throw precondition();
            Place place = places.findById(placeId).orElseThrow(() -> new AppException("OBJECT_NOT_FOUND", "Place Not Found", 404, "Unknown place."));
            SavedStateResponse created = new SavedStateResponse(placeId, true, "1", Instant.now().toString(), UUID.randomUUID().toString(), "1", place);
            try {
                jdbc.update("INSERT INTO saved_places (account_id, place_id, saved, version, updated_at, store_epoch, place_json) VALUES (?, ?, ?, ?, ?, ?, ?)",
                        accountId, placeId, true, 1L, created.updatedAt(), created.storeEpoch(), writePlace(place));
            } catch (DuplicateKeyException ex) {
                // A different request created the same account/place while this transaction was reading.
                throw conflict();
            }
            return created;
        }
        if (ifNoneMatch != null || (ifMatch != null && !etag(current).equals(ifMatch))) throw conflict();
        if (ifMatch == null) throw precondition();
        // Repeating the desired state using the current version creates no extra write/version.
        if (current.saved() == saved) return current;
        long version = Long.parseLong(current.version()) + 1;
        String now = Instant.now().toString();
        int changed = jdbc.update("UPDATE saved_places SET saved = ?, version = ?, updated_at = ? WHERE account_id = ? AND place_id = ? AND version = ?",
                saved, version, now, accountId, placeId, Long.parseLong(current.version()));
        if (changed != 1) throw conflict();
        return new SavedStateResponse(placeId, saved, String.valueOf(version), now, current.storeEpoch(), "1", current.place());
    }

    public static String etag(SavedStateResponse state) {
        return "\"" + state.storeEpoch() + ":" + state.generation() + ":" + state.placeId() + ":" + state.version() + "\"";
    }

    private static AppException conflict() {
        return new AppException("VERSION_CONFLICT", "Version Conflict", 412, "Saved state changed. Read the current state and retry with its ETag.");
    }

    private static AppException precondition() {
        return new AppException("PRECONDITION_REQUIRED", "Precondition Required", 428, "Create with If-None-Match: *; update or delete with the current If-Match ETag.");
    }

    private String writePlace(Place place) {
        try { return mapper.writeValueAsString(place); }
        catch (JsonProcessingException ex) { throw new IllegalStateException("Cannot encode saved place", ex); }
    }

    private Place readPlace(String json) {
        try { return mapper.readValue(json, Place.class); }
        catch (JsonProcessingException ex) { throw new IllegalStateException("Cannot decode saved place", ex); }
    }
}
