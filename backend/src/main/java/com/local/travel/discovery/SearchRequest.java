package com.local.travel.discovery;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SearchRequest(
        @NotBlank @Size(min = 1, max = 200) String query,
        @NotBlank String areaId,
        LocationCoordinates origin,
        Integer limit
) {}
