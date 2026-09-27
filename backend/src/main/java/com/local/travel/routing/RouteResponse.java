package com.local.travel.routing;

import java.util.List;
import java.util.Map;

public record RouteResponse(
        String graphVersion,
        String profileVersion,
        String mode,
        int distanceMeters,
        int durationSeconds,
        Map<String, Object> geometry,
        List<RouteStep> steps,
        String sourceUpdatedAt,
        String coverageAreaId
) {
    public record RouteStep(
            String id,
            String instruction,
            String instructionLocal,
            int distanceMeters,
            int durationSeconds,
            String maneuver,
            String landmark,
            String streetName,
            String streetNameLocal
    ) {}
}
