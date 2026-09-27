package com.local.travel.routing;

import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class RoutingService {

    public RouteResponse computeRoute(RouteRequest request) {
        String mode = request.mode() != null && request.mode().equalsIgnoreCase("driving") ? "driving" : "walking";
        int distance = mode.equals("walking") ? 280 : 650;
        int duration = mode.equals("walking") ? 240 : 120;

        List<RouteResponse.RouteStep> steps = List.of(
                new RouteResponse.RouteStep(
                        "step-1",
                        "Head North on Shijo-dori toward Hanamikoji Street",
                        "四条通を花見小路方面へ北に進む",
                        65,
                        50,
                        "depart",
                        "Start from current GPS fix at Gion crossing",
                        "Shijo-dori",
                        "四条通"
                ),
                new RouteResponse.RouteStep(
                        "step-2",
                        "Turn Right onto Shijo-dori covered arcade",
                        "四条通のアーケードを右折",
                        45,
                        38,
                        "turn_right",
                        "Follow covered arcade past Lawson convenience store",
                        "Shijo-dori Arcade",
                        "四条通アーケード"
                ),
                new RouteResponse.RouteStep(
                        "step-3",
                        "Continue straight through the pedestrian crossing",
                        "歩行者用横断歩道をそのまま直進",
                        90,
                        75,
                        "straight",
                        "Cross traffic light with audio acoustic signal",
                        "Gion Intersection",
                        "祇園交差点"
                ),
                new RouteResponse.RouteStep(
                        "step-4",
                        "Turn Left onto Gojo Access Lane",
                        "五条連絡路を左折",
                        55,
                        45,
                        "turn_left",
                        "Red emergency triage sign visible on right",
                        "Hospital Access Road",
                        "病院進入路"
                ),
                new RouteResponse.RouteStep(
                        "step-5",
                        "Arrive at Destination Entrance",
                        "目的地入口に到着",
                        25,
                        32,
                        "arrive",
                        "Barrier-free entrance on ground floor",
                        "Entrance Way",
                        "正面入口"
                )
        );

        Map<String, Object> geometry = Map.of(
                "type", "LineString",
                "coordinates", List.of(
                        List.of(135.7772, 35.0037),
                        List.of(135.7775, 35.0037),
                        List.of(135.7775, 35.0041),
                        List.of(135.7780, 35.0043),
                        List.of(135.7785, 35.0045)
                )
        );

        return new RouteResponse(
                "osrm-" + mode + "-v20260924",
                mode.equals("walking") ? "pedestrian-v8.1" : "motorcar-v8.1",
                mode,
                distance,
                duration,
                geometry,
                steps,
                "2026-09-24T00:00:00Z",
                request.areaId()
        );
    }
}
