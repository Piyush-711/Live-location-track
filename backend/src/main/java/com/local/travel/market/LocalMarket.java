package com.local.travel.market;

import com.local.travel.discovery.LocationCoordinates;
import java.util.List;

public record LocalMarket(
        String id,
        String name,
        String city,
        String cityId,
        String specialty,
        String specialtyLabel,
        String famousFor,
        List<String> whatToBuy,
        String address,
        LocationCoordinates location,
        Integer distanceMeters,
        String metroStation,
        String closedOn,
        String timings,
        String bargainingTip,
        String bargainingLevel,
        String priceRange,
        String bestTimeToVisit,
        List<String> paymentMethods,
        String parkingTip,
        String famousLandmarkOrFood,
        String imageUrl,
        List<String> tags
) {
    public LocalMarket withDistance(int distance) {
        return new LocalMarket(
                id, name, city, cityId, specialty, specialtyLabel, famousFor,
                whatToBuy, address, location, distance, metroStation, closedOn,
                timings, bargainingTip, bargainingLevel, priceRange, bestTimeToVisit,
                paymentMethods, parkingTip, famousLandmarkOrFood, imageUrl, tags
        );
    }
}
