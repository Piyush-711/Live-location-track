package com.local.travel.content;

import com.local.travel.discovery.Place;

import java.util.List;

public record EmergencyDossier(
        String countryCode,
        String countryName,
        String city,
        List<Hotline> nationalHotlines,
        List<Phrase> emergencyPhrases,
        Place verifiedER
) {
    public record Hotline(String service, String number, String description, boolean instantDial) {}
    public record Phrase(String category, String english, String localScript, String pronunciation) {}
}
