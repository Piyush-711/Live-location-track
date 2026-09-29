package com.local.travel.content;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.local.travel.common.error.AppException;
import com.local.travel.discovery.PlaceRepository;
import org.springframework.validation.annotation.Validated;
import jakarta.validation.constraints.Pattern;

import java.util.List;
import java.util.Map;

@RestController
@Validated
@RequestMapping("/v1")
public class ContentController {

    private final ContentService contentService;
    private final PlaceRepository places;

    public ContentController(ContentService contentService, PlaceRepository places) {
        this.contentService = contentService;
        this.places = places;
    }

    @GetMapping("/content/{country}/{locale}")
    public ResponseEntity<EmergencyDossier> getEmergencyContent(
            @PathVariable @Pattern(regexp = "[A-Za-z]{2}") String country,
            @PathVariable @Pattern(regexp = "en-US") String locale) {
        return ResponseEntity.ok(contentService.getEmergencyDossier(country));
    }

    @GetMapping("/briefing/{country}")
    public ResponseEntity<CountryBriefing> getCountryBriefing(@PathVariable @Pattern(regexp = "[A-Za-z]{2}") String country) {
        return ResponseEntity.ok(contentService.getCountryBriefing(country));
    }

    @GetMapping("/coverage")
    public ResponseEntity<Map<String, Object>> getCoverage(@RequestParam(defaultValue = "kyoto") @Pattern(regexp = "[A-Za-z0-9_-]{1,80}") String areaId) {
        var dataset = places.findByArea(areaId);
        if (dataset.isEmpty()) throw new AppException("COVERAGE_UNSUPPORTED", "Coverage Not Supported", 422, "No dataset exists for the requested area.");
        return ResponseEntity.ok(Map.of(
                "datasetVersion", "city-release-" + areaId + "-20260924",
                "coverage", Map.of(
                        "areaId", areaId,
                        "countryCode", dataset.getFirst().countryCode(),
                        "supported", true,
                        "capabilities", List.of("discovery")
                )
        ));
    }
}
