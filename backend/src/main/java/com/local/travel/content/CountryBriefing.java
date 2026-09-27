package com.local.travel.content;

import java.util.List;

public record CountryBriefing(
        String countryCode,
        String countryName,
        String city,
        String callingCode,
        String timezone,
        String currency,
        String currencySymbol,
        String powerPlugs,
        String voltage,
        String transitTip,
        List<String> culturalEtiquette
) {}
