package com.local.travel.discovery;

import com.local.travel.common.error.AppException;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import com.local.travel.market.MarketService;

@Service
public class DiscoveryService {

    private final PlaceRepository repository;

    public DiscoveryService(PlaceRepository repository) {
        this.repository = repository;
    }

    public NearbyResponse findNearby(NearbyRequest request) {
        List<Place> all = repository.findByArea(request.areaId());
        if (all == null || all.isEmpty()) {
            throw new AppException(
                    "COVERAGE_UNSUPPORTED",
                    "Coverage Not Supported",
                    422,
                    "The requested areaId '" + request.areaId() + "' has no certified dataset release."
            );
        }

        int maxRadius = request.radiusMeters() != null ? request.radiusMeters() : 2000;
        int limit = request.limit() != null ? Math.min(request.limit(), 50) : 20;

        List<Place> filtered = new ArrayList<>(all.stream()
                .map(p -> p.withDistance(MarketService.calculateDistanceMeters(request.origin().latitude(), request.origin().longitude(), p.location().latitude(), p.location().longitude())))
                .filter(p -> p.distanceMeters() <= maxRadius)
                .filter(p -> request.category() == null || request.category().equalsIgnoreCase("all") || p.category().equalsIgnoreCase(request.category()))
                .toList());

        // Invariant Section 10: Sort deterministically by distance then place ID
        filtered.sort(Comparator.comparingInt(Place::distanceMeters).thenComparing(Place::id));

        int offset = request.cursor() == null ? 0 : Integer.parseInt(request.cursor());
        if (offset > filtered.size()) throw new AppException("VALIDATION_FAILED", "Invalid Cursor", 400, "Cursor is outside the current result set.");
        int end = Math.min(offset + limit, filtered.size());
        String nextCursor = end < filtered.size() ? String.valueOf(end) : null;
        filtered = filtered.subList(offset, end);

        return new NearbyResponse(
                "city-release-" + request.areaId() + "-20260924",
                new NearbyResponse.CoverageInfo(request.areaId(), true),
                Instant.now().toString(),
                "fresh",
                false,
                nextCursor,
                filtered
        );
    }

    public NearbyResponse searchPlaces(SearchRequest request) {
        List<Place> all = repository.findByArea(request.areaId());
        if (all.isEmpty()) throw new AppException("COVERAGE_UNSUPPORTED", "Coverage Not Supported", 422, "No dataset exists for the requested area.");
        String q = request.query().toLowerCase(Locale.ROOT).trim();

        List<Place> matching = new ArrayList<>(all.stream()
                .filter(p -> p.name().toLowerCase(Locale.ROOT).contains(q)
                        || (p.localizedName() != null && p.localizedName().toLowerCase(Locale.ROOT).contains(q))
                        || p.address().toLowerCase(Locale.ROOT).contains(q)
                        || (p.tags() != null && p.tags().stream().anyMatch(t -> t.toLowerCase(Locale.ROOT).contains(q))))
                .map(p -> request.origin() == null ? p : p.withDistance(MarketService.calculateDistanceMeters(
                        request.origin().latitude(), request.origin().longitude(), p.location().latitude(), p.location().longitude())))
                .toList());

        matching.sort(Comparator.comparingInt(Place::distanceMeters).thenComparing(Place::id));
        int limit = request.limit() == null ? 20 : request.limit();
        boolean partial = matching.size() > limit;
        matching = matching.subList(0, Math.min(limit, matching.size()));

        return new NearbyResponse(
                "city-release-" + request.areaId() + "-20260924",
                new NearbyResponse.CoverageInfo(request.areaId(), true),
                Instant.now().toString(),
                "fresh",
                partial,
                null,
                matching
        );
    }

    public Place getPlaceById(String id) {
        return repository.findById(id)
                .orElseThrow(() -> new AppException(
                        "OBJECT_NOT_FOUND",
                        "Place Not Found",
                        404,
                        "No verified place registered with ID " + id
                ));
    }
}
