package com.local.travel.discovery;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record NearbyRequest(
        @NotBlank String areaId,
        @NotNull @Valid LocationCoordinates origin,
        String category,
        @Min(100) @Max(10000) Integer radiusMeters,
        @Min(1) @Max(50) Integer limit,
        String cursor
) {}
