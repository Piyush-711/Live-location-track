package com.local.travel.routing;

import com.local.travel.discovery.LocationCoordinates;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record RouteRequest(
        @NotBlank String areaId,
        @NotNull @Valid LocationCoordinates origin,
        @NotNull @Valid LocationCoordinates destination,
        String mode
) {}
