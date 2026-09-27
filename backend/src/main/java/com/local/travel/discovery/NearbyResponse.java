package com.local.travel.discovery;

import java.util.List;

public record NearbyResponse(
        String datasetVersion,
        CoverageInfo coverage,
        String generatedAt,
        String freshness,
        boolean partial,
        String nextCursor,
        List<Place> items
) {
    public record CoverageInfo(String areaId, boolean supported) {}
}
