package com.local.travel.content;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/v1")
public class ContentController {

    private final ContentService contentService;

    public ContentController(ContentService contentService) {
        this.contentService = contentService;
    }

    @GetMapping("/content/{country}/{locale}")
    public ResponseEntity<EmergencyDossier> getEmergencyContent(
            @PathVariable String country,
            @PathVariable(required = false) String locale) {
        return ResponseEntity.ok(contentService.getEmergencyDossier(country));
    }

    @GetMapping("/briefing/{country}")
    public ResponseEntity<CountryBriefing> getCountryBriefing(@PathVariable String country) {
        return ResponseEntity.ok(contentService.getCountryBriefing(country));
    }

    @GetMapping("/coverage")
    public ResponseEntity<Map<String, Object>> getCoverage(@RequestParam(defaultValue = "kyoto") String areaId) {
        return ResponseEntity.ok(Map.of(
                "datasetVersion", "city-release-" + areaId + "-20260924",
                "coverage", Map.of(
                        "areaId", areaId,
                        "supported", true,
                        "capabilities", List.of("discovery", "offline_packs", "walking_routes", "driving_routes", "emergency")
                )
        ));
    }
}
