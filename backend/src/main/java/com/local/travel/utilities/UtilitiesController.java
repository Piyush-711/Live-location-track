package com.local.travel.utilities;

import com.local.travel.common.error.AppException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/v1")
public class UtilitiesController {
    @GetMapping("/fx")
    public Object getFXRates() {
        throw new AppException("DEPENDENCY_UNAVAILABLE", "Exchange Rates Unavailable", 503,
                "No server exchange rate provider is configured.");
    }

    public record WeatherRequest(@NotBlank @Pattern(regexp = "[A-Za-z0-9_-]{1,80}") String areaId) {}

    @PostMapping("/weather")
    public Object getWeather(@Valid @RequestBody WeatherRequest request) {
        throw new AppException("DEPENDENCY_UNAVAILABLE", "Weather Unavailable", 503,
                "No server weather provider is configured.");
    }
}
