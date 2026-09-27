package com.local.travel.personal;

import com.local.travel.discovery.Place;

public record SavedStateResponse(
        String placeId,
        boolean saved,
        String version,
        String updatedAt,
        String storeEpoch,
        String generation,
        Place place
) {}
