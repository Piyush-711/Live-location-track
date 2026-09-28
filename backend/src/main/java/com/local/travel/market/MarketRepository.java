package com.local.travel.market;

import com.local.travel.discovery.LocationCoordinates;
import org.springframework.stereotype.Repository;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Repository
public class MarketRepository {

    private final List<LocalMarket> markets = new ArrayList<>();
    private final Map<String, LocalMarket> marketsById = new ConcurrentHashMap<>();

    public MarketRepository() {
        seedMarkets();
    }

    public List<LocalMarket> findAll() {
        return Collections.unmodifiableList(markets);
    }

    public Optional<LocalMarket> findById(String id) {
        return Optional.ofNullable(marketsById.get(id));
    }

    public List<LocalMarket> findByCityId(String cityId) {
        if (cityId == null || cityId.isBlank()) return findAll();
        String target = cityId.toLowerCase().trim();
        return markets.stream()
                .filter(m -> m.cityId() != null && m.cityId().equalsIgnoreCase(target))
                .toList();
    }

    private void addMarket(LocalMarket market) {
        markets.add(market);
        marketsById.put(market.id(), market);
    }

    private void seedMarkets() {
        // ==================== HYDERABAD ====================
        addMarket(new LocalMarket(
                "hyd-laad-bazaar",
                "Laad Bazaar & Charminar Market",
                "Old City, Hyderabad",
                "hyderabad",
                "jewelry",
                "Hyderabadi Pearls, Lacquer Bangles & Zari Bridal Sarees",
                "Historic 400-year-old market adjoining Charminar operating since the Qutb Shahi era. Famous for handcrafted stone-studded lacquer bangles, authentic Basra pearls, bridal khada dupattas, and natural ittar.",
                List.of("Hyderabadi Pearl Necklaces", "Stone Lacquer Bangles", "Bridal Khada Dupattas", "Zari Embroidered Kurtas", "Natural Mughlai Attar"),
                "Laad Bazaar Road, Near Charminar, Hyderabad 500002",
                new LocationCoordinates(17.3616, 78.4735),
                null,
                "Charminar Metro (Green Line) or MGBS Metro • 10 min",
                "Open 7 Days (Best after 4 PM)",
                "11:00 AM - 10:30 PM",
                "Ask for authentic certificate of guarantee for pearls. Bangle shops quote 40-50% higher initially.",
                "High (Quote 40-50% less)",
                "₹ (Artisan Direct / Budget to Luxury)",
                "Evening 5:00 PM – 9:30 PM under golden festive street lights",
                List.of("UPI (GPay / PhonePe)", "Cash Highly Preferred for Small Stalls", "Credit Cards in Jewellers"),
                "Pedestrian-only alleys; park at Charminar Bus Depot or take an auto/Metro",
                "Nimrah Cafe & Bakery right at Charminar gate (Irani Chai & Osmania biscuits) and Hotel Shadab",
                "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=80",
                List.of("jewelry", "pearls", "bangles", "bridal", "charminar", "laad bazaar", "hyderabad")
        ));

        addMarket(new LocalMarket(
                "hyd-begum-bazaar",
                "Begum Bazaar & Feelkhana Wholesale Hub",
                "Old Hyderabad",
                "hyderabad",
                "spices_food",
                "Asia's Giant Wholesale Spices, Dry Fruits & Household Goods",
                "The largest commercial wholesale market in Hyderabad, established during the Nizam era. Famous for towering sacks of spices (cardamom, cloves, saffron), wholesale dry fruits, brass and copper kitchen vessels, pooja articles, and wedding gifts at 40-60% below retail.",
                List.of("Wholesale Dry Fruits (Almonds, Cashews, Pistachios)", "Pure Spices & Biryani Potli Masala", "Brass & Copper Kitchen Vessels", "Wedding Gift Hampers & Packaging", "Festive Pooja Articles & Rangoli"),
                "Begum Bazaar Main Road, Afzal Gunj, Hyderabad 500012",
                new LocationCoordinates(17.3735, 78.4715),
                null,
                "Osmania Medical College Metro (Red Line) • 8 min walk",
                "Closed on Sundays",
                "10:00 AM - 08:30 PM",
                "Prices are already near wholesale; ask for bulk bundle pricing when buying 1kg+ of dry fruits or spices.",
                "Medium (15-25% discount)",
                "₹ (Direct Wholesale / 40-60% Off Retail)",
                "11:30 AM – 3:30 PM for quieter browsing before evening wholesale truck loading",
                List.of("UPI / PhonePe", "Cash Preferred", "Bank Transfer for Wholesale"),
                "Very congested alleys — park near Afzal Gunj bridge and walk",
                "Try Badam Milk & Lassi at century-old Matwale Doodh Ghar",
                "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=800&q=80",
                List.of("spices", "dry fruits", "wholesale", "biryani masala", "begum bazaar", "hyderabad")
        ));

        addMarket(new LocalMarket(
                "hyd-koti-electronics",
                "Koti (Gujarati Galli) Electronics & Tech Market",
                "Hyderabad",
                "hyderabad",
                "electronics",
                "Consumer Electronics, Smart TV Parts & Mobile Hardware",
                "Hyderabad's premier electronics and tech nerve center. Packed with multi-storey plazas for smart TV panels, amplifier circuit boards, camera parts, smartphone screens, wholesale tempered glass, CCTV security gear, and chip-level repair shops.",
                List.of("Smart TV LED Boards & Panels", "Mobile Phone Parts & Screen Replacements", "Pro Audio Amplifiers & DJ Sound", "CCTV Cameras & DVRs", "Soldering Stations & Multimeters"),
                "Gujarati Galli, Bank Street, Koti, Hyderabad 500095",
                new LocationCoordinates(17.3850, 78.4867),
                null,
                "Sultan Bazaar Metro (Red Line) • 5 min walk",
                "Closed on Sundays",
                "10:30 AM - 08:30 PM",
                "Always test electronic circuits or mobile screens at the shop counter testing bench before final payment. Cash gets an extra 5-10% discount over credit card.",
                "Medium (15-25% discount)",
                "₹ (Wholesale Component Rates)",
                "2:00 PM – 6:00 PM for all wholesalers open and technician availability",
                List.of("UPI", "Cash", "Credit/Debit Card"),
                "Park at Koti Women's College paid lot or arrive via Sultan Bazaar Metro",
                "Legendary Gokul Chat (famous for Hot Samosa Ragda, Mirchi Bhaji & Kulfi) 3 mins away",
                "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80",
                List.of("electronics", "mobile parts", "smart tv", "sound gear", "pc build", "koti", "hyderabad")
        ));

        addMarket(new LocalMarket(
                "hyd-ranigunj-auto",
                "Ranigunj (Secunderabad) Automobile & Bike Spares Market",
                "Secunderabad / Hyderabad",
                "hyderabad",
                "automobile",
                "Auto Spare Parts, Bike Modifications & Machine Hardware",
                "The undisputed automotive hub of Hyderabad and Secunderabad. Spans miles of shops for car alloy wheels, performance bike exhausts, Royal Enfield custom spares, car music touchscreens, batteries, and mechanical bearings.",
                List.of("Car Alloy Wheels & High-Performance Tyres", "Royal Enfield Modification Kits", "Car Touchscreen Infotainment & Subwoofers", "Two-Wheeler Carburetors & Chains", "Automotive Batteries & Inverters"),
                "Ranigunj Main Road, Mahatma Gandhi Road, Secunderabad 500003",
                new LocationCoordinates(17.4335, 78.4910),
                null,
                "Paradise Metro (Blue Line) or Secunderabad West Metro • 7 min",
                "Closed on Sundays",
                "10:00 AM - 08:00 PM",
                "Compare prices across at least 3 shops. Negotiation for installation and mechanic fitment labor can be done right in the street behind the main stores.",
                "Medium (15-25% discount)",
                "₹₹ (Direct Factory Distributor Rates)",
                "Morning 11:00 AM – 3:00 PM for mechanic fitment bays",
                List.of("UPI", "Cash", "Cards"),
                "Street parking can be tight; side street mechanic bays allow car parking during installation",
                "Paradise Biryani flagship heritage restaurant is within 5 minutes walking distance",
                "https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=800&q=80",
                List.of("automobile", "car spares", "bike parts", "tyres", "alloys", "ranigunj", "secunderabad", "hyderabad")
        ));

        addMarket(new LocalMarket(
                "hyd-general-bazaar",
                "General Bazaar & Tobacco Bazaar (Secunderabad)",
                "Secunderabad / Hyderabad",
                "hyderabad",
                "clothes",
                "Wholesale Textiles, Bridal Lehengas & Silk Sarees",
                "A massive bustling covered market labyrinth in Secunderabad dating back over a century. Known for endless rows of bridal lehengas, Kanjeevaram & Pochampally silk sarees, dress materials, footwear, and nightwear at factory prices.",
                List.of("Bridal Lehengas & Gowns", "Pochampally Ikkat Silk Sarees", "Unstitched Cotton & Silk Suits", "Ethnic Mojaris & Bangles", "Designer Dupattas & Borders"),
                "General Bazaar, M.G. Road, Secunderabad 500003",
                new LocationCoordinates(17.4395, 78.4985),
                null,
                "Paradise Metro • 5 min walk",
                "Closed on Sundays",
                "10:30 AM - 09:00 PM",
                "Inner narrow lanes have much better prices than outer MG Road facades. Ask for wholesale cut piece rates for salwar suit fabrics.",
                "High (Quote 40-50% less)",
                "₹ (Factory Surplus to Designer)",
                "3:00 PM – 7:00 PM",
                List.of("UPI", "Cash", "Cards"),
                "Two-wheeler or Metro recommended; lanes are extremely narrow for cars",
                "Secunderabad Clock Tower & historic Irani cafes",
                "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=800&q=80",
                List.of("clothes", "sarees", "lehenga", "fabrics", "general bazaar", "secunderabad", "hyderabad")
        ));

        addMarket(new LocalMarket(
                "hyd-sultan-bazaar",
                "Sultan Bazaar & Badichowdi",
                "Hyderabad",
                "hyderabad",
                "clothes",
                "Ethnic Street Fashion, Kurtis, Footwear & Bangles",
                "One of Hyderabad's oldest and liveliest shopping arcades, established in the 1800s. Packed with affordable college fashion, cotton Kurtis, traditional silver earrings, Kolhapuri footwear, and festive jewelry.",
                List.of("Everyday & Festive Kurtis", "Kolhapuri Sandals & Juttis", "Silver & Oxidized Jewelry", "Handbags & Clutches", "Cotton Nightwear & Leggings"),
                "Sultan Bazaar Road, Koti, Hyderabad 500095",
                new LocationCoordinates(17.3875, 78.4870),
                null,
                "Sultan Bazaar Metro (Red Line) • Direct station exit",
                "Open 7 Days",
                "11:00 AM - 09:30 PM",
                "Street hawkers and roadside apparel vendors expect bargaining. Start at 50% of the quoted price.",
                "High (Quote 40-50% less)",
                "₹ (Extremely Budget-Friendly)",
                "Evening 4:30 PM – 8:30 PM when street stalls light up",
                List.of("UPI", "Cash"),
                "Direct Metro connectivity; exit directly into the bazaar entrance",
                "Gokul Chat & Pragati Tiffin Center nearby for butter dosas",
                "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=800&q=80",
                List.of("clothes", "kurtis", "footwear", "fashion", "street market", "sultan bazaar", "hyderabad")
        ));

        addMarket(new LocalMarket(
                "hyd-mj-market",
                "Moazzam Jahi (MJ) Market & Jam Bagh",
                "Central Hyderabad",
                "hyderabad",
                "spices_food",
                "Historic Granite Stone Market, Dry Fruits, Natural Ittar & Ice Cream",
                "Iconic 1935 Nizam-era stone landmark with a central clock tower. Famous for wholesale dry fruits, organic honey, exotic seasonal fruits, natural flower bazaar, and the century-old handmade natural ice creams (sapota, mango, custard apple).",
                List.of("Hand-Churned Famous Ice Cream (Custard Apple / Sitaphal, Mango, Fig)", "Fresh Dry Fruits & Spices", "Pure Forest Honey", "Traditional Nizam Ittar", "Exotic Seasonal Fruits"),
                "Mozamjahi Market Road, Abids, Hyderabad 500001",
                new LocationCoordinates(17.3802, 78.4770),
                null,
                "Gandhi Bhavan Metro (Red Line) • 3 min walk",
                "Open 7 Days",
                "09:00 AM - 11:30 PM",
                "Ice cream is fixed price (around ₹40-60 per bowl). For dry fruits, buy 500g or 1kg tins for maximum wholesale discount.",
                "Fixed / Wholesale trade rate",
                "₹ (Fair Wholesale & Affordable Heritage Food)",
                "Late evening 7:00 PM – 11:00 PM for the heritage lighting and fresh ice cream crowd",
                List.of("UPI", "Cash", "Cards"),
                "Ample parking inside the newly restored heritage complex courtyard",
                "Famous Ice Cream stall inside the heritage quadrangle",
                "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80",
                List.of("spices", "dry fruits", "ice cream", "heritage", "fruits", "mj market", "hyderabad")
        ));

        addMarket(new LocalMarket(
                "hyd-madina-market",
                "Madina Market & Pathergatti Arcades",
                "Old City, Hyderabad",
                "hyderabad",
                "wholesale",
                "Historic Nizam Arcades, Wholesale Fabrics & Sherwanis",
                "Heritage stone arcades built by the 7th Nizam in the 1930s. The major wholesale hub for wedding textiles, unstitched suit materials, sherwanis, and burqas supplying retailers across South India.",
                List.of("Wholesale Fabric Rolls", "Men's Wedding Sherwanis & Kurtas", "Embroidered Velvet Materials", "Traditional Burqas & Hijabs", "Attar & Incense"),
                "Pathergatti Road, Near Madina Building, Hyderabad 500002",
                new LocationCoordinates(17.3680, 78.4750),
                null,
                "MGBS Metro • 10 min walk",
                "Open 7 Days",
                "10:30 AM - 09:30 PM",
                "Wholesale shops require minimum meterage (5-10m) for bottom rates; ask for than (full roll) price.",
                "High (Quote 40-50% less)",
                "₹ (Direct Factory Wholesale)",
                "12:00 PM – 4:00 PM",
                List.of("UPI", "Cash", "NEFT / RTGS"),
                "Take auto or Metro to MGBS to avoid traffic gridlock near the old bridge",
                "Hotel Shadab right at the corner — world famous for Hyderabadi Mutton Dum Biryani & Paya Nahari",
                "https://images.unsplash.com/photo-1579202673506-ca3ce28943ef?auto=format&fit=crop&w=800&q=80",
                List.of("wholesale", "fabrics", "textiles", "sherwani", "madina market", "hyderabad")
        ));

        // ==================== DELHI ====================
        addMarket(new LocalMarket(
                "delhi-nehru-place",
                "Nehru Place IT & Electronics Market",
                "New Delhi",
                "delhi",
                "electronics",
                "IT, Laptops & Computer Hardware",
                "Asia's largest computer and consumer electronics market. The ultimate destination for custom PC builds, laptop components, graphics cards, chip repairs, and wholesale peripherals.",
                List.of("Custom Gaming PCs", "Laptops & MacBooks", "Graphics Cards & RAM", "Motherboard Repairs", "External Hard Drives", "Printers & Cartridges"),
                "Nehru Place Commercial Complex, Lala Lajpat Rai Road, New Delhi 110019",
                new LocationCoordinates(28.5494, 77.2526),
                null,
                "Nehru Place Metro (Violet Line) • Gate 1",
                "Closed on Sundays",
                "10:30 AM - 08:00 PM",
                "Compare prices across 3-4 shops in the inner plazas. Always insist on an official GST invoice with manufacturer warranty stamp.",
                "Medium (15-25% discount)",
                "₹ (Wholesale & Distributor Rates)",
                "2:00 PM – 6:30 PM",
                List.of("UPI", "Cash", "Credit Card"),
                "Multi-level automated parking garage available at metro station",
                "Famous street momos and Royal Cafe at Nehru Place center",
                "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80",
                List.of("electronics", "computers", "laptops", "hardware", "graphics cards", "repairs", "pc build", "nehru place", "delhi")
        ));

        addMarket(new LocalMarket(
                "delhi-bhagirath-palace",
                "Bhagirath Palace Electrical & Electronics Market",
                "Old Delhi",
                "delhi",
                "electronics",
                "Wholesale Lighting, Electrical & Medical Electronics",
                "Asia's largest wholesale hub for decorative lighting, chandeliers, commercial LEDs, industrial switchgear, wires, and surgical medical electronics.",
                List.of("Chandeliers & Fairy Lights", "Designer LED Panels", "Electrical Components", "Industrial Cables", "Medical Diagnostics Equipment"),
                "Near Red Fort & Chandni Chowk Metro, Old Delhi 110006",
                new LocationCoordinates(28.6562, 77.2335),
                null,
                "Chandni Chowk Metro (Yellow Line) • Gate 5",
                "Closed on Sundays",
                "10:00 AM - 07:30 PM",
                "Prices here are 40-60% lower than retail malls. Buying in bulk or packs gets massive wholesale trade discounts.",
                "High (Quote 40-50% less)",
                "₹ (Direct Wholesale / Factory)",
                "11:00 AM – 4:00 PM",
                List.of("UPI", "Cash"),
                "Chandni Chowk pedestrian zone; park at Gandhi Maidan or take Metro",
                "Jalebi Wala & Paranthe Wali Gali 4 minutes away",
                "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=800&q=80",
                List.of("electronics", "lights", "led", "chandeliers", "electrical", "bhagirath palace", "chandni chowk", "delhi")
        ));

        addMarket(new LocalMarket(
                "delhi-ghaffar-market",
                "Ghaffar Market (Karol Bagh)",
                "New Delhi",
                "delhi",
                "electronics",
                "Smartphones, Gadgets & Imported Electronics",
                "Famous for imported smartphones, gaming consoles (PlayStation, Xbox), drone accessories, wholesale tempered glass, smartphone screen replacements, and camera accessories.",
                List.of("Mobile Phones & Cases", "Fast Chargers & Cables", "Gaming Consoles", "Smartwatches & Airpods", "Instant Display Repairs"),
                "Arya Samaj Road, Block 23, Karol Bagh, New Delhi 110005",
                new LocationCoordinates(28.6517, 77.1906),
                null,
                "Karol Bagh Metro (Blue Line) • Gate 2",
                "Closed on Mondays",
                "11:00 AM - 08:30 PM",
                "Test all mobile accessories and screens in front of the technician before making payment. Cash is preferred by smaller stalls.",
                "Medium (15-25% discount)",
                "₹ (Discount Gadgets)",
                "3:00 PM – 7:30 PM",
                List.of("UPI", "Cash"),
                "Underground municipal parking on Arya Samaj Road",
                "Roshan Di Kulfi & Bikanervala Karol Bagh",
                "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80",
                List.of("electronics", "mobile phones", "gadgets", "chargers", "gaming", "ghaffar market", "karol bagh", "delhi")
        ));

        addMarket(new LocalMarket(
                "delhi-sarojini-nagar",
                "Sarojini Nagar Market",
                "South Delhi",
                "delhi",
                "clothes",
                "Export Surplus, Branded Fast Fashion & Thrift",
                "Delhi's most legendary budget fashion paradise. Famous for export surplus Western clothes, Zara/H&M factory overruns, jackets, designer bags, sunglasses, and footwear at unbelievable prices.",
                List.of("Trendy Dresses & Tops", "Denim Jackets & Jeans", "Tote Bags & Handbags", "Footwear & Boots", "Winter Coats & Sweaters"),
                "Sarojini Nagar, South West Delhi, New Delhi 110023",
                new LocationCoordinates(28.5772, 77.1983),
                null,
                "Sarojini Nagar Metro (Pink Line) • Gate 1",
                "Closed on Mondays",
                "11:00 AM - 09:00 PM",
                "Start bargaining at 40-50% of the quoted price. Look closely for loose buttons or factory export defect tags. Carry cash and a sturdy tote bag.",
                "High (Quote 40-50% less)",
                "₹ (Bargain Thrift / ₹100-₹500 typical)",
                "Afternoon 1:00 PM – 5:00 PM before extreme evening rush",
                List.of("UPI", "Cash Preferred"),
                "Multi-level automated car parking at Sarojini Nagar Metro",
                "Famous Shakarkandi (Sweet Potato Chaat) & Hot Bread Pakodas",
                "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=800&q=80",
                List.of("clothes", "fashion", "street shopping", "dresses", "jackets", "sarojini nagar", "delhi")
        ));

        addMarket(new LocalMarket(
                "delhi-mayapuri-auto",
                "Mayapuri Automobile Scrap & Spares Market",
                "West Delhi",
                "delhi",
                "automobile",
                "Asia's Largest Auto Scrap, Engines & Spare Parts Hub",
                "Asia's undisputed giant for vehicle recycling and salvaged parts. The go-to destination for replacement car engines, gearboxes, vintage vehicle parts, alloy rims, chassis, and custom modification spares.",
                List.of("Complete Car Engines & Gearboxes", "Alloy Rims & Performance Tyres", "Headlight & Taillight Assemblies", "4x4 Gypsy & Thar Offroad Mod Parts", "Heavy Commercial Vehicle Spares"),
                "Mayapuri Industrial Area Phase II, New Delhi 110064",
                new LocationCoordinates(28.6292, 77.1265),
                null,
                "Mayapuri Metro (Pink Line) • 5 min walk",
                "Closed on Sundays",
                "10:00 AM - 07:00 PM",
                "Take a trusted mechanic with you to test compression and engine blocks. Verify serial numbers to ensure legal origin.",
                "Medium (15-25% discount)",
                "₹₹ (Recycled & Salvaged 60-80% off new OEM)",
                "11:00 AM – 3:30 PM",
                List.of("UPI", "Cash", "Bank Transfer"),
                "Ample roadside truck bays in Phase II",
                "Dhaba lane near Phase I railway crossing",
                "https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=800&q=80",
                List.of("automobile", "spare parts", "engines", "alloys", "modifications", "mayapuri", "delhi")
        ));

        // ==================== MUMBAI ====================
        addMarket(new LocalMarket(
                "mumbai-lamington-road",
                "Lamington Road (Dr. D.B. Marg) Electronics Market",
                "South Mumbai",
                "mumbai",
                "electronics",
                "IT Hardware, PC Gaming, Audio & Electronic Components",
                "Mumbai's IT and electronics nerve center. Famous for custom high-end PC builds, transistors, amplifiers, motherboard soldering, imported graphics cards, and wholesale electronics.",
                List.of("Gaming PC Components", "Custom Motherboards & GPUs", "High-End Audio Amplifiers", "Soldering & Circuit Boards", "Microphones & Studio Gear"),
                "Dr. Dadasaheb Bhadkamkar Marg, Grant Road East, Mumbai 400007",
                new LocationCoordinates(18.9633, 72.8188),
                null,
                "Grant Road Railway Station (Western Line) • 2 min walk",
                "Closed on Sundays",
                "10:30 AM - 08:30 PM",
                "Compare quotes between Police Station junction and top of the bridge. Always ask for manufacturer serial warranty slips.",
                "Medium (15-25% discount)",
                "₹ (Wholesale Component Rates)",
                "1:00 PM – 5:30 PM",
                List.of("UPI", "Cash", "Cards"),
                "Narrow streets; arrive by Western Railway local train to Grant Road",
                "Historic Parsi Irani cafes near Grant Road station",
                "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80",
                List.of("electronics", "computers", "pc hardware", "lamington road", "mumbai")
        ));

        addMarket(new LocalMarket(
                "mumbai-colaba-causeway",
                "Colaba Causeway (Shahid Bhagat Singh Road)",
                "South Mumbai",
                "mumbai",
                "clothes",
                "Bohemian Street Fashion, Brass Antiques, Footwear & Jewelry",
                "Iconic shopping avenue right near the Gateway of India. Famous for stylish summer dresses, Kolhapuri chappals, vintage brass artifacts, junk jewelry, and sunglasses.",
                List.of("Boho Maxi Dresses & Tops", "Brass Antiques & Compasses", "Silver & Beaded Jewelry", "Kolhapuri Chappals & Sandals", "Vintage Watches"),
                "Bakhtawar, Colaba Causeway, South Mumbai 400001",
                new LocationCoordinates(18.9220, 72.8315),
                null,
                "Churchgate / CSMT Station • 10 min taxi",
                "Open 7 Days",
                "11:00 AM - 10:00 PM",
                "Start bargaining at 40-50% for sidewalk clothes and jewelry stalls.",
                "High (Quote 40-50% less)",
                "₹ (Affordable Street Shopping)",
                "Evening 5:00 PM – 8:30 PM",
                List.of("UPI", "Cash", "Cards in Stores"),
                "Pay-and-park near Regal Cinema / Apollo Bunder",
                "Legendary Cafe Leopold & Cafe Mondegar right on the Causeway strip",
                "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=800&q=80",
                List.of("clothes", "fashion", "antiques", "jewelry", "colaba causeway", "mumbai")
        ));

        // ==================== BANGALORE ====================
        addMarket(new LocalMarket(
                "blr-sp-road",
                "SP Road (Sadarth Patrappa Road) Electronics Market",
                "Bengaluru",
                "bangalore",
                "electronics",
                "IT Hardware, Custom Gaming Rigs & Electronic Components",
                "South India's silicon street. The ultimate destination for custom PC builds, Arduino/Raspberry Pi microcontrollers, sensors, industrial electronics, and motherboard soldering repairs.",
                List.of("Custom Gaming Desktops", "Motherboards & CPUs", "Robotics & Arduino Kits", "Camera Cables & Adaptors", "LED Strips & Soldering Gear"),
                "SP Road, Dodpete, Nagarathpete, Bengaluru 560002",
                new LocationCoordinates(12.9644, 77.5855),
                null,
                "Krishna Rajendra Market (Green Line) • 5 min walk",
                "Closed on Sundays",
                "11:00 AM - 08:30 PM",
                "Ask for composite package pricing when buying CPU, motherboard, and graphics card together from distributors.",
                "Medium (15-25% discount)",
                "₹ (Wholesale Component Rates)",
                "2:00 PM – 6:00 PM",
                List.of("UPI", "Cash", "Cards"),
                "KR Market multi-level parking; walk 400m to avoid vehicle congestion",
                "Vidyarthi Bhavan (historic Masala Dosa) 10 minutes away in Gandhi Bazaar",
                "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80",
                List.of("electronics", "computers", "pc build", "hardware", "sp road", "bangalore")
        ));

        addMarket(new LocalMarket(
                "blr-commercial-street",
                "Commercial Street & Brigade Road",
                "Bengaluru",
                "bangalore",
                "clothes",
                "Apparel, Footwear, Tailoring & Street Fashion",
                "Bangalore's most vibrant shopping hub. Lined with fashion stores, boutique tailors, silver jewelry alleys, Pashmina shawls, and international fashion outlets.",
                List.of("Designer Dress Materials", "Custom-Tailored Blouses & Suits", "Kolhapuri Sandals", "Silver Earrings & Bangles", "Denim Jeans"),
                "Commercial Street, Tasker Town, Shivaji Nagar, Bengaluru 560001",
                new LocationCoordinates(12.9822, 77.6083),
                null,
                "Mahatma Gandhi Road (Purple Line) • 8 min walk",
                "Open 7 Days",
                "10:30 AM - 09:30 PM",
                "The smaller cross-lanes (Ebrahim Sahib Street) have much better deals on fabrics than the main road showrooms.",
                "High (Quote 40-50% less)",
                "₹ (Mid-range & Budget Street Stalls)",
                "3:30 PM – 8:00 PM",
                List.of("UPI", "Cash", "Cards"),
                "Shivajinagar Bus Station multi-level parking",
                "Woody's or Airlines Hotel for authentic filter coffee",
                "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=800&q=80",
                List.of("clothes", "fashion", "commercial street", "bangalore")
        ));

        // ==================== VIJAYAWADA ====================
        addMarket(new LocalMarket(
                "vja-besant-road",
                "Besant Road Market",
                "Governorpet, Vijayawada",
                "vijayawada",
                "clothes",
                "Apparel, Traditional Textiles & Electronics",
                "The beating retail heart of Vijayawada. Bustling commercial strip lined with wholesale saree merchants, trendy college garments, smartphone accessories, and footwear shops.",
                List.of("Kalamkari & Cotton Sarees", "Dress Materials & Ready-made Salwars", "Smartphone Accessories & Fast Chargers", "Leather Footwear & Chappals", "Silver Jewelry & Pooja Items"),
                "Besant Road, Governorpet, Vijayawada 520002",
                new LocationCoordinates(16.5128, 78.6288),
                null,
                "Vijayawada City Bus Terminal (PNBS) • 10 min",
                "Open 7 Days (Best after 4 PM)",
                "10:00 AM - 09:30 PM",
                "For sarees, visit the inner lane wholesale outlets (Vastralatha complex) rather than street front.",
                "Medium (15-25% discount)",
                "₹ (Affordable Direct Wholesale)",
                "4:00 PM – 9:00 PM",
                List.of("UPI", "Cash"),
                "Use PNBS parking and take auto to Besant Road entrance",
                "Babai Hotel (legendary Idli with white butter) 8 min away",
                "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=800&q=80",
                List.of("clothes", "sarees", "electronics", "besant road", "vijayawada")
        ));

        // ==================== LONDON ====================
        addMarket(new LocalMarket(
                "london-camden-market",
                "Camden Market & Stables",
                "North London",
                "london",
                "clothes",
                "Alternative Fashion, Vintage Streetwear & Global Food",
                "World-famous eclectic market set in historic canal-side horse stables. Known for punk/goth fashion, retro vinyl records, handmade leather goods, and international food stalls.",
                List.of("Vintage Denim & Leather", "Independent Designer Tops", "Vinyl Records", "Handmade Silver Trinkets", "Street Food Delicacies"),
                "Camden Lock Place, Chalk Farm Road, London NW1 8AF",
                new LocationCoordinates(51.5414, -0.1466),
                null,
                "Camden Town Underground (Northern Line) • 3 min walk",
                "Open 7 Days",
                "10:00 AM - 06:30 PM",
                "Independent craft and vintage sellers in the Stables may negotiate for cash on multi-item bundles.",
                "Medium (15-25% discount)",
                "££ (Artisan & Vintage)",
                "11:00 AM – 4:00 PM",
                List.of("Contactless Card", "Apple/Google Pay", "Cash"),
                "Take Northern Line Tube; parking in Camden is strictly restricted",
                "Camden Lock canal-side street food stalls & nitrogen ice cream",
                "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80",
                List.of("clothes", "vintage", "fashion", "street food", "camden market", "london")
        ));

        // ==================== KYOTO ====================
        addMarket(new LocalMarket(
                "kyoto-nishiki",
                "Nishiki Market (Kyoto’s Kitchen)",
                "Kyoto",
                "kyoto",
                "spices_food",
                "400-Year-Old Traditional Food, Skewers & Culinary Ware",
                "Narrow five-block shopping street with more than a hundred food stalls and culinary shops. Famous for handcrafted Aritsugu chef knives, matcha sweets, tsukemono pickles, and fresh seafood skewers.",
                List.of("Hand-Forged Japanese Chef Knives", "Ceremonial Uji Matcha", "Kyoto Tsukemono Pickles", "Tako Tamago Skewers", "Chopsticks & Ceramic Bowls"),
                "Nishikikoji-dori, Nakagyo Ward, Kyoto 604-8054",
                new LocationCoordinates(35.0050, 135.7645),
                null,
                "Karasuma Station (Hankyu Line) or Shijo Station (Subway)",
                "Open 7 Days (Some stalls close Wednesdays)",
                "10:00 AM - 06:00 PM",
                "Prices in Japan are fixed and non-negotiable. Eat food in designated shop standing areas rather than walking while eating.",
                "Fixed / Wholesale trade rate",
                "¥¥ (Culinary Speciality)",
                "11:00 AM – 3:30 PM",
                List.of("IC Card (Suica/Pasmo/ICOCA)", "Cash", "Credit Card"),
                "Subway to Shijo or Hankyu to Karasuma Station",
                "Aritsugu knife shop (knife makers since 1560) and freshly fried soy donuts",
                "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80",
                List.of("food", "spices", "culinary", "knives", "nishiki market", "kyoto")
        ));
    }
}
