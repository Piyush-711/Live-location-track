import { LocalMarket, LocalMarketSpecialty, Place } from '../types';
import { getDistance } from 'geolib';
import { LiveLocationState } from '../hooks/useLiveLocation';

export interface SpecialtyMeta {
  id: LocalMarketSpecialty | 'all';
  label: string;
  icon: string;
  emoji: string;
  colorHex: string;
  badgeClass: string;
}

export const MARKET_SPECIALTIES: SpecialtyMeta[] = [
  { id: 'all', label: 'All Markets', icon: 'storefront', emoji: '🏪', colorHex: '#0284c7', badgeClass: 'bg-sky-50 text-sky-700 border-sky-200' },
  { id: 'electronics', label: 'Electronics & Hardware', icon: 'devices', emoji: '💻', colorHex: '#0284c7', badgeClass: 'bg-blue-50 text-blue-700 border-blue-200' },
  { id: 'clothes', label: 'Clothes & Fashion', icon: 'apparel', emoji: '👗', colorHex: '#db2777', badgeClass: 'bg-pink-50 text-pink-700 border-pink-200' },
  { id: 'automobile', label: 'Automobile & Spare Parts', icon: 'car_repair', emoji: '🚗', colorHex: '#ea580c', badgeClass: 'bg-orange-50 text-orange-700 border-orange-200' },
  { id: 'spices_food', label: 'Spices & Gourmet Food', icon: 'nutrition', emoji: '🌶️', colorHex: '#16a34a', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { id: 'jewelry', label: 'Jewelry & Silverware', icon: 'diamond', emoji: '💍', colorHex: '#d97706', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200' },
  { id: 'antiques_handicrafts', label: 'Antiques & Crafts', icon: 'draw', emoji: '🏺', colorHex: '#7c3aed', badgeClass: 'bg-purple-50 text-purple-700 border-purple-200' },
  { id: 'wholesale', label: 'Wholesale Bazaars', icon: 'inventory_2', emoji: '📦', colorHex: '#475569', badgeClass: 'bg-slate-100 text-slate-700 border-slate-200' },
];

const CURATED_MARKETS: LocalMarket[] = [
  // ==================== DELHI LOCAL MARKETS ====================
  // Electronics
  {
    id: 'delhi-nehru-place',
    name: 'Nehru Place IT & Electronics Market',
    city: 'New Delhi',
    cityId: 'delhi',
    specialty: 'electronics',
    specialtyLabel: 'IT, Laptops & Computer Hardware',
    famousFor: "Asia's largest computer and consumer electronics market. The ultimate destination for custom PC builds, laptop components, graphics cards, chip repairs, and wholesale peripherals.",
    whatToBuy: ['Custom Gaming PCs', 'Laptops & MacBooks', 'Graphics Cards & RAM', 'Motherboard Repairs', 'External Hard Drives', 'Printers & Cartridges'],
    address: 'Nehru Place Commercial Complex, Lala Lajpat Rai Road, New Delhi 110019',
    location: { latitude: 28.5494, longitude: 77.2526 },
    metroStation: 'Nehru Place Metro (Violet Line) • Gate 1',
    closedOn: 'Closed on Sundays',
    timings: '10:30 AM - 08:00 PM',
    bargainingTip: 'Compare prices across 3-4 shops in the inner plazas. Always insist on an official GST invoice with manufacturer warranty stamp.',
    imageUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80',
    tags: ['electronics', 'computers', 'laptops', 'hardware', 'graphics cards', 'repairs', 'pc build', 'nehru place', 'delhi']
  },
  {
    id: 'delhi-bhagirath-palace',
    name: 'Bhagirath Palace Electrical & Electronics Market',
    city: 'Old Delhi',
    cityId: 'delhi',
    specialty: 'electronics',
    specialtyLabel: 'Wholesale Lighting, Electrical & Medical Electronics',
    famousFor: "Asia's largest wholesale hub for decorative lighting, chandeliers, commercial LEDs, industrial switchgear, wires, and surgical medical electronics.",
    whatToBuy: ['Chandeliers & Fairy Lights', 'Designer LED Panels', 'Electrical Components', 'Industrial Cables', 'Medical Diagnostics Equipment'],
    address: 'Near Red Fort & Chandni Chowk Metro, Old Delhi 110006',
    location: { latitude: 28.6562, longitude: 77.2335 },
    metroStation: 'Chandni Chowk Metro (Yellow Line) • Gate 5',
    closedOn: 'Closed on Sundays',
    timings: '10:00 AM - 07:30 PM',
    bargainingTip: 'Prices here are 40-60% lower than retail malls. Buying in bulk or packs gets massive wholesale trade discounts.',
    imageUrl: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=800&q=80',
    tags: ['electronics', 'lights', 'led', 'chandeliers', 'electrical', 'bhagirath palace', 'chandni chowk', 'delhi']
  },
  {
    id: 'delhi-ghaffar-market',
    name: 'Ghaffar Market (Karol Bagh)',
    city: 'New Delhi',
    cityId: 'delhi',
    specialty: 'electronics',
    specialtyLabel: 'Smartphones, Gadgets & Imported Electronics',
    famousFor: 'Famous for imported smartphones, gaming consoles (PlayStation, Xbox), drone accessories, wholesale tempered glass, smartphone screen replacements, and camera accessories.',
    whatToBuy: ['Mobile Phones & Cases', 'Fast Chargers & Cables', 'Gaming Consoles', 'Smartwatches & Airpods', 'Instant Display Repairs'],
    address: 'Arya Samaj Road, Block 23, Karol Bagh, New Delhi 110005',
    location: { latitude: 28.6517, longitude: 77.1906 },
    metroStation: 'Karol Bagh Metro (Blue Line) • Gate 2',
    closedOn: 'Closed on Mondays',
    timings: '11:00 AM - 08:30 PM',
    bargainingTip: 'Test all mobile accessories and screens in front of the technician before making payment. Cash is preferred by smaller stalls.',
    imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80',
    tags: ['electronics', 'mobile phones', 'gadgets', 'chargers', 'gaming', 'ghaffar market', 'karol bagh', 'delhi']
  },

  // Clothes & Fashion
  {
    id: 'delhi-sarojini-nagar',
    name: 'Sarojini Nagar Market',
    city: 'South Delhi',
    cityId: 'delhi',
    specialty: 'clothes',
    specialtyLabel: 'Export Surplus, Branded Fast Fashion & Thrift',
    famousFor: "Delhi's most legendary budget fashion paradise. Famous for export surplus Western clothes, Zara/H&M factory overruns, jackets, designer bags, sunglasses, and footwear at unbelievable prices.",
    whatToBuy: ['Trendy Dresses & Tops', 'Denim Jackets & Jeans', 'Tote Bags & Handbags', 'Footwear & Boots', 'Winter Coats & Sweaters'],
    address: 'Sarojini Nagar, South West Delhi, New Delhi 110023',
    location: { latitude: 28.5772, longitude: 77.1983 },
    metroStation: 'Sarojini Nagar Metro (Pink Line) • Gate 1',
    closedOn: 'Closed on Mondays',
    timings: '11:00 AM - 09:00 PM',
    bargainingTip: 'Start bargaining at 40-50% of the quoted price. Look closely for loose buttons or factory export defect tags. Carry cash and a sturdy tote bag.',
    imageUrl: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=800&q=80',
    tags: ['clothes', 'fashion', 'street shopping', 'dresses', 'jackets', 'sarojini nagar', 'delhi']
  },
  {
    id: 'delhi-lajpat-nagar',
    name: 'Lajpat Nagar Central Market',
    city: 'South Delhi',
    cityId: 'delhi',
    specialty: 'clothes',
    specialtyLabel: 'Indian Ethnic Wear, Bridal Fabrics & Salwars',
    famousFor: 'The premier destination for Indian ethnic wear, designer unstitched suit pieces, Banarasi & Chanderi fabrics, bridal lehengas, borders, laces, and authentic street chaat (Ram Ladoo).',
    whatToBuy: ['Salwar Kameez & Kurtis', 'Unstitched Cotton Fabrics', 'Bridal Dupattas & Lehengas', 'Kolhapuri Footwear', 'Bangles & Mehendi Art'],
    address: 'Central Market, Lajpat Nagar II, New Delhi 110024',
    location: { latitude: 28.5677, longitude: 77.2433 },
    metroStation: 'Lajpat Nagar Metro (Pink & Violet Interchange) • Gate 5',
    closedOn: 'Closed on Mondays',
    timings: '11:00 AM - 09:00 PM',
    bargainingTip: 'Lajpat Nagar suits have fixed price tags in showrooms, but the central lanes and fabric street vendors have substantial negotiation room.',
    imageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
    tags: ['clothes', 'ethnic wear', 'suits', 'fabrics', 'dupattas', 'lajpat nagar', 'delhi']
  },
  {
    id: 'delhi-janpath',
    name: 'Janpath & Tibetan Market',
    city: 'Central Delhi',
    cityId: 'delhi',
    specialty: 'clothes',
    specialtyLabel: 'Bohemian Streetwear, Tibetan Handicrafts & Brass',
    famousFor: 'Iconic shopping avenue steps from Connaught Place. Renowned for bohemian maxi dresses, Kashmiri embroidered shawls, brass Buddha idols, tribal jewelry, and vintage sunglasses.',
    whatToBuy: ['Boho Tops & Kaftans', 'Silver & Brass Jewelry', 'Pashmina & Tibetan Shawls', 'Vintage Clocks & Compass', 'Embroidered Pouches'],
    address: 'Janpath Road, Connaught Place, New Delhi 110001',
    location: { latitude: 28.6276, longitude: 77.2188 },
    metroStation: 'Janpath Metro (Violet Line) or Rajiv Chowk (Yellow/Blue Line)',
    closedOn: 'Open 7 Days (Tibetan stalls open Sunday afternoon)',
    timings: '10:30 AM - 08:30 PM',
    bargainingTip: 'Vendors in the main Janpath lane quote higher rates for foreign tourists; counter with a polite 50% opening bid.',
    imageUrl: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=800&q=80',
    tags: ['clothes', 'boho', 'jewelry', 'handicrafts', 'shawls', 'janpath', 'connaught place', 'delhi']
  },
  {
    id: 'delhi-chandni-chowk-textile',
    name: 'Chandni Chowk (Katra Neel & Kinari Bazaar)',
    city: 'Old Delhi',
    cityId: 'delhi',
    specialty: 'clothes',
    specialtyLabel: 'Wholesale Silk, Bridal Zardozi & Wedding Fabrics',
    famousFor: 'Historic 350-year-old textile lanes. Katra Neel is legendary for wholesale indigo-dyed cotton and pure silks, while Kinari Bazaar specializes in bridal laces, turbans, and wedding accessories.',
    whatToBuy: ['Pure Silk Sarees', 'Bridal Lehengas', 'Zardozi Borders & Laces', 'Groom Safas & Turbans', 'Unstitched Men Suitings'],
    address: 'Katra Neel, Chandni Chowk, Old Delhi 110006',
    location: { latitude: 28.6575, longitude: 77.2285 },
    metroStation: 'Chandni Chowk Metro (Yellow Line) • Gate 1',
    closedOn: 'Closed on Sundays',
    timings: '10:30 AM - 07:30 PM',
    bargainingTip: 'Buy unstitched yardage by the meter for incredible savings over finished retail boutique outfits.',
    imageUrl: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80',
    tags: ['clothes', 'sarees', 'bridal', 'textiles', 'kinari bazaar', 'katra neel', 'chandni chowk', 'delhi']
  },

  // Automobile & Spare Parts
  {
    id: 'delhi-mayapuri-auto',
    name: 'Mayapuri Industrial Area Automotive Market',
    city: 'West Delhi',
    cityId: 'delhi',
    specialty: 'automobile',
    specialtyLabel: 'Asia’s Largest Automobile Scrap & Spare Parts Market',
    famousFor: 'The ultimate powerhouse for automobile enthusiasts and mechanics. Hundreds of workshops with complete engines, gearboxes, alloy wheels, suspension kits, car modification panels, and second-hand spare parts for every vehicle brand.',
    whatToBuy: ['Car Engines & Gearboxes', 'Alloy Wheels & Tyres', 'Car Body Panels & Bumpers', 'Suspension & Shock Absorbers', 'Custom Modification Parts', 'Commercial Truck Spares'],
    address: 'Mayapuri Industrial Area Phase 1 & 2, New Delhi 110064',
    location: { latitude: 28.6292, longitude: 77.1128 },
    metroStation: 'Mayapuri Metro (Pink Line) • Gate 2',
    closedOn: 'Closed on Sundays',
    timings: '10:00 AM - 07:00 PM',
    bargainingTip: 'Bring your vehicle mechanic or exact part number/spec. Inspect mechanical parts for hairline fractures and test fitment before leaving.',
    imageUrl: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=800&q=80',
    tags: ['automobile', 'car parts', 'spare parts', 'engines', 'alloys', 'scrap market', 'mayapuri', 'delhi']
  },
  {
    id: 'delhi-kashmiri-gate-auto',
    name: 'Kashmiri Gate Motor Parts Market',
    city: 'North Delhi',
    cityId: 'delhi',
    specialty: 'automobile',
    specialtyLabel: 'Wholesale Automobile Components & Two-Wheeler Parts',
    famousFor: "One of India's oldest automobile markets. Specialized in brand new OEM replacement spare parts, bike chains, spark plugs, headlamps, horns, brake pads, and commercial fleet supplies.",
    whatToBuy: ['Two-Wheeler / Bike Accessories', 'OEM Headlights & Tail lamps', 'Brake Pads & Clutch Plates', 'Car Filters & Belts', 'Auto Horns & Fog Lights'],
    address: 'Near Old Delhi Railway Station, Mori Gate, Kashmiri Gate, Delhi 110006',
    location: { latitude: 28.6675, longitude: 77.2281 },
    metroStation: 'Kashmiri Gate Metro Interchange (Red, Yellow, Violet) • Gate 7',
    closedOn: 'Closed on Sundays',
    timings: '10:00 AM - 07:30 PM',
    bargainingTip: 'Wholesale prices are available even for single retail purchases if you ask for trade discount rates.',
    imageUrl: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80',
    tags: ['automobile', 'bike parts', 'two wheeler', 'car accessories', 'kashmiri gate', 'delhi']
  },

  // Spices & Food
  {
    id: 'delhi-khari-baoli',
    name: 'Khari Baoli Wholesale Spice Market',
    city: 'Old Delhi',
    cityId: 'delhi',
    specialty: 'spices_food',
    specialtyLabel: 'Asia’s Largest Wholesale Spice Market',
    famousFor: 'Operated since 1650 AD. The air here is fragrant with pure saffron, dried Kashmiri red chillies, cardamom, cinnamon, premium Afghani walnuts, figs, and Ayurvedic medicinal botanicals.',
    whatToBuy: ['Kashmiri Saffron (Kesar)', 'Cardamom & Whole Spices', 'Afghani Figs & Dried Fruits', 'Herbal Teas & Infusions', 'Pure Masala Blends'],
    address: 'Khari Baoli Road, Near Fatehpuri Masjid, Old Delhi 110006',
    location: { latitude: 28.6582, longitude: 77.2215 },
    metroStation: 'Chandni Chowk Metro (Yellow Line) • Gate 1',
    closedOn: 'Closed on Sundays',
    timings: '10:00 AM - 07:30 PM',
    bargainingTip: 'Buy whole unground spices instead of powdered ones for supreme freshness and longevity. Check for Kashmiri saffron threads that dissolve yellow, not red.',
    imageUrl: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=800&q=80',
    tags: ['spices', 'dry fruits', 'saffron', 'food', 'wholesale', 'khari baoli', 'delhi']
  },

  // Jewelry & Silver
  {
    id: 'delhi-dariba-kalan',
    name: 'Dariba Kalan Silver & Jewelry Street',
    city: 'Old Delhi',
    cityId: 'delhi',
    specialty: 'jewelry',
    specialtyLabel: 'Mughal-Era Pure Silverware, Jewelry & Attar',
    famousFor: 'Dating back to the 17th century Mughal Empire. Famous for pure 925 sterling silver jewelry, antique silver coins, silverware dining sets, nose pins, and artisanal natural attar (oil perfumes).',
    whatToBuy: ['Oxidized Silver Jewelry', '925 Sterling Silverware', 'Bridal Silver Ornaments', 'Natural Rose & Sandalwood Attar', 'Kundan & Polki Sets'],
    address: 'Dariba Kalan Lane, Opposite Kinari Bazaar, Chandni Chowk, Delhi 110006',
    location: { latitude: 28.6558, longitude: 77.2325 },
    metroStation: 'Chandni Chowk Metro (Yellow Line) • Gate 5',
    closedOn: 'Closed on Sundays',
    timings: '11:00 AM - 07:30 PM',
    bargainingTip: 'Silver is sold by current market weight plus making charges. Verify the 925 BIS Hallmark stamp.',
    imageUrl: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=80',
    tags: ['jewelry', 'silver', 'attar', 'perfume', 'dariba kalan', 'chandni chowk', 'delhi']
  },

  // ==================== MUMBAI LOCAL MARKETS ====================
  {
    id: 'mumbai-lamington-road',
    name: 'Lamington Road IT & Electronics Hub',
    city: 'South Mumbai',
    cityId: 'mumbai',
    specialty: 'electronics',
    specialtyLabel: 'Custom PC Hardware, Electronics & Sound Gear',
    famousFor: "Mumbai's legendary electronics street. Hundreds of storefronts stacked high with custom PC rigs, semiconductors, professional studio audio equipment, and CCTV hardware.",
    whatToBuy: ['Custom High-End PCs', 'Computer Monitors', 'Studio Microphones & Amps', 'Robotics Components', 'CCTV Security Systems'],
    address: 'Dr Dadasaheb Bhadkamkar Marg, Grant Road East, Mumbai 400007',
    location: { latitude: 18.9619, longitude: 72.8172 },
    metroStation: 'Grant Road Railway Station (Western Line) • 2 min walk',
    closedOn: 'Closed on Sundays',
    timings: '11:00 AM - 08:30 PM',
    bargainingTip: 'Compare quotes across street-facing shops and upper-floor distributor offices for the best component pricing.',
    imageUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80',
    tags: ['electronics', 'computers', 'hardware', 'audio', 'lamington road', 'mumbai']
  },
  {
    id: 'mumbai-colaba-causeway',
    name: 'Colaba Causeway Fashion Street',
    city: 'South Mumbai',
    cityId: 'mumbai',
    specialty: 'clothes',
    specialtyLabel: 'Street Fashion, Vintage Sunglasses & Quirky Souvenirs',
    famousFor: 'Vibrant seaside shopping stretch. Bustling stalls selling trendy boho dresses, graphic t-shirts, junk silver jewelry, antique pocket watches, and brass decor steps from Cafe Leopold.',
    whatToBuy: ['Boho Summer Dresses', 'Junk Jewelry & Bangles', 'Brass Compasses & Clocks', 'Embroidered Kolhapuris', 'Leather Journal Diaries'],
    address: 'Shahid Bhagat Singh Road, Colaba, Mumbai 400001',
    location: { latitude: 18.9220, longitude: 72.8315 },
    metroStation: 'Churchgate Station • 10 min taxi',
    closedOn: 'Open 7 Days',
    timings: '10:30 AM - 09:30 PM',
    bargainingTip: 'Start bargaining at 50% of the first quote with stall vendors.',
    imageUrl: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=800&q=80',
    tags: ['clothes', 'fashion', 'street market', 'colaba causeway', 'mumbai']
  },
  {
    id: 'mumbai-dharavi-leather',
    name: 'Dharavi Wholesale Leather Market',
    city: 'Central Mumbai',
    cityId: 'mumbai',
    specialty: 'clothes',
    specialtyLabel: 'Export Quality Genuine Leather Goods at Factory Prices',
    famousFor: 'World-renowned hub for handcrafted leather products. Leather jackets, laptop bags, travel duffels, and belts manufactured for European luxury labels sold at a fraction of mall prices.',
    whatToBuy: ['Genuine Leather Biker Jackets', 'Leather Laptop Bags', 'Travel Duffels', 'Belts & Wallets', 'Custom Leather Shoes'],
    address: '90 Feet Road, Dharavi, Mumbai 400017',
    location: { latitude: 19.0435, longitude: 72.8564 },
    metroStation: 'Sion Railway Station (Central Line) • 5 min walk',
    closedOn: 'Open 7 Days',
    timings: '11:00 AM - 09:00 PM',
    bargainingTip: 'Check the grade of leather (full-grain is best). Custom fitting and tailoring can be done in 24-48 hours.',
    imageUrl: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=80',
    tags: ['clothes', 'leather', 'jackets', 'bags', 'dharavi', 'mumbai']
  },
  {
    id: 'mumbai-chor-bazaar',
    name: 'Chor Bazaar (Thieves Market)',
    city: 'South Mumbai',
    cityId: 'mumbai',
    specialty: 'antiques_handicrafts',
    specialtyLabel: 'Vintage Antiques, Gramophones & Automobile Oddities',
    famousFor: 'One of the oldest markets in India (over 150 years old). Packed with vintage Bollywood movie posters, brass nautical gear, classic car parts, vinyl records, and antique furniture.',
    whatToBuy: ['Vintage Bollywood Posters', 'Brass Gramophones', 'Antique Typewriters & Telephones', 'Car Emblems & Classic Parts', 'Carved Wooden Mirrors'],
    address: 'Mutton Street, Kumbharwada, Mumbai 400003',
    location: { latitude: 18.9602, longitude: 72.8286 },
    metroStation: 'Grant Road or Charni Road Station • 10 min taxi',
    closedOn: 'Fridays (partially closed for prayers)',
    timings: '11:00 AM - 07:30 PM',
    bargainingTip: 'Inspect antique items carefully; distinguish between genuine vintage goods and distressed reproductions.',
    imageUrl: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80',
    tags: ['antiques', 'vintage', 'automobile parts', 'chor bazaar', 'mumbai']
  },

  // ==================== VIJAYAWADA & ANDHRA MARKETS ====================
  {
    id: 'vja-besant-road',
    name: 'Besant Road Commercial Market',
    city: 'Vijayawada',
    cityId: 'vijayawada',
    specialty: 'clothes',
    specialtyLabel: 'Textiles, Garments, Electronics & Street Bazaar',
    famousFor: 'The pulsating heart of Vijayawada shopping. Stretches with multi-story garment showrooms, handloom stalls, street accessories, mobile gadgets, and authentic Andhra street delicacies.',
    whatToBuy: ['Cotton Kurtis & Sarees', 'Mobile Accessories & Tech', 'Footwear & Bangles', 'Traditional Handloom Dresses', 'Andhra Snacks & Sweets'],
    address: 'Besant Road, Governorpet, Vijayawada 520002',
    location: { latitude: 16.5126, longitude: 80.6272 },
    metroStation: 'Vijayawada Central Bus Station (PNBS) • 5 min auto',
    closedOn: 'Open 7 Days',
    timings: '10:00 AM - 10:00 PM',
    bargainingTip: 'Street stalls along the footpath are open for active bargaining; showrooms have seasonal festival discounts.',
    imageUrl: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=800&q=80',
    tags: ['clothes', 'electronics', 'textiles', 'besant road', 'vijayawada']
  },
  {
    id: 'vja-mangalagiri-handloom',
    name: 'Mangalagiri Handloom Weavers Market',
    city: 'Mangalagiri',
    cityId: 'vijayawada',
    specialty: 'clothes',
    specialtyLabel: 'World-Famous Mangalagiri Cotton Sarees & Nizam Borders',
    famousFor: 'Centuries-old heritage weaving cluster. Direct weaver societies selling authentic GI-tagged Mangalagiri cotton sarees with pure gold zari Nizam borders and soft cotton dress materials.',
    whatToBuy: ['Pure Mangalagiri Cotton Sarees', 'Zari Nizam Border Fabrics', 'Handloom Kurta Materials', 'Cotton Dupattas', 'Handwoven Stoles'],
    address: 'Temple Road & Weavers Colony, Mangalagiri, Guntur District 522503',
    location: { latitude: 16.4385, longitude: 80.5684 },
    metroStation: 'Near Panakala Narasimha Temple • 15 min drive from KLEF',
    closedOn: 'Open 7 Days',
    timings: '09:30 AM - 08:30 PM',
    bargainingTip: 'Buy directly from weaver cooperative society stores for authentic GI certification tags and weaver-direct rates.',
    imageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
    tags: ['clothes', 'sarees', 'cotton', 'handloom', 'mangalagiri', 'vijayawada']
  },
  {
    id: 'vja-governorpet-auto',
    name: 'Governorpet & Eluru Road Automobile Spares Hub',
    city: 'Vijayawada',
    cityId: 'vijayawada',
    specialty: 'automobile',
    specialtyLabel: 'Auto Spare Parts, Machine Tools & Electrical Spares',
    famousFor: "The primary automotive spare parts and hardware nerve center of Coastal Andhra. Supplies two-wheeler spares, commercial transport hardware, car oils, and agricultural pump machinery.",
    whatToBuy: ['Automobile Spare Parts', 'Two-Wheeler Replacement Kits', 'Engine Oils & Lubricants', 'Machine Tools & Batteries', 'Hardware Components'],
    address: 'Eluru Road & Governorpet Junction, Vijayawada 520002',
    location: { latitude: 16.5165, longitude: 80.6331 },
    metroStation: 'Vijayawada Railway Junction • 5 min',
    closedOn: 'Closed on Sundays',
    timings: '09:30 AM - 08:00 PM',
    bargainingTip: 'Verify genuine OEM packaging holograms on auto replacement parts.',
    imageUrl: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=800&q=80',
    tags: ['automobile', 'spare parts', 'tools', 'governorpet', 'eluru road', 'vijayawada']
  },
  {
    id: 'vja-kaleswara-rao',
    name: 'Kaleswara Rao (KR) Market',
    city: 'Old Vijayawada (One Town)',
    cityId: 'vijayawada',
    specialty: 'spices_food',
    specialtyLabel: 'Historic Wholesale Spices, Fresh Produce & Guntur Chillies',
    famousFor: "Massive historic wholesale market. Renowned for fiery Guntur red chillies, raw turmeric, whole tamarind, local cooking spices, brass utensils, and festive pooja articles.",
    whatToBuy: ['World-Famous Guntur Chillies', 'Pure Andhra Turmeric', 'Whole Spices & Tamarind', 'Brass Pooja Vessels', 'Pickles (Avakaya)'],
    address: 'Prakasam Barrage Road, Tarapet, 1 Town, Vijayawada 520001',
    location: { latitude: 16.5110, longitude: 80.6120 },
    metroStation: 'Near Prakasam Barrage • 5 min from Head Post Office',
    closedOn: 'Open 7 Days (Best early morning)',
    timings: '06:00 AM - 08:00 PM',
    bargainingTip: 'Visit between 7 AM and 10 AM for the freshest wholesale spice batches right off transport.',
    imageUrl: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=800&q=80',
    tags: ['spices', 'guntur chillies', 'food', 'wholesale', 'kr market', 'vijayawada']
  },

  // ==================== KYOTO LOCAL MARKETS ====================
  {
    id: 'kyoto-nishiki',
    name: 'Nishiki Market (Kyoto’s Kitchen)',
    city: 'Kyoto',
    cityId: 'kyoto',
    specialty: 'spices_food',
    specialtyLabel: '400-Year-Old Traditional Food, Skewers & Culinary Ware',
    famousFor: "Narrow five-block shopping street with more than a hundred food stalls and culinary shops. Famous for handcrafted Aritsugu chef knives, matcha sweets, tsukemono pickles, and fresh seafood skewers.",
    whatToBuy: ['Hand-Forged Japanese Chef Knives', 'Ceremonial Uji Matcha', 'Kyoto Tsukemono Pickles', 'Tako Tamago Skewers', 'Chopsticks & Ceramic Bowls'],
    address: 'Nishikikoji-dori, Nakagyo Ward, Kyoto 604-8054',
    location: { latitude: 35.0050, longitude: 135.7645 },
    metroStation: 'Karasuma Station (Hankyu Line) or Shijo Station (Subway)',
    closedOn: 'Open 7 Days (Varies by stall, some close Wednesdays)',
    timings: '10:00 AM - 06:00 PM',
    bargainingTip: 'Prices in Japan are fixed and non-negotiable. Eat food in designated shop standing areas rather than walking while eating.',
    imageUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80',
    tags: ['food', 'spices', 'culinary', 'knives', 'nishiki market', 'kyoto']
  },
  {
    id: 'kyoto-teramachi',
    name: 'Teramachi & Shinkyogoku Covered Arcades',
    city: 'Kyoto',
    cityId: 'kyoto',
    specialty: 'clothes',
    specialtyLabel: 'Apparel, Vintage Kimonos, Crafts & Tech Accessories',
    famousFor: 'Historic covered arcade lined with fashion boutiques, second-hand vintage kimonos, stationery, tea shops, and anime merchandise.',
    whatToBuy: ['Vintage Haori & Kimonos', 'Japanese Washi Stationery', 'Modern Street Apparel', 'Woodblock Art Prints', 'Incense & Fans'],
    address: 'Teramachi-dori, Nakagyo Ward, Kyoto 604-8042',
    location: { latitude: 35.0065, longitude: 135.7675 },
    metroStation: 'Kyoto-Kawaramachi Station • 2 min walk',
    closedOn: 'Open 7 Days',
    timings: '11:00 AM - 08:30 PM',
    bargainingTip: 'Look for tax-free counters (bring your passport for an instant 10% duty deduction on purchases over ¥5,000).',
    imageUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80',
    tags: ['clothes', 'kimonos', 'stationery', 'crafts', 'teramachi', 'kyoto']
  }
];

class MarketService {
  /**
   * Retrieves local markets dynamically for the user's active location.
   * Calculates live distance in meters and sorts by proximity.
   */
  public async getLocalMarkets(
    location: LiveLocationState,
    searchQuery?: string,
    specialtyFilter?: LocalMarketSpecialty | 'all'
  ): Promise<LocalMarket[]> {
    const userLat = location.coords.latitude;
    const userLon = location.coords.longitude;
    const activeCityId = (location.matchedCityId || location.cityName.split(',')[0].toLowerCase().trim()).replace(/[^a-z]/g, '');

    // 1. Filter curated markets
    let results: LocalMarket[] = [];

    // Check if city matches curated markets (e.g. 'delhi', 'mumbai', 'vijayawada', 'kyoto')
    const matchesCity = CURATED_MARKETS.filter(m => {
      if (m.cityId === activeCityId) return true;
      if (location.cityName.toLowerCase().includes(m.cityId || '')) return true;
      if (location.cityName.toLowerCase().includes(m.city.toLowerCase())) return true;
      // Distance check within 120km
      const dist = getDistance({ latitude: userLat, longitude: userLon }, { latitude: m.location.latitude, longitude: m.location.longitude });
      return dist <= 120000;
    });

    if (matchesCity.length > 0) {
      results = matchesCity;
    } else {
      // If user is somewhere without direct curated markets, show all Indian or global curated markets
      // as featured destinations with live calculated distances
      results = [...CURATED_MARKETS];
    }

    // 2. Compute exact live geodesic distance
    results = results.map(market => {
      const dist = getDistance(
        { latitude: userLat, longitude: userLon },
        { latitude: market.location.latitude, longitude: market.location.longitude }
      );
      return {
        ...market,
        distanceMeters: dist
      };
    });

    // 3. Filter by specialty
    if (specialtyFilter && specialtyFilter !== 'all') {
      results = results.filter(m => m.specialty === specialtyFilter);
    }

    // 4. Filter by search query
    if (searchQuery && searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase().trim();
      results = results.filter(m => 
        m.name.toLowerCase().includes(q) ||
        m.famousFor.toLowerCase().includes(q) ||
        m.specialtyLabel.toLowerCase().includes(q) ||
        m.address.toLowerCase().includes(q) ||
        m.whatToBuy.some(item => item.toLowerCase().includes(q)) ||
        m.tags.some(tag => tag.toLowerCase().includes(q))
      );
    }

    // 5. Sort by distance ascending
    results.sort((a, b) => (a.distanceMeters || 0) - (b.distanceMeters || 0));

    return results;
  }

  /**
   * Adapts a LocalMarket into a standard Place object so it can seamlessly
   * trigger directions, routing preview, live navigation, and saved places.
   */
  public marketToPlace(market: LocalMarket): Place {
    return {
      id: `market-${market.id}`,
      name: market.name,
      category: market.specialty === 'clothes' || market.specialty === 'wholesale' ? 'supermarket' :
                market.specialty === 'automobile' ? 'fuel' :
                market.specialty === 'electronics' ? 'supermarket' :
                market.specialty === 'spices_food' ? 'cafe' : 'attraction',
      distanceMeters: market.distanceMeters || 0,
      location: market.location,
      countryCode: 'IN',
      city: market.city,
      address: market.address,
      hours: {
        status: 'open',
        raw: market.timings,
        formatted: `${market.timings} • ${market.closedOn || 'Open Daily'}`
      },
      source: 'CURATED_REGISTRY',
      sourceUpdatedAt: new Date().toISOString(),
      freshness: 'fresh',
      emergencyCapable: false,
      tags: [...market.tags, market.specialtyLabel, ...market.whatToBuy],
      triageInfo: `Famous For: ${market.famousFor.substring(0, 100)}...`,
      imageUrl: market.imageUrl
    };
  }
}

export const marketService = new MarketService();
