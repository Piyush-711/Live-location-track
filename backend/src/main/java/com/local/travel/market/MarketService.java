package com.local.travel.market;

import com.local.travel.common.error.AppException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
public class MarketService {

    private final MarketRepository repository;

    public record SpecialtyInfo(
            String id,
            String label,
            String icon,
            String emoji,
            String colorHex,
            String badgeClass
    ) {}

    public MarketService(MarketRepository repository) {
        this.repository = repository;
    }

    public List<LocalMarket> findMarkets(
            String areaId,
            Double userLat,
            Double userLon,
            String specialty,
            String query
    ) {
        List<LocalMarket> baseList;

        if (areaId != null && !areaId.isBlank() && !areaId.equalsIgnoreCase("all")) {
            baseList = repository.findByCityId(areaId);
        } else {
            baseList = repository.findAll();
        }

        List<LocalMarket> result = new ArrayList<>();

        for (LocalMarket market : baseList) {
            LocalMarket item = market;
            if (userLat != null && userLon != null && market.location() != null) {
                int dist = calculateDistanceMeters(
                        userLat, userLon,
                        market.location().latitude(), market.location().longitude()
                );
                item = market.withDistance(dist);
            }
            result.add(item);
        }

        // Filter by specialty
        if (specialty != null && !specialty.isBlank() && !specialty.equalsIgnoreCase("all")) {
            String spec = specialty.trim().toLowerCase();
            result = result.stream()
                    .filter(m -> m.specialty() != null && m.specialty().equalsIgnoreCase(spec))
                    .toList();
        }

        // Filter by search query
        if (query != null && !query.isBlank()) {
            String q = query.trim().toLowerCase();
            result = result.stream()
                    .filter(m -> matchesQuery(m, q))
                    .toList();
        }

        // Sort by distance if coordinates provided, otherwise by name
        if (userLat != null && userLon != null) {
            result = new ArrayList<>(result);
            result.sort(Comparator.comparingInt((LocalMarket m) -> m.distanceMeters() != null ? m.distanceMeters() : Integer.MAX_VALUE).thenComparing(LocalMarket::id));
        } else {
            result = new ArrayList<>(result);
            result.sort(Comparator.comparing(LocalMarket::name).thenComparing(LocalMarket::id));
        }

        return result;
    }

    public LocalMarket getMarketById(String id) {
        return repository.findById(id)
                .orElseThrow(() -> new AppException(
                        "OBJECT_NOT_FOUND",
                        "Market Not Found",
                        404,
                        "No verified local market registered with ID " + id
                ));
    }

    public List<SpecialtyInfo> getSpecialties() {
        return List.of(
                new SpecialtyInfo("all", "All Markets", "storefront", "🏪", "#0284c7", "bg-sky-50 text-sky-700 border-sky-200"),
                new SpecialtyInfo("electronics", "Electronics & Hardware", "devices", "💻", "#0284c7", "bg-blue-50 text-blue-700 border-blue-200"),
                new SpecialtyInfo("clothes", "Clothes & Fashion", "apparel", "👗", "#db2777", "bg-pink-50 text-pink-700 border-pink-200"),
                new SpecialtyInfo("automobile", "Automobile & Spare Parts", "car_repair", "🚗", "#ea580c", "bg-orange-50 text-orange-700 border-orange-200"),
                new SpecialtyInfo("spices_food", "Spices & Gourmet Food", "nutrition", "🌶️", "#16a34a", "bg-emerald-50 text-emerald-700 border-emerald-200"),
                new SpecialtyInfo("jewelry", "Jewelry & Silverware", "diamond", "💍", "#d97706", "bg-amber-50 text-amber-700 border-amber-200"),
                new SpecialtyInfo("antiques_handicrafts", "Antiques & Crafts", "draw", "🏺", "#7c3aed", "bg-purple-50 text-purple-700 border-purple-200"),
                new SpecialtyInfo("wholesale", "Wholesale Bazaars", "inventory_2", "📦", "#475569", "bg-slate-100 text-slate-700 border-slate-200")
        );
    }

    private boolean matchesQuery(LocalMarket m, String q) {
        if (m.name() != null && m.name().toLowerCase().contains(q)) return true;
        if (m.specialtyLabel() != null && m.specialtyLabel().toLowerCase().contains(q)) return true;
        if (m.famousFor() != null && m.famousFor().toLowerCase().contains(q)) return true;
        if (m.address() != null && m.address().toLowerCase().contains(q)) return true;
        if (m.city() != null && m.city().toLowerCase().contains(q)) return true;
        if (m.famousLandmarkOrFood() != null && m.famousLandmarkOrFood().toLowerCase().contains(q)) return true;
        if (m.whatToBuy() != null && m.whatToBuy().stream().anyMatch(w -> w.toLowerCase().contains(q))) return true;
        if (m.tags() != null && m.tags().stream().anyMatch(t -> t.toLowerCase().contains(q))) return true;
        return false;
    }

    public static int calculateDistanceMeters(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371000; // Earth's radius in meters
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        a = Math.max(0, Math.min(1, a));
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return (int) Math.round(R * c);
    }
}
