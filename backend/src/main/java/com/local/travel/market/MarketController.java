package com.local.travel.market;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import jakarta.validation.constraints.*;
import org.springframework.validation.annotation.Validated;
import com.local.travel.common.error.AppException;

@RestController
@Validated
@RequestMapping("/v1/markets")
public class MarketController {

    private final MarketService marketService;

    public MarketController(MarketService marketService) {
        this.marketService = marketService;
    }

    @GetMapping
    public ResponseEntity<List<LocalMarket>> getMarkets(
            @RequestParam(required = false) @Pattern(regexp = "[A-Za-z0-9_-]{1,80}") String areaId,
            @RequestParam(required = false) @DecimalMin("-90") @DecimalMax("90") Double lat,
            @RequestParam(required = false) @DecimalMin("-180") @DecimalMax("180") Double lon,
            @RequestParam(required = false) @Pattern(regexp = "all|electronics|clothes|automobile|spices_food|jewelry|antiques_handicrafts|wholesale") String specialty,
            @RequestParam(required = false, name = "q") @Size(max = 200) String query,
            @RequestParam(defaultValue = "50") @Min(1) @Max(100) int limit,
            @RequestParam(defaultValue = "0") @Min(0) @Max(10000) int offset
    ) {
        if ((lat == null) != (lon == null)) throw new AppException("VALIDATION_FAILED", "Validation Failed", 400, "Latitude and longitude must be provided together.");
        List<LocalMarket> markets = marketService.findMarkets(areaId, lat, lon, specialty, query);
        return ResponseEntity.ok(markets.stream().skip(offset).limit(limit).toList());
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
