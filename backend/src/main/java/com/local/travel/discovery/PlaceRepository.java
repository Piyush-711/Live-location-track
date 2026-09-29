package com.local.travel.discovery;

import org.springframework.stereotype.Repository;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Repository
public class PlaceRepository {

    private final Map<String, List<Place>> cityPlaces = new ConcurrentHashMap<>();
    private final Map<String, Place> placesById = new HashMap<>();

    public PlaceRepository() {
        seedInitialData();
        cityPlaces.values().forEach(places -> places.forEach(place -> placesById.put(place.id(), place)));
    }

    public List<Place> findByArea(String areaId) {
        return cityPlaces.getOrDefault(areaId.toLowerCase(Locale.ROOT), List.of());
    }

    public Optional<Place> findById(String id) {
        return Optional.ofNullable(placesById.get(id));
    }

    private void seedInitialData() {
        // Kyoto
        List<Place> kyoto = List.of(
                new Place(
                        "p-kyoto-01",
                        "Kyoto City Hospital ER",
                        "京都市立病院 救命救急センター",
                        "hospital",
                        450,
                        new LocationCoordinates(35.0045, 135.7785),
                        "JP",
                        "Kyoto",
                        "1-2 Gojo-dori, Shimogyo Ward, Kyoto 600-8887",
                        new Place.Hours("open", "24/7", "Emergency 24/7"),
                        "CURATED_REGISTRY",
                        "2026-09-24T06:00:00Z",
                        "fresh",
                        true,
                        "+81-75-311-5311",
                        List.of("Verified ER", "Multilingual Triage", "English Staff", "Pediatric Unit"),
                        "English & Multi-language triage • Priority Tier 1",
                        "https://lh3.googleusercontent.com/aida-public/AB6AXuBf1Oco61bM_zrKP6fBDkscfjmPXkQpm2dtumKBhvVMMpnM7PNEbtUTOdWUsxW7lZFRnMbINgzyEa7c00Oirn4FqILpCC0NvxsJ-ViaRKQ6WyWTkVwLNf7hxZNHtNDt0D8H4c0Z9ChgnRyr9iZTllRAOKTfB8F-8ZEHh-CgdjSIgF_c3NEQk6NcYBx2Hgd8WDOXODNmcFp9XEo0iRkz6sP5yDoDp7kakn11sx0vcaAmUMUVWdHOzxC9"
                ),
                new Place(
                        "p-kyoto-02",
                        "Matsumotokiyoshi Pharmacy",
                        "マツモトキヨシ 祇園四条店",
                        "pharmacy",
                        180,
                        new LocationCoordinates(35.0039, 135.7760),
                        "JP",
                        "Kyoto",
                        "240 Gionmachi Kitagawa, Higashiyama Ward, Kyoto",
                        new Place.Hours("open", "Mo-Su 09:00-22:00", "Open until 22:00"),
                        "OSM",
                        "2026-09-23T12:00:00Z",
                        "fresh",
                        false,
                        "+81-75-532-0181",
                        List.of("Tax-Free", "English Support", "Duty Pharmacist"),
                        "Duty Pharmacist On-Site for OTC consultations",
                        "https://lh3.googleusercontent.com/aida-public/AB6AXuBEveTz4X1fzq8bL0kx-8_1gAlUJIQt8jZ8mG36Q4QqcJhyNtKYV8LCkoTN33YiStQyPCfppt5GLPEYk5N6X3lUushyzf1KU4T0UxCsnH1yOFdoiHt3Cy5LUPZNOgUCdxKDBE43RfqJc-sVH4gs6X7sDFZOF08YeBgV4vHhzoZ0vWBDDDFeyvLBGohf5QCgMxWIf6saN3D1P2LksJEoPu_KM8WLr9kksZFyexMC3imf1LxWZVc2yWaI"
                ),
                new Place(
                        "p-kyoto-03",
                        "7-Eleven ATM (Seven Bank)",
                        "セブン銀行ATM 祇園四条",
                        "atm",
                        90,
                        new LocationCoordinates(35.0035, 135.7770),
                        "JP",
                        "Kyoto",
                        "Higashiyama Ward, Shijo-dori, Kyoto",
                        new Place.Hours("open", "24/7", "24/7 Service"),
                        "OSM",
                        "2026-09-22T08:00:00Z",
                        "fresh",
                        false,
                        null,
                        List.of("Global Cards", "Visa/Mastercard/Cirrus", "English GUI"),
                        "Zero foreign card markup detected",
                        "https://lh3.googleusercontent.com/aida-public/AB6AXuCP80wjYZ_cF-GpUbPbqeWerR8w2IUCq7jU6O414ZKxYchUpRT2QAvbjCuEX-xMkRZoqu4VAjT0WPOluEvxYm_CQfDKpsvhwdKaAoIjD53nzglJsA-tOV456XG0PsQ9K-z-o55LlIBS7f1XxovxF4d86fo8-znHs-u9-62YHr-DxkgUadDSOB2B6XfFxYOV6JJFjWA5ajZSkPLcG2Rv2t0Qq9uB7pGFjEhFIFfhJlVrmR-RnCSMZG1I"
                ),
                new Place(
                        "p-kyoto-04",
                        "Gion-Shijo Station",
                        "祇園四条駅",
                        "transit_stop",
                        320,
                        new LocationCoordinates(35.0038, 135.7725),
                        "JP",
                        "Kyoto",
                        "Keihan Main Line, Higashiyama Ward, Kyoto",
                        new Place.Hours("open", "05:00-24:00", "Next train: 4 min"),
                        "OSM",
                        "2026-09-24T00:00:00Z",
                        "fresh",
                        false,
                        null,
                        List.of("Keihan Line", "Barrier-free Exit 4", "IC Card IC-OCA"),
                        null,
                        "https://lh3.googleusercontent.com/aida-public/AB6AXuD4H4qLoHB3lrZDMrxWE9x9C62Mni6D55zfM-H2tvAWBNztsuSU7fQWJYB1UDP-lzOVXggjBvGqquXbSnLg8BvRjlO8Kf80MyNp-Twj8B1q-Fm-BJm2bdSXWBnO_PK9C5KcaDuBLfRNnT0a4AHCm973-svY4l6Cw5k8Uu53yFkdSD5O3TkLgOZbucpkeNsI0EE5mphgfFzmnfWVVwACY-3M1tz6ooqUl-OVsXOyXJ23tWTlDgCjiMx9"
                ),
                new Place(
                        "p-kyoto-05",
                        "Police Box (Kōban) - Gion",
                        "東山警察署 祇園交番",
                        "police",
                        150,
                        new LocationCoordinates(35.0036, 135.7758),
                        "JP",
                        "Kyoto",
                        "Gionmachi Minamigawa, Higashiyama Ward, Kyoto",
                        new Place.Hours("open", "24/7", "Open 24 Hours"),
                        "CURATED_REGISTRY",
                        "2026-09-24T00:00:00Z",
                        "fresh",
                        true,
                        "+81-75-525-0110",
                        List.of("Official Kōban", "Lost & Found", "Tourist Assistance", "Direct Dial 110"),
                        null,
                        null
                )
        );
        cityPlaces.put("kyoto", kyoto);

        // London
        List<Place> london = List.of(
                new Place(
                        "p-lon-01",
                        "St Thomas' Hospital Emergency Department",
                        null,
                        "hospital",
                        380,
                        new LocationCoordinates(51.5005, -0.1195),
                        "GB",
                        "London",
                        "Westminster Bridge Rd, London SE1 7EH",
                        new Place.Hours("open", "24/7", "Emergency 24/7"),
                        "CURATED_REGISTRY",
                        "2026-09-24T06:00:00Z",
                        "fresh",
                        true,
                        "+44-20-7188-7188",
                        List.of("NHS Major Trauma Center", "Pediatric A&E", "Walk-in Triage"),
                        "NHS Major Trauma Center with walk-in triage",
                        null
                ),
                new Place(
                        "p-lon-02",
                        "Boots Pharmacy Strand",
                        null,
                        "pharmacy",
                        220,
                        new LocationCoordinates(51.5100, -0.1220),
                        "GB",
                        "London",
                        "44-46 Strand, London WC2N 5HX",
                        new Place.Hours("open", "08:00-21:00", "Open until 21:00"),
                        "OSM",
                        "2026-09-22T10:00:00Z",
                        "fresh",
                        false,
                        null,
                        List.of("Prescriptions", "Travel Clinic", "First Aid Supplies"),
                        null,
                        null
                )
        );
        cityPlaces.put("london", london);

        // Mumbai
        List<Place> mumbai = List.of(
                new Place(
                        "p-bom-01",
                        "KEM Hospital & Emergency Trauma Care",
                        null,
                        "hospital",
                        620,
                        new LocationCoordinates(19.0028, 72.8427),
                        "IN",
                        "Mumbai",
                        "Acharya Donde Marg, Parel, Mumbai 400012",
                        new Place.Hours("open", "24/7", "Emergency 24/7"),
                        "CURATED_REGISTRY",
                        "2026-09-24T06:00:00Z",
                        "fresh",
                        true,
                        "+91-22-2410-7000",
                        List.of("Level 1 Trauma", "Government Teaching Hospital", "24h Casualty"),
                        "Level 1 Trauma Center with 24h Casualty Ward",
                        null
                )
        );
        cityPlaces.put("mumbai", mumbai);

        // New York
        List<Place> newyork = List.of(
                new Place(
                        "p-nyc-01",
                        "NYC Health + Hospitals / Bellevue ER",
                        null,
                        "hospital",
                        510,
                        new LocationCoordinates(40.7388, -73.9755),
                        "US",
                        "New York",
                        "462 1st Ave, New York, NY 10016",
                        new Place.Hours("open", "24/7", "Emergency 24/7"),
                        "CURATED_REGISTRY",
                        "2026-09-24T06:00:00Z",
                        "fresh",
                        true,
                        "+1-212-562-4141",
                        List.of("Level 1 Trauma Center", "Pediatric Emergency"),
                        "Level 1 Trauma Center with specialized triage",
                        null
                )
        );
        cityPlaces.put("newyork", newyork);

        // Hyderabad
        List<Place> hyderabad = List.of(
                new Place(
                        "p-hyd-01",
                        "Apollo Hospitals Jubilee Hills ER",
                        "అపోలో హాస్పిటల్స్ అత్యవసర విభాగం",
                        "hospital",
                        450,
                        new LocationCoordinates(17.4260, 78.4116),
                        "IN",
                        "Hyderabad",
                        "Road No 72, Opposite Bharatiya Vidya Bhavan, Jubilee Hills, Hyderabad 500033",
                        new Place.Hours("open", "24/7", "Emergency 24/7"),
                        "CURATED_REGISTRY",
                        "2026-09-24T06:00:00Z",
                        "fresh",
                        true,
                        "+91-40-2360-7777",
                        List.of("JCI Accredited", "Level 1 Trauma Care", "24/7 Stroke Unit", "Multilingual Staff"),
                        "NABH & JCI accredited 24h Emergency & Stroke Center",
                        "https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?auto=format&fit=crop&w=800&q=80"
                ),
                new Place(
                        "p-hyd-02",
                        "Apollo Pharmacy Banjara Hills",
                        null,
                        "pharmacy",
                        210,
                        new LocationCoordinates(17.4156, 78.4350),
                        "IN",
                        "Hyderabad",
                        "Road No. 2, Banjara Hills, Hyderabad 500034",
                        new Place.Hours("open", "24/7", "Open 24 Hours"),
                        "OSM",
                        "2026-09-23T10:00:00Z",
                        "fresh",
                        false,
                        "+91-40-2354-8899",
                        List.of("24h Delivery", "UPI Accepted", "Life Saving Drugs"),
                        "24/7 Emergency Chemist with Home Delivery",
                        null
                ),
                new Place(
                        "p-hyd-03",
                        "Charminar Police Station",
                        null,
                        "police",
                        350,
                        new LocationCoordinates(17.3620, 78.4740),
                        "IN",
                        "Hyderabad",
                        "Near Charminar, Moghalpura, Hyderabad 500002",
                        new Place.Hours("open", "24/7", "Open 24 Hours"),
                        "CURATED_REGISTRY",
                        "2026-09-24T00:00:00Z",
                        "fresh",
                        true,
                        "+91-40-2785-3500",
                        List.of("Hyderabad City Police", "Tourist Aid", "Emergency Response 100/112"),
                        "24-Hour Law Enforcement and Tourist Safety Aid",
                        null
                ),
                new Place(
                        "p-hyd-04",
                        "MGBS Metro Station",
                        null,
                        "transit_stop",
                        400,
                        new LocationCoordinates(17.3780, 78.4815),
                        "IN",
                        "Hyderabad",
                        "Mahatma Gandhi Bus Station Complex, Hyderabad",
                        new Place.Hours("open", "06:00-23:00", "Trains every 4-6 min"),
                        "OSM",
                        "2026-09-24T00:00:00Z",
                        "fresh",
                        false,
                        null,
                        List.of("Red Line & Green Line Interchange", "Smart Card / QR Ticketing"),
                        "Major Hyderabad Metro Dual-Line Interchange Hub",
                        null
                )
        );
        cityPlaces.put("hyderabad", hyderabad);

        // Delhi
        List<Place> delhi = List.of(
                new Place(
                        "p-del-01",
                        "AIIMS Apex Trauma Center & Emergency",
                        "अखिल भारतीय आयुर्विज्ञान संस्थान आपातकालीन",
                        "hospital",
                        500,
                        new LocationCoordinates(28.5672, 77.2100),
                        "IN",
                        "New Delhi",
                        "Sri Aurobindo Marg, Ansari Nagar, New Delhi 110029",
                        new Place.Hours("open", "24/7", "Emergency 24/7"),
                        "CURATED_REGISTRY",
                        "2026-09-24T06:00:00Z",
                        "fresh",
                        true,
                        "+91-11-2658-8500",
                        List.of("National Apex Trauma", "24h ICU", "Govt Premier Medical"),
                        "India's premier public emergency trauma center",
                        "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80"
                ),
                new Place(
                        "p-del-02",
                        "Apollo Pharmacy Connaught Place",
                        null,
                        "pharmacy",
                        180,
                        new LocationCoordinates(28.6328, 77.2195),
                        "IN",
                        "New Delhi",
                        "Block B, Inner Circle, Connaught Place, New Delhi 110001",
                        new Place.Hours("open", "24/7", "Open 24 Hours"),
                        "OSM",
                        "2026-09-23T10:00:00Z",
                        "fresh",
                        false,
                        "+91-11-2332-1111",
                        List.of("24/7 Chemist", "Prescriptions", "UPI/Card Accepted"),
                        "Central Connaught Place 24h chemist",
                        null
                )
        );
        cityPlaces.put("delhi", delhi);

        // Bangalore
        List<Place> bangalore = List.of(
                new Place(
                        "p-blr-01",
                        "Manipal Hospital HAL Airport Road ER",
                        null,
                        "hospital",
                        520,
                        new LocationCoordinates(12.9587, 77.6494),
                        "IN",
                        "Bengaluru",
                        "98, HAL Old Airport Rd, Kodihalli, Bengaluru 560017",
                        new Place.Hours("open", "24/7", "Emergency 24/7"),
                        "CURATED_REGISTRY",
                        "2026-09-24T06:00:00Z",
                        "fresh",
                        true,
                        "+91-80-2502-4444",
                        List.of("Tertiary Care Trauma", "Cardiac Emergency", "NABH Accredited"),
                        "Premier 24h Emergency and Trauma Care",
                        null
                )
        );
        cityPlaces.put("bangalore", bangalore);

        // Sydney
        List<Place> sydney = List.of(
                new Place(
                        "p-syd-01",
                        "St Vincent's Hospital Emergency Department",
                        null,
                        "hospital",
                        420,
                        new LocationCoordinates(-33.8785, 151.2215),
                        "AU",
                        "Sydney",
                        "390 Victoria St, Darlinghurst NSW 2010",
                        new Place.Hours("open", "24/7", "Emergency 24/7"),
                        "CURATED_REGISTRY",
                        "2026-09-24T06:00:00Z",
                        "fresh",
                        true,
                        "+61-2-8382-1111",
                        List.of("Level 1 Trauma", "24/7 Emergency"),
                        "Premier 24h Level 1 Trauma Emergency",
                        null
                )
        );
        cityPlaces.put("sydney", sydney);

        // Montreal
        List<Place> montreal = List.of(
                new Place(
                        "p-mtl-01",
                        "CHUM - Centre hospitalier de l'Université de Montréal",
                        null,
                        "hospital",
                        490,
                        new LocationCoordinates(45.5125, -73.5570),
                        "CA",
                        "Montreal",
                        "1051 Rue Sanguinet, Montréal, QC H2X 3E4",
                        new Place.Hours("open", "24/7", "Urgences 24/7"),
                        "CURATED_REGISTRY",
                        "2026-09-24T06:00:00Z",
                        "fresh",
                        true,
                        "+1-514-890-8000",
                        List.of("Trauma tertiaire", "Soins intensifs", "Bilingue En/Fr"),
                        "Trauma tertiaire 24h soins intensifs",
                        null
                )
        );
        cityPlaces.put("montreal", montreal);
    }
}
