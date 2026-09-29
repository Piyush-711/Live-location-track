package com.local.travel.routing;

import com.local.travel.discovery.LocationCoordinates;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public record RouteRequest(
        @NotBlank @Pattern(regexp = "[A-Za-z0-9_-]{1,80}") String areaId,
        @NotNull @Valid LocationCoordinates origin,
        @NotNull @Valid LocationCoordinates destination,
        @NotBlank @Pattern(regexp = "walking|driving") String mode
) {}
