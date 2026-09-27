package com.local.travel.discovery;

import java.util.List;

public record Place(
        String id,
        String name,
        String localizedName,
        String category,
        int distanceMeters,
        LocationCoordinates location,
        String countryCode,
        String city,
        String address,
        Hours hours,
        String source,
        String sourceUpdatedAt,
        String freshness,
        boolean emergencyCapable,
        String phone,
        List<String> tags,
        String triageInfo,
        String imageUrl
) {
    public record Hours(String status, String raw, String formatted) {}
}
