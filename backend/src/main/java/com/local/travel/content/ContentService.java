package com.local.travel.content;

import com.local.travel.discovery.PlaceRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class ContentService {

    private final PlaceRepository placeRepository;
    private final Map<String, EmergencyDossier> dossiers = new ConcurrentHashMap<>();
    private final Map<String, CountryBriefing> briefings = new ConcurrentHashMap<>();

    public ContentService(PlaceRepository placeRepository) {
        this.placeRepository = placeRepository;
        seedContent();
    }

    public EmergencyDossier getEmergencyDossier(String countryCode) {
        return dossiers.getOrDefault(countryCode.toUpperCase(), dossiers.get("JP"));
    }

    public CountryBriefing getCountryBriefing(String countryCode) {
        return briefings.getOrDefault(countryCode.toUpperCase(), briefings.get("JP"));
    }

    private void seedContent() {
        // Japan
        dossiers.put("JP", new EmergencyDossier(
                "JP",
                "Japan",
                "Kyoto",
                List.of(
                        new EmergencyDossier.Hotline("Police (警察)", "110", "Free instant emergency call from any phone.", true),
                        new EmergencyDossier.Hotline("Ambulance & Fire (救急・消防)", "119", "Immediate medical dispatch. Multilingual interpretation available.", true),
                        new EmergencyDossier.Hotline("Japan Helpline", "0570-000-911", "24-hour English emergency travel crisis assistance.", true)
                ),
                List.of(
                        new EmergencyDossier.Phrase("Medical", "Please call an ambulance!", "救急車を呼んでください！", "Kyūkyūsha o yonde kudasai!"),
                        new EmergencyDossier.Phrase("Location", "Where is the nearest hospital?", "一番近い病院はどこですか？", "Ichiban chikai byōin wa doko desu ka?"),
                        new EmergencyDossier.Phrase("Safety", "Help me! Police!", "助けて！警察を呼んで！", "Tasukete! Keisatsu o yonde!")
                ),
                placeRepository.findById("p-kyoto-01").orElse(null)
        ));

        briefings.put("JP", new CountryBriefing(
                "JP",
                "Japan",
                "Kyoto",
                "+81",
                "JST (UTC+9)",
                "JPY",
                "¥",
                "Type A & B (100V, 50/60Hz)",
                "100V",
                "Tap IC Cards (Suica, Pasmo, ICOCA) on buses and trains. Mobile IC cards work without battery reserve.",
                List.of(
                        "Tipping is strictly not customary and can cause confusion or polite refusal.",
                        "Maintain low voice levels on transit; phone calls on trains are discouraged.",
                        "Carry small bags for waste: public trash cans are rare outside train stations."
                )
        ));

        // United Kingdom
        dossiers.put("GB", new EmergencyDossier(
                "GB",
                "United Kingdom",
                "London",
                List.of(
                        new EmergencyDossier.Hotline("Emergency Services (All)", "999", "Police, Ambulance, Fire. Free call.", true),
                        new EmergencyDossier.Hotline("Pan-European Emergency", "112", "Routes directly to 999 response centers.", true)
                ),
                List.of(
                        new EmergencyDossier.Phrase("Medical", "I need emergency medical assistance.", "Emergency: Need paramedic on-site.", "Direct notice for UK first responders.")
                ),
                placeRepository.findById("p-lon-01").orElse(null)
        ));

        briefings.put("GB", new CountryBriefing(
                "GB",
                "United Kingdom",
                "London",
                "+44",
                "GMT / BST (UTC+0 / UTC+1)",
                "GBP",
                "£",
                "Type G (230V, 50Hz)",
                "230V",
                "Tap any contactless credit card or Apple/Google Pay on London Underground and buses for daily fare caps.",
                List.of(
                        "Stand on the right on escalators, walk on the left.",
                        "Queueing is an essential social norm; always respect the line."
                )
        ));

        // India
        dossiers.put("IN", new EmergencyDossier(
                "IN",
                "India",
                "Mumbai",
                List.of(
                        new EmergencyDossier.Hotline("National Emergency Unified (ERSS)", "112", "Single unified emergency helpline across all Indian States & UTs.", true),
                        new EmergencyDossier.Hotline("Ambulance", "108", "State government emergency ambulance network.", true),
                        new EmergencyDossier.Hotline("Police Control", "100", "Local city police control room dispatch.", true)
                ),
                List.of(
                        new EmergencyDossier.Phrase("Medical", "Please call an ambulance immediately!", "कृपया तुरंत एम्बुलेंस बुलाएं!", "Kripya turant ambulance bulayein!")
                ),
                placeRepository.findById("p-bom-01").orElse(null)
        ));

        briefings.put("IN", new CountryBriefing(
                "IN",
                "India",
                "Mumbai",
                "+91",
                "IST (UTC+5:30)",
                "INR",
                "₹",
                "Type C, D & M (230V, 50Hz)",
                "230V",
                "UPI QR code payments (Google Pay, PhonePe) are accepted universally, even by street vendors.",
                List.of(
                        "Remove footwear before entering homes and places of worship.",
                        "Eat and exchange money or objects predominantly with your right hand."
                )
        ));

        // United States
        dossiers.put("US", new EmergencyDossier(
                "US",
                "United States",
                "New York",
                List.of(
                        new EmergencyDossier.Hotline("Emergency Dispatch (911)", "911", "Nationwide emergency dispatch for Police, EMS, and Fire.", true),
                        new EmergencyDossier.Hotline("Poison Control Center", "1-800-222-1222", "24/7 toxic substance exposure guidance.", true)
                ),
                List.of(
                        new EmergencyDossier.Phrase("Medical", "Dial 911 immediately.", "Emergency 911 dispatch.", "Provide intersection or GPS coordinates.")
                ),
                placeRepository.findById("p-nyc-01").orElse(null)
        ));

        briefings.put("US", new CountryBriefing(
                "US",
                "United States",
                "New York",
                "+1",
                "EST / EDT (UTC-5 / UTC-4)",
                "USD",
                "$",
                "Type A & B (120V, 60Hz)",
                "120V",
                "Use OMNY contactless tap-and-go at all NYC subway turnstiles. 12 rides in 7 days unlocks free rides for the week.",
                List.of(
                        "Tipping 18-20% is expected for sit-down restaurant table service.",
                        "Sales tax is added at the register and not included in marked shelf prices."
                )
        ));
    }
}
