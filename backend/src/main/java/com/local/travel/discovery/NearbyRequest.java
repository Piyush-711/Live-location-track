package com.local.travel.discovery;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record NearbyRequest(
        @NotBlank @Pattern(regexp = "[A-Za-z0-9_-]{1,80}") String areaId,
        @NotNull @Valid LocationCoordinates origin,
        @Pattern(regexp = "all|hospital|pharmacy|police|atm|restaurant|cafe|hotel|transit_stop|supermarket|fuel") String category,
        @Min(100) @Max(10000) Integer radiusMeters,
        @Min(1) @Max(50) Integer limit,
        @Size(max = 6) @Pattern(regexp = "[0-9]{1,6}") String cursor
) {}
