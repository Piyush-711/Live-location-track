package com.local.travel.market;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/v1/markets")
public class MarketController {

    private final MarketService marketService;

    public MarketController(MarketService marketService) {
        this.marketService = marketService;
    }

    @GetMapping
    public ResponseEntity<List<LocalMarket>> getMarkets(
            @RequestParam(required = false) String areaId,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lon,
            @RequestParam(required = false) String specialty,
            @RequestParam(required = false, name = "q") String query
    ) {
        return ResponseEntity.ok(marketService.findMarkets(areaId, lat, lon, specialty, query));
    }

    @GetMapping("/specialties")
    public ResponseEntity<List<MarketService.SpecialtyInfo>> getSpecialties() {
        return ResponseEntity.ok(marketService.getSpecialties());
    }

    @GetMapping("/{id}")
    public ResponseEntity<LocalMarket> getMarketById(@PathVariable String id) {
        return ResponseEntity.ok(marketService.getMarketById(id));
    }
}
