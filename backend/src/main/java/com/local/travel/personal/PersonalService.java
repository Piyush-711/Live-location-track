package com.local.travel.personal;

import com.local.travel.common.error.AppException;
import com.local.travel.discovery.Place;
import com.local.travel.discovery.PlaceRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

@Service
public class PersonalService {

    private final PlaceRepository placeRepository;
    private final String storeEpoch = UUID.randomUUID().toString();
    private final String generation = "1";
    private final AtomicLong sequenceCounter = new AtomicLong(1);

    // Simulated per-account storage: placeId -> SavedRecord
    private final Map<String, SavedRecord> userSaves = new ConcurrentHashMap<>();

    public PersonalService(PlaceRepository placeRepository) {
        this.placeRepository = placeRepository;
    }

    public record SavedRecord(
            String placeId,
            boolean saved,
            long version,
            String updatedAt,
            Place place
    ) {}

    public String getStoreEpoch() {
        return storeEpoch;
    }

    public String getGeneration() {
        return generation;
    }

    public synchronized SavedStateResponse savePlace(String placeId) {
        Place place = placeRepository.findById(placeId)
                .orElseThrow(() -> new AppException("OBJECT_NOT_FOUND", "Place Not Found", 404, "Unknown place: " + placeId));

        long version = sequenceCounter.incrementAndGet();
        String now = Instant.now().toString();

        SavedRecord record = new SavedRecord(placeId, true, version, now, place);
        userSaves.put(placeId, record);

        return new SavedStateResponse(
                placeId,
                true,
                String.valueOf(version),
                now,
                storeEpoch,
                generation,
                place
        );
    }

    public synchronized SavedStateResponse deletePlace(String placeId) {
        SavedRecord existing = userSaves.get(placeId);
        if (existing == null) {
            throw new AppException("OBJECT_NOT_FOUND", "Not Found", 404, "No record exists for place " + placeId);
        }

        long version = sequenceCounter.incrementAndGet();
        String now = Instant.now().toString();

        SavedRecord tombstone = new SavedRecord(placeId, false, version, now, existing.place());
        userSaves.put(placeId, tombstone);

        return new SavedStateResponse(
                placeId,
                false,
                String.valueOf(version),
                now,
                storeEpoch,
                generation,
                existing.place()
        );
    }

    public List<SavedStateResponse> getAllSaved() {
        return userSaves.values().stream()
                .filter(SavedRecord::saved)
                .map(r -> new SavedStateResponse(
                        r.placeId(),
                        r.saved(),
                        String.valueOf(r.version()),
                        r.updatedAt(),
                        storeEpoch,
                        generation,
                        r.place()
                ))
                .toList();
    }
}
