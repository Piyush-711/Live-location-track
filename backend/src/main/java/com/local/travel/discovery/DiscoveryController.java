package com.local.travel.discovery;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/v1/places")
public class DiscoveryController {

    private final DiscoveryService discoveryService;

    public DiscoveryController(DiscoveryService discoveryService) {
        this.discoveryService = discoveryService;
    }

    @PostMapping("/nearby")
    public ResponseEntity<NearbyResponse> getNearbyPlaces(@Valid @RequestBody NearbyRequest request) {
        return ResponseEntity.ok(discoveryService.findNearby(request));
    }

    @PostMapping("/search")
    public ResponseEntity<NearbyResponse> searchPlaces(@Valid @RequestBody SearchRequest request) {
        return ResponseEntity.ok(discoveryService.searchPlaces(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Place> getPlaceById(@PathVariable String id) {
        return ResponseEntity.ok(discoveryService.getPlaceById(id));
    }
}
