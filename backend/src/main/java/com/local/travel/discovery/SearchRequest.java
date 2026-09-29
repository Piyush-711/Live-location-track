package com.local.travel.discovery;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

public record SearchRequest(
        @NotBlank @Size(min = 1, max = 200) String query,
        @NotBlank @Pattern(regexp = "[A-Za-z0-9_-]{1,80}") String areaId,
        @Valid LocationCoordinates origin,
        @Min(1) @Max(50) Integer limit
) {}
