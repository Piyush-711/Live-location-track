package com.local.travel.discovery;

import com.local.travel.common.error.AppException;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

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
                .filter(p -> p.distanceMeters() <= maxRadius)
                .filter(p -> request.category() == null || request.category().equalsIgnoreCase("all") || p.category().equalsIgnoreCase(request.category()))
                .toList());

        // Invariant Section 10: Sort deterministically by distance then place ID
        filtered.sort(Comparator.comparingInt(Place::distanceMeters).thenComparing(Place::id));

        if (filtered.size() > limit) {
            filtered = filtered.subList(0, limit);
        }

        return new NearbyResponse(
                "city-release-" + request.areaId() + "-20260924",
                new NearbyResponse.CoverageInfo(request.areaId(), true),
                Instant.now().toString(),
                "fresh",
                false,
                null,
                filtered
        );
    }

    public NearbyResponse searchPlaces(SearchRequest request) {
        List<Place> all = repository.findByArea(request.areaId());
        String q = request.query().toLowerCase().trim();

        List<Place> matching = new ArrayList<>(all.stream()
                .filter(p -> p.name().toLowerCase().contains(q)
                        || (p.localizedName() != null && p.localizedName().toLowerCase().contains(q))
                        || p.address().toLowerCase().contains(q)
                        || (p.tags() != null && p.tags().stream().anyMatch(t -> t.toLowerCase().contains(q))))
                .toList());

        matching.sort(Comparator.comparingInt(Place::distanceMeters).thenComparing(Place::id));

        return new NearbyResponse(
                "city-release-" + request.areaId() + "-20260924",
                new NearbyResponse.CoverageInfo(request.areaId(), true),
                Instant.now().toString(),
                "fresh",
                false,
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
