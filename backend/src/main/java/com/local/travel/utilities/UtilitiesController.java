package com.local.travel.utilities;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/v1")
public class UtilitiesController {

    @GetMapping("/fx")
    public ResponseEntity<Map<String, Object>> getFXRates() {
        return ResponseEntity.ok(Map.of(
                "base", "USD",
                "asOf", "2026-09-27T06:00:00Z",
                "source", "European Central Bank Reference / OpenFX Baseline",
                "rates", Map.of(
                        "USD", 1.0,
                        "JPY", 152.42,
                        "EUR", 0.92,
                        "GBP", 0.77,
                        "INR", 83.54,
                        "AUD", 1.51,
                        "CAD", 1.36
                )
        ));
    }

    public record WeatherRequest(String areaId) {}

    @PostMapping("/weather")
    public ResponseEntity<Map<String, Object>> getWeather(@RequestBody(required = false) WeatherRequest request) {
        String city = request != null && request.areaId() != null ? request.areaId() : "kyoto";
        return ResponseEntity.ok(Map.of(
                "city", city.substring(0, 1).toUpperCase() + city.substring(1),
                "tempC", 21,
                "condition", "Clear Daylight",
                "highC", 24,
                "lowC", 15,
                "humidity", 58,
                "observedAt", "2026-09-27T12:00:00Z",
                "hourly", List.of(
                        Map.of("time", "13:00", "tempC", 21, "condition", "Clear"),
                        Map.of("time", "14:00", "tempC", 22, "condition", "Sunny"),
                        Map.of("time", "15:00", "tempC", 22, "condition", "Partly Cloudy"),
                        Map.of("time", "16:00", "tempC", 20, "condition", "Clear"),
                        Map.of("time", "17:00", "tempC", 18, "condition", "Sunset")
                )
        ));
    }
}
