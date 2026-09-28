import { LocalMarket, LocalMarketSpecialty, Place } from '../types';
import { getDistance } from 'geolib';
import { LiveLocationState } from '../hooks/useLiveLocation';
import { getDynamicPlaceImage } from '../utils/placeVisuals';
import Fuse from 'fuse.js';
import { api } from './api';

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
    bargainingTip: 'Buy whole unground spices instead of powdered ones for supreme freshness and longevity.',
    imageUrl: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=800&q=80',
    tags: ['spices', 'dry fruits', 'saffron', 'food', 'wholesale', 'khari baoli', 'delhi']
  },
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
  {
    id: 'mumbai-opera-house-auto',
    name: 'Opera House & Charni Road Auto Spares Market',
    city: 'South Mumbai',
    cityId: 'mumbai',
    specialty: 'automobile',
    specialtyLabel: 'Automobile Accessories, Car Sound & Performance Parts',
    famousFor: "Mumbai's prime automobile street. Renowned for custom car interior leather seating, touchscreens, performance alloys, imported exhausts, and genuine Japanese/European car spares.",
    whatToBuy: ['Custom Seat Covers', 'Touchscreen Infotainment Rigs', 'Alloy Wheels & Spoilers', 'Car Sound Amplifiers', 'OEM Engine Filters & Oils'],
    address: 'Near Roxy Cinema, Mama Parmanand Marg, Opera House, Mumbai 400004',
    location: { latitude: 18.9565, longitude: 72.8180 },
    metroStation: 'Charni Road Station (Western Line) • 3 min walk',
    closedOn: 'Closed on Sundays',
    timings: '10:30 AM - 08:00 PM',
    bargainingTip: 'Ask for bundle installation discounts when purchasing audio systems with subwoofers and dampening sheets.',
    imageUrl: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=800&q=80',
    tags: ['automobile', 'car accessories', 'spare parts', 'opera house', 'mumbai']
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

  // ==================== BANGALORE LOCAL MARKETS ====================
  {
    id: 'blr-sp-road',
    name: 'SP Road (Sadarth Patrappa Road) Electronics Market',
    city: 'Bengaluru',
    cityId: 'bangalore',
    specialty: 'electronics',
    specialtyLabel: 'IT Hardware, Custom Gaming Rigs & Electronic Components',
    famousFor: "South India's silicon street. The ultimate destination for custom PC builds, Arduino/Raspberry Pi microcontrollers, sensors, industrial electronics, and motherboard soldering repairs.",
    whatToBuy: ['Custom Gaming Desktops', 'Motherboards & CPUs', 'Robotics & Arduino Kits', 'Camera Cables & Adaptors', 'LED Strips & Soldering Gear'],
    address: 'SP Road, Dodpete, Nagarathpete, Bengaluru 560002',
    location: { latitude: 12.9644, longitude: 77.5855 },
    metroStation: 'Krishna Rajendra Market (Green Line) • 5 min walk',
    closedOn: 'Closed on Sundays',
    timings: '11:00 AM - 08:30 PM',
    bargainingTip: 'Ask for composite package pricing when buying CPU, motherboard, and graphics card together from distributors.',
    imageUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80',
    tags: ['electronics', 'computers', 'pc build', 'hardware', 'sp road', 'bangalore']
  },
  {
    id: 'blr-commercial-street',
    name: 'Commercial Street & Brigade Road',
    city: 'Bengaluru',
    cityId: 'bangalore',
    specialty: 'clothes',
    specialtyLabel: 'Apparel, Footwear, Tailoring & Street Fashion',
    famousFor: "Bangalore's most vibrant shopping hub. Lined with fashion stores, boutique tailors, silver jewelry alleys, Pashmina shawls, and international fashion outlets.",
    whatToBuy: ['Designer Dress Materials', 'Custom-Tailored Blouses & Suits', 'Kolhapuri Sandals', 'Silver Earrings & Bangles', 'Denim Jeans'],
    address: 'Commercial Street, Tasker Town, Shivaji Nagar, Bengaluru 560001',
    location: { latitude: 12.9822, longitude: 77.6083 },
    metroStation: 'Mahatma Gandhi Road (Purple Line) • 8 min walk',
    closedOn: 'Open 7 Days',
    timings: '10:30 AM - 09:30 PM',
    bargainingTip: 'The smaller cross-lanes (Ebrahim Sahib Street) have much better deals on fabrics than the main road showrooms.',
    imageUrl: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=800&q=80',
    tags: ['clothes', 'fashion', 'commercial street', 'bangalore']
  },
  {
    id: 'blr-jc-road-auto',
    name: 'JC Road Automobile & Bike Spare Parts Market',
    city: 'Bengaluru',
    cityId: 'bangalore',
    specialty: 'automobile',
    specialtyLabel: 'Automobile Components, Motorcycle Accessories & Tyres',
    famousFor: "Bangalore's primary automotive district. Houses hundreds of auto spare shops offering genuine Royal Enfield accessories, car audio systems, performance exhausts, and OEM vehicle spares.",
    whatToBuy: ['Royal Enfield & Bike Parts', 'Car Alloy Wheels & Tyres', 'Audio & Subwoofer Systems', 'Car Body Kits & Headlamps', 'Vehicle Batteries'],
    address: 'Jayachamaraja Road (JC Road), Kalasipalya, Bengaluru 560002',
    location: { latitude: 12.9610, longitude: 77.5840 },
    metroStation: 'KR Market Metro • 5 min walk',
    closedOn: 'Closed on Sundays',
    timings: '10:00 AM - 08:00 PM',
    bargainingTip: 'Installation labor can be negotiated right on the street behind the main stores.',
    imageUrl: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=800&q=80',
    tags: ['automobile', 'bike parts', 'car accessories', 'jc road', 'bangalore']
  },

  // ==================== HYDERABAD LOCAL MARKETS ====================
  {
    id: 'hyd-laad-bazaar',
    name: 'Laad Bazaar & Charminar Market',
    city: 'Old City, Hyderabad',
    cityId: 'hyderabad',
    specialty: 'jewelry',
    specialtyLabel: 'Hyderabadi Pearls, Lacquer Bangles & Zari Bridal Sarees',
    famousFor: 'Historic 400-year-old market adjoining Charminar operating since the Qutb Shahi era. Famous for handcrafted stone-studded lacquer bangles, authentic Basra pearls, bridal khada dupattas, and natural ittar.',
    whatToBuy: ['Hyderabadi Pearl Necklaces', 'Stone Lacquer Bangles', 'Bridal Khada Dupattas', 'Zari Embroidered Kurtas', 'Natural Mughlai Attar'],
    address: 'Laad Bazaar Road, Near Charminar, Hyderabad 500002',
    location: { latitude: 17.3616, longitude: 78.4735 },
    metroStation: 'Charminar Metro (Green Line) or MGBS Metro • 10 min',
    closedOn: 'Open 7 Days (Best after 4 PM)',
    timings: '11:00 AM - 10:30 PM',
    bargainingTip: 'Ask for authentic certificate of guarantee for pearls. Bangle shops quote 40-50% higher initially.',
    bargainingLevel: 'High (Quote 40-50% less)',
    priceRange: '₹ (Artisan Direct / Budget to Luxury)',
    bestTimeToVisit: 'Evening 5:00 PM – 9:30 PM under golden festive street lights',
    paymentMethods: ['UPI (GPay / PhonePe)', 'Cash Highly Preferred for Small Stalls', 'Credit Cards in Jewellers'],
    parkingTip: 'Pedestrian-only alleys; park at Charminar Bus Depot or take an auto/Metro',
    famousLandmarkOrFood: 'Nimrah Cafe & Bakery right at Charminar gate (Irani Chai & Osmania biscuits) and Hotel Shadab',
    imageUrl: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=80',
    tags: ['jewelry', 'pearls', 'bangles', 'bridal', 'charminar', 'laad bazaar', 'hyderabad']
  },
  {
    id: 'hyd-begum-bazaar',
    name: 'Begum Bazaar & Feelkhana Wholesale Hub',
    city: 'Old Hyderabad',
    cityId: 'hyderabad',
    specialty: 'spices_food',
    specialtyLabel: 'Asia\'s Giant Wholesale Spices, Dry Fruits & Household Goods',
    famousFor: 'The largest commercial wholesale market in Hyderabad, established during the Nizam era. Famous for towering sacks of spices (cardamom, cloves, saffron), wholesale dry fruits, brass and copper kitchen vessels, pooja articles, and wedding gifts at 40-60% below retail.',
    whatToBuy: ['Wholesale Dry Fruits (Almonds, Cashews, Pistachios)', 'Pure Spices & Biryani Potli Masala', 'Brass & Copper Kitchen Vessels', 'Wedding Gift Hampers & Packaging', 'Festive Pooja Articles & Rangoli'],
    address: 'Begum Bazaar Main Road, Afzal Gunj, Hyderabad 500012',
    location: { latitude: 17.3735, longitude: 78.4715 },
    metroStation: 'Osmania Medical College Metro (Red Line) • 8 min walk',
    closedOn: 'Closed on Sundays',
    timings: '10:00 AM - 08:30 PM',
    bargainingTip: 'Prices are already near wholesale; ask for bulk bundle pricing when buying 1kg+ of dry fruits or spices.',
    bargainingLevel: 'Medium (15-25% discount)',
    priceRange: '₹ (Direct Wholesale / 40-60% Off Retail)',
    bestTimeToVisit: '11:30 AM – 3:30 PM for quieter browsing before evening wholesale truck loading',
    paymentMethods: ['UPI / PhonePe', 'Cash Preferred', 'Bank Transfer for Wholesale'],
    parkingTip: 'Very congested alleys — park near Afzal Gunj bridge and walk',
    famousLandmarkOrFood: 'Try Badam Milk & Lassi at century-old Matwale Doodh Ghar',
    imageUrl: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=800&q=80',
    tags: ['spices', 'dry fruits', 'wholesale', 'biryani masala', 'begum bazaar', 'hyderabad']
  },
  {
    id: 'hyd-koti-electronics',
    name: 'Koti (Gujarati Galli) Electronics & Tech Market',
    city: 'Hyderabad',
    cityId: 'hyderabad',
    specialty: 'electronics',
    specialtyLabel: 'Consumer Electronics, Smart TV Parts & Mobile Hardware',
    famousFor: 'Hyderabad\'s premier electronics and tech nerve center. Packed with multi-storey plazas for smart TV panels, amplifier circuit boards, camera parts, smartphone screens, wholesale tempered glass, CCTV security gear, and chip-level repair shops.',
    whatToBuy: ['Smart TV LED Boards & Panels', 'Mobile Phone Parts & Screen Replacements', 'Pro Audio Amplifiers & DJ Sound', 'CCTV Cameras & DVRs', 'Soldering Stations & Multimeters'],
    address: 'Gujarati Galli, Bank Street, Koti, Hyderabad 500095',
    location: { latitude: 17.3850, longitude: 78.4867 },
    metroStation: 'Sultan Bazaar Metro (Red Line) • 5 min walk',
    closedOn: 'Closed on Sundays',
    timings: '10:30 AM - 08:30 PM',
    bargainingTip: 'Always test electronic circuits or mobile screens at the shop counter testing bench before final payment. Cash gets an extra 5-10% discount over credit card.',
    bargainingLevel: 'Medium (15-25% discount)',
    priceRange: '₹ (Wholesale Component Rates)',
    bestTimeToVisit: '2:00 PM – 6:00 PM for all wholesalers open and technician availability',
    paymentMethods: ['UPI', 'Cash', 'Credit/Debit Card'],
    parkingTip: 'Park at Koti Women\'s College paid lot or arrive via Sultan Bazaar Metro',
    famousLandmarkOrFood: 'Legendary Gokul Chat (famous for Hot Samosa Ragda, Mirchi Bhaji & Kulfi) 3 mins away',
    imageUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80',
    tags: ['electronics', 'mobile parts', 'smart tv', 'sound gear', 'pc build', 'koti', 'hyderabad']
  },
  {
    id: 'hyd-ranigunj-auto',
    name: 'Ranigunj (Secunderabad) Automobile & Bike Spares Market',
    city: 'Secunderabad / Hyderabad',
    cityId: 'hyderabad',
    specialty: 'automobile',
    specialtyLabel: 'Auto Spare Parts, Bike Modifications & Machine Hardware',
    famousFor: 'The undisputed automotive hub of Hyderabad and Secunderabad. Spans miles of shops for car alloy wheels, performance bike exhausts, Royal Enfield custom spares, car music touchscreens, batteries, and mechanical bearings.',
    whatToBuy: ['Car Alloy Wheels & High-Performance Tyres', 'Royal Enfield Modification Kits', 'Car Touchscreen Infotainment & Subwoofers', 'Two-Wheeler Carburetors & Chains', 'Automotive Batteries & Inverters'],
    address: 'Ranigunj Main Road, Mahatma Gandhi Road, Secunderabad 500003',
    location: { latitude: 17.4335, longitude: 78.4910 },
    metroStation: 'Paradise Metro (Blue Line) or Secunderabad West Metro • 7 min',
    closedOn: 'Closed on Sundays',
    timings: '10:00 AM - 08:00 PM',
    bargainingTip: 'Compare prices across at least 3 shops. Negotiation for installation and mechanic fitment labor can be done right in the street behind the main stores.',
    bargainingLevel: 'Medium (15-25% discount)',
    priceRange: '₹₹ (Direct Factory Distributor Rates)',
    bestTimeToVisit: 'Morning 11:00 AM – 3:00 PM for mechanic fitment bays',
    paymentMethods: ['UPI', 'Cash', 'Cards'],
    parkingTip: 'Street parking can be tight; side street mechanic bays allow car parking during installation',
    famousLandmarkOrFood: 'Paradise Biryani flagship heritage restaurant is within 5 minutes walking distance',
    imageUrl: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=800&q=80',
    tags: ['automobile', 'car spares', 'bike parts', 'tyres', 'alloys', 'ranigunj', 'secunderabad', 'hyderabad']
  },
  {
    id: 'hyd-general-bazaar',
    name: 'General Bazaar & Tobacco Bazaar (Secunderabad)',
    city: 'Secunderabad / Hyderabad',
    cityId: 'hyderabad',
    specialty: 'clothes',
    specialtyLabel: 'Wholesale Textiles, Bridal Lehengas & Silk Sarees',
    famousFor: 'A massive bustling covered market labyrinth in Secunderabad dating back over a century. Known for endless rows of bridal lehengas, Kanjeevaram & Pochampally silk sarees, dress materials, footwear, and nightwear at factory prices.',
    whatToBuy: ['Bridal Lehengas & Gowns', 'Pochampally Ikkat Silk Sarees', 'Unstitched Cotton & Silk Suits', 'Ethnic Mojaris & Bangles', 'Designer Dupattas & Borders'],
    address: 'General Bazaar, M.G. Road, Secunderabad 500003',
    location: { latitude: 17.4395, longitude: 78.4985 },
    metroStation: 'Paradise Metro • 5 min walk',
    closedOn: 'Closed on Sundays',
    timings: '10:30 AM - 09:00 PM',
    bargainingTip: 'Inner narrow lanes have much better prices than outer MG Road facades. Ask for wholesale cut piece rates for salwar suit fabrics.',
    bargainingLevel: 'High (Quote 40-50% less)',
    priceRange: '₹ (Factory Surplus to Designer)',
    bestTimeToVisit: '3:00 PM – 7:00 PM',
    paymentMethods: ['UPI', 'Cash', 'Cards'],
    parkingTip: 'Two-wheeler or Metro recommended; lanes are extremely narrow for cars',
    famousLandmarkOrFood: 'Secunderabad Clock Tower & historic Irani cafes',
    imageUrl: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=800&q=80',
    tags: ['clothes', 'sarees', 'lehenga', 'fabrics', 'general bazaar', 'secunderabad', 'hyderabad']
  },
  {
    id: 'hyd-sultan-bazaar',
    name: 'Sultan Bazaar & Badichowdi',
    city: 'Hyderabad',
    cityId: 'hyderabad',
    specialty: 'clothes',
    specialtyLabel: 'Ethnic Street Fashion, Kurtis, Footwear & Bangles',
    famousFor: 'One of Hyderabad\'s oldest and liveliest shopping arcades, established in the 1800s. Packed with affordable college fashion, cotton Kurtis, traditional silver earrings, Kolhapuri footwear, and festive jewelry.',
    whatToBuy: ['Everyday & Festive Kurtis', 'Kolhapuri Sandals & Juttis', 'Silver & Oxidized Jewelry', 'Handbags & Clutches', 'Cotton Nightwear & Leggings'],
    address: 'Sultan Bazaar Road, Koti, Hyderabad 500095',
    location: { latitude: 17.3875, longitude: 78.4870 },
    metroStation: 'Sultan Bazaar Metro (Red Line) • Direct station exit',
    closedOn: 'Open 7 Days',
    timings: '11:00 AM - 09:30 PM',
    bargainingTip: 'Street hawkers and roadside apparel vendors expect bargaining. Start at 50% of the quoted price.',
    bargainingLevel: 'High (Quote 40-50% less)',
    priceRange: '₹ (Extremely Budget-Friendly)',
    bestTimeToVisit: 'Evening 4:30 PM – 8:30 PM when street stalls light up',
    paymentMethods: ['UPI', 'Cash'],
    parkingTip: 'Direct Metro connectivity; exit directly into the bazaar entrance',
    famousLandmarkOrFood: 'Gokul Chat & Pragati Tiffin Center nearby for butter dosas',
    imageUrl: 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=800&q=80',
    tags: ['clothes', 'kurtis', 'footwear', 'fashion', 'street market', 'sultan bazaar', 'hyderabad']
  },
  {
    id: 'hyd-mj-market',
    name: 'Moazzam Jahi (MJ) Market & Jam Bagh',
    city: 'Central Hyderabad',
    cityId: 'hyderabad',
    specialty: 'spices_food',
    specialtyLabel: 'Historic Granite Stone Market, Dry Fruits, Natural Ittar & Ice Cream',
    famousFor: 'Iconic 1935 Nizam-era stone landmark with a central clock tower. Famous for wholesale dry fruits, organic honey, exotic seasonal fruits, natural flower bazaar, and the century-old handmade natural ice creams (sapota, mango, custard apple).',
    whatToBuy: ['Hand-Churned Famous Ice Cream (Custard Apple / Sitaphal, Mango, Fig)', 'Fresh Dry Fruits & Spices', 'Pure Forest Honey', 'Traditional Nizam Ittar', 'Exotic Seasonal Fruits'],
    address: 'Mozamjahi Market Road, Abids, Hyderabad 500001',
    location: { latitude: 17.3802, longitude: 78.4770 },
    metroStation: 'Gandhi Bhavan Metro (Red Line) • 3 min walk',
    closedOn: 'Open 7 Days',
    timings: '09:00 AM - 11:30 PM',
    bargainingTip: 'Ice cream is fixed price (around ₹40-60 per bowl). For dry fruits, buy 500g or 1kg tins for maximum wholesale discount.',
    bargainingLevel: 'Fixed / Wholesale trade rate',
    priceRange: '₹ (Fair Wholesale & Affordable Heritage Food)',
    bestTimeToVisit: 'Late evening 7:00 PM – 11:00 PM for the heritage lighting and fresh ice cream crowd',
    paymentMethods: ['UPI', 'Cash', 'Cards'],
    parkingTip: 'Ample parking inside the newly restored heritage complex courtyard',
    famousLandmarkOrFood: 'Famous Ice Cream stall inside the heritage quadrangle',
    imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
    tags: ['spices', 'dry fruits', 'ice cream', 'heritage', 'fruits', 'mj market', 'hyderabad']
  },
  {
    id: 'hyd-madina-market',
    name: 'Madina Market & Pathergatti Arcades',
    city: 'Old City, Hyderabad',
    cityId: 'hyderabad',
    specialty: 'wholesale',
    specialtyLabel: 'Historic Nizam Arcades, Wholesale Fabrics & Sherwanis',
    famousFor: 'Heritage stone arcades built by the 7th Nizam in the 1930s. The major wholesale hub for wedding textiles, unstitched suit materials, sherwanis, and burqas supplying retailers across South India.',
    whatToBuy: ['Wholesale Fabric Rolls', 'Men\'s Wedding Sherwanis & Kurtas', 'Embroidered Velvet Materials', 'Traditional Burqas & Hijabs', 'Attar & Incense'],
    address: 'Pathergatti Road, Near Madina Building, Hyderabad 500002',
    location: { latitude: 17.3680, longitude: 78.4750 },
    metroStation: 'MGBS Metro • 10 min walk',
    closedOn: 'Open 7 Days',
    timings: '10:30 AM - 09:30 PM',
    bargainingTip: 'Wholesale shops require minimum meterage (5-10m) for bottom rates; ask for than (full roll) price.',
    bargainingLevel: 'High (Quote 40-50% less)',
    priceRange: '₹ (Direct Factory Wholesale)',
    bestTimeToVisit: '12:00 PM – 4:00 PM',
    paymentMethods: ['UPI', 'Cash', 'NEFT / RTGS'],
    parkingTip: 'Take auto or Metro to MGBS to avoid traffic gridlock near the old bridge',
    famousLandmarkOrFood: 'Hotel Shadab right at the corner — world famous for Hyderabadi Mutton Dum Biryani & Paya Nahari',
    imageUrl: 'https://images.unsplash.com/photo-1579202673506-ca3ce28943ef?auto=format&fit=crop&w=800&q=80',
    tags: ['wholesale', 'fabrics', 'textiles', 'sherwani', 'madina market', 'hyderabad']
  },

  // ==================== JAIPUR LOCAL MARKETS ====================
  {
    id: 'jpr-johari-bazaar',
    name: 'Johari Bazaar Gemstone & Jewelry Market',
    city: 'Pink City, Jaipur',
    cityId: 'jaipur',
    specialty: 'jewelry',
    specialtyLabel: 'Precious Gemstones, Kundan Meenakari & Gold',
    famousFor: "World-renowned epicenter for emeralds, rubies, Kundan-Meenakari bridal sets, and traditional Rajasthani gold filigree jewelry.",
    whatToBuy: ['Kundan & Polki Jewelry', 'Cut Emeralds & Gemstones', 'Meenakari Enamel Bangles', 'Traditional Rajputi Poshaks', 'Jaipuri Quilts (Razai)'],
    address: 'Johari Bazaar, Pink City, Jaipur 302003',
    location: { latitude: 26.9200, longitude: 75.8270 },
    metroStation: 'Badi Chaupar Metro • 2 min walk',
    closedOn: 'Open 7 Days',
    timings: '10:00 AM - 08:30 PM',
    bargainingTip: 'Verify certification from recognized gemological laboratories before buying loose cut stones.',
    imageUrl: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=80',
    tags: ['jewelry', 'gemstones', 'kundan', 'johari bazaar', 'jaipur']
  },
  {
    id: 'jpr-bapu-bazaar',
    name: 'Bapu Bazaar & Nehru Bazaar',
    city: 'Jaipur',
    cityId: 'jaipur',
    specialty: 'clothes',
    specialtyLabel: 'Jaipuri Textiles, Mojari Leather Footwear & Handicrafts',
    famousFor: 'Famous pink-walled arcade known for authentic camel leather Mojari shoes, Bandhani/Leheriya sarees, block-print cotton bedsheets, and blue pottery.',
    whatToBuy: ['Camel Leather Mojari Shoes', 'Bandhani & Leheriya Sarees', 'Sanganeri Block Print Linens', 'Handmade Blue Pottery', 'Puppets & Brass Trinkets'],
    address: 'Bapu Bazaar Road, Pink City, Jaipur 302003',
    location: { latitude: 26.9180, longitude: 75.8220 },
    metroStation: 'Chhoti Chaupar Metro • 5 min walk',
    closedOn: 'Open 7 Days',
    timings: '10:30 AM - 09:00 PM',
    bargainingTip: 'Start negotiation at 50% for handicrafts and Mojari footwear.',
    imageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
    tags: ['clothes', 'mojari', 'textiles', 'handicrafts', 'bapu bazaar', 'jaipur']
  },

  // ==================== GOA LOCAL MARKETS ====================
  {
    id: 'goa-mapusa-market',
    name: 'Mapusa Friday Municipal Market',
    city: 'Mapusa, Goa',
    cityId: 'goa',
    specialty: 'spices_food',
    specialtyLabel: 'Goan Spices, Homemade Sausages, Cashews & Feni',
    famousFor: "Goa's most authentic local trade market. Famous for fiery Goan choriz (pork sausages), artisanal vinegar, dried kokum, cashew nuts, local feni, and terracotta earthenware.",
    whatToBuy: ['Goan Spices & Kokum', 'Goan Choriz Sausages', 'Pure Goan Cashew Nuts', 'Traditional Handcrafted Earthenware', 'Local Bakery Bread & Sweets'],
    address: 'Mapusa Municipal Market, Mapusa, Goa 403507',
    location: { latitude: 15.5925, longitude: 73.8130 },
    metroStation: 'Mapusa Bus Terminal • 3 min walk',
    closedOn: 'Special peak every Friday; municipal market open daily',
    timings: '07:30 AM - 07:30 PM',
    bargainingTip: 'Friday mornings before 10 AM have the freshest local home-producer arrivals.',
    imageUrl: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=800&q=80',
    tags: ['spices', 'food', 'cashews', 'sausages', 'mapusa market', 'goa']
  },

  // ==================== LONDON LOCAL MARKETS ====================
  {
    id: 'london-camden-market',
    name: 'Camden Market & Stables',
    city: 'North London',
    cityId: 'london',
    specialty: 'clothes',
    specialtyLabel: 'Alternative Fashion, Vintage Streetwear & Global Food',
    famousFor: 'World-famous eclectic market set in historic canal-side horse stables. Known for punk/goth fashion, retro vinyl records, handmade leather goods, and international food stalls.',
    whatToBuy: ['Vintage Denim & Leather', 'Independent Designer Tops', 'Vinyl Records', 'Handmade Silver Trinkets', 'Street Food Delicacies'],
    address: 'Camden Lock Place, Chalk Farm Road, London NW1 8AF',
    location: { latitude: 51.5414, longitude: -0.1466 },
    metroStation: 'Camden Town Underground (Northern Line) • 3 min walk',
    closedOn: 'Open 7 Days',
    timings: '10:00 AM - 06:30 PM',
    bargainingTip: 'Independent craft and vintage sellers in the Stables may negotiate for cash on multi-item bundles.',
    imageUrl: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80',
    tags: ['clothes', 'vintage', 'fashion', 'street food', 'camden market', 'london']
  },
  {
    id: 'london-borough-market',
    name: 'Borough Market (Gourmet Food)',
    city: 'South London',
    cityId: 'london',
    specialty: 'spices_food',
    specialtyLabel: '1,000-Year-Old Historic Gourmet Food & Artisan Produce',
    famousFor: "London's oldest food market. Renowned for artisan cheeses, rare spices, truffles, freshly baked sourdough, cured meats, and gourmet street food under Victorian railway arches.",
    whatToBuy: ['British & French Farmhouse Cheeses', 'Truffle Oils & Rare Spices', 'Artisan Chocolates', 'Fresh Oysters', 'Hot Salt Beef Sandwiches'],
    address: '8 Southwark Street, London SE1 1TL',
    location: { latitude: 51.5055, longitude: -0.0909 },
    metroStation: 'London Bridge Underground • 2 min walk',
    closedOn: 'Closed on Mondays',
    timings: '10:00 AM - 05:00 PM',
    bargainingTip: 'Free food tastings and samples are offered generously at cheese and olive stalls.',
    imageUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80',
    tags: ['food', 'spices', 'gourmet', 'cheese', 'borough market', 'london']
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
  }
];

class MarketService {
  private osmCache = new Map<string, { timestamp: number; markets: LocalMarket[] }>();

  /**
   * Retrieves local markets dynamically for the user's active location.
   * Dynamically filters by active city/coordinates and fetches real live
   * markets from OpenStreetMap when outside curated hub centers.
   */
  public async getLocalMarkets(
    location: LiveLocationState,
    searchQuery?: string,
    specialtyFilter?: LocalMarketSpecialty | 'all'
  ): Promise<LocalMarket[]> {
    const userLat = location.coords.latitude;
    const userLon = location.coords.longitude;
    const cityRaw = (location.cityName || '').toLowerCase();
    
    // Resolve matched city ID with strict city name mapping
    let activeCityId = (location.matchedCityId || '').toLowerCase();
    if (cityRaw.includes('hyderabad') || cityRaw.includes('secunderabad')) activeCityId = 'hyderabad';
    else if (cityRaw.includes('delhi') || cityRaw.includes('ncr')) activeCityId = 'delhi';
    else if (cityRaw.includes('mumbai') || cityRaw.includes('bombay')) activeCityId = 'mumbai';
    else if (cityRaw.includes('bangalore') || cityRaw.includes('bengaluru')) activeCityId = 'bangalore';
    else if (cityRaw.includes('vijayawada') || cityRaw.includes('amaravati') || cityRaw.includes('klef')) activeCityId = 'vijayawada';
    else if (cityRaw.includes('jaipur')) activeCityId = 'jaipur';
    else if (cityRaw.includes('goa')) activeCityId = 'goa';
    else if (cityRaw.includes('london')) activeCityId = 'london';
    else if (cityRaw.includes('kyoto')) activeCityId = 'kyoto';

    const fallbackLocalExecution = async (): Promise<LocalMarket[]> => {
      // 1. Identify which curated region the user is currently located in
      const regionalMarkets = CURATED_MARKETS.filter(m => {
        // Direct cityId match
        if (m.cityId && activeCityId && m.cityId === activeCityId) return true;

        // Geodesic distance check (within 55 km of market location)
        const dist = getDistance(
          { latitude: userLat, longitude: userLon },
          { latitude: m.location.latitude, longitude: m.location.longitude }
        );
        return dist <= 55000;
      });

      let results: LocalMarket[] = [];

      if (regionalMarkets.length > 0) {
        // User is in a known hub city (Hyderabad, Delhi, Mumbai, Bangalore, Jaipur, Goa, Vijayawada, London, Kyoto)
        results = [...regionalMarkets];
      } else {
        // 2. Dynamic Live OSM Marketplace Discovery for any custom or uncurated city/coordinates
        const liveOsmMarkets = await this.fetchLiveOsmMarkets(userLat, userLon, location.cityName);
        if (liveOsmMarkets.length > 0) {
          results = liveOsmMarkets;
        } else {
          // Fallback: Show nearest global/regional markets sorted by proximity
          results = [...CURATED_MARKETS];
        }
      }

      // 3. Compute exact live geodesic distance for all returned markets
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

      // 4. Filter by specialty
      if (specialtyFilter && specialtyFilter !== 'all') {
        results = results.filter(m => m.specialty === specialtyFilter);
      }

      // 5. Intelligent Fuzzy Search using Fuse.js library
      if (searchQuery && searchQuery.trim().length > 0) {
        const q = searchQuery.trim();
        const fuseOptions = {
          keys: [
            { name: 'name', weight: 0.35 },
            { name: 'specialtyLabel', weight: 0.20 },
            { name: 'whatToBuy', weight: 0.20 },
            { name: 'famousFor', weight: 0.15 },
            { name: 'tags', weight: 0.15 },
            { name: 'famousLandmarkOrFood', weight: 0.10 },
            { name: 'address', weight: 0.05 },
            { name: 'city', weight: 0.05 }
          ],
          threshold: 0.4,
          ignoreLocation: true,
          includeScore: true,
          minMatchCharLength: 2,
        };

        // Search within currently filtered local city markets
        const localFuse = new Fuse(results, fuseOptions);
        const localMatches = localFuse.search(q);

        if (localMatches.length > 0) {
          results = localMatches.map(m => m.item);
        } else {
          // If not found in current city, search across all global/national markets with distance
          const allWithDist = CURATED_MARKETS.map(market => ({
            ...market,
            distanceMeters: getDistance(
              { latitude: userLat, longitude: userLon },
              { latitude: market.location.latitude, longitude: market.location.longitude }
            )
          }));
          const globalFuse = new Fuse(allWithDist, fuseOptions);
          const globalMatches = globalFuse.search(q);
          results = globalMatches.map(m => m.item);
        }
      }

      // 6. Sort by shortest distance first (unless fuzzy search already ranked items)
      if (!searchQuery || !searchQuery.trim()) {
        results.sort((a, b) => (a.distanceMeters || 0) - (b.distanceMeters || 0));
      }

      return results;
    };

    try {
      const backendResults = await api.getMarkets(
        {
          areaId: activeCityId,
          lat: userLat,
          lon: userLon,
          specialty: specialtyFilter,
          q: searchQuery
        },
        fallbackLocalExecution
      );

      if (backendResults && backendResults.length > 0) {
        return backendResults;
      }
      return await fallbackLocalExecution();
    } catch {
      return await fallbackLocalExecution();
    }
  }

  public async getMarketById(id: string): Promise<LocalMarket | undefined> {
    const local = CURATED_MARKETS.find(m => m.id === id);
    try {
      return await api.getMarketById(id, () => {
        if (!local) throw new Error(`Market not found: ${id}`);
        return local;
      });
    } catch {
      return local;
    }
  }

  /**
   * Fetches real live markets, shopping streets, and bazaars from OpenStreetMap
   * (via Photon and Nominatim) when in any custom or international city.
   */
  private async fetchLiveOsmMarkets(lat: number, lon: number, cityName: string): Promise<LocalMarket[]> {
    const cacheKey = `${lat.toFixed(2)},${lon.toFixed(2)}`;
    const cached = this.osmCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 180000) {
      return cached.markets;
    }

    const discovered: LocalMarket[] = [];
    const seen = new Set<string>();

    const searchTerms = ['market', 'bazaar', 'shopping', 'electronics', 'clothing'];

    await Promise.allSettled(
      searchTerms.map(async (term) => {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 3500);

          const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(term)}&lat=${lat}&lon=${lon}&limit=6`;
          const res = await fetch(url, { signal: controller.signal });
          clearTimeout(timeout);

          if (!res.ok) return;
          const data = await res.json();

          for (const feat of data.features || []) {
            const [fLon, fLat] = feat.geometry.coordinates;
            const key = `${fLat.toFixed(3)},${fLon.toFixed(3)}`;
            if (seen.has(key)) continue;

            const dist = getDistance({ latitude: lat, longitude: lon }, { latitude: fLat, longitude: fLon });
            // Must be within 40 km of the target location
            if (dist > 40000) continue;

            seen.add(key);
            const props = feat.properties || {};
            const rawName = props.name || props.street;
            if (!rawName || rawName.length < 3) continue;

            // Classify specialty based on keywords
            const lower = `${rawName} ${props.osm_value || ''} ${props.type || ''}`.toLowerCase();
            let specialty: LocalMarketSpecialty = 'wholesale';
            let specialtyLabel = 'Local Shopping Bazaar';

            if (lower.includes('tech') || lower.includes('electr') || lower.includes('computer') || lower.includes('phone') || lower.includes('mobile')) {
              specialty = 'electronics';
              specialtyLabel = 'Electronics & Gadgets';
            } else if (lower.includes('cloth') || lower.includes('apparel') || lower.includes('fashion') || lower.includes('textile') || lower.includes('saree')) {
              specialty = 'clothes';
              specialtyLabel = 'Clothes & Apparel';
            } else if (lower.includes('auto') || lower.includes('motor') || lower.includes('car') || lower.includes('spare')) {
              specialty = 'automobile';
              specialtyLabel = 'Automobile & Spares';
            } else if (lower.includes('spice') || lower.includes('food') || lower.includes('fruit') || lower.includes('grocer') || lower.includes('fish') || lower.includes('meat')) {
              specialty = 'spices_food';
              specialtyLabel = 'Spices & Local Produce';
            } else if (lower.includes('jewel') || lower.includes('gold') || lower.includes('silver') || lower.includes('gem')) {
              specialty = 'jewelry';
              specialtyLabel = 'Jewelry & Silverware';
            } else if (lower.includes('antique') || lower.includes('craft') || lower.includes('flea') || lower.includes('souvenir')) {
              specialty = 'antiques_handicrafts';
              specialtyLabel = 'Antiques & Souvenirs';
            }

            const addr = [props.street, props.district, props.city || cityName, props.state, props.country].filter(Boolean).join(', ');

            discovered.push({
              id: `osm-market-${props.osm_id || Math.random().toString(36).substring(7)}`,
              name: rawName,
              city: props.city || cityName.split(',')[0],
              specialty,
              specialtyLabel,
              famousFor: `Popular regional trading and retail hub in ${props.city || cityName.split(',')[0]} for local goods, retail and shopping.`,
              whatToBuy: ['Local Commodities', 'Daily Essentials', 'Regional Specialties'],
              address: addr || `Near ${cityName}`,
              location: { latitude: fLat, longitude: fLon },
              distanceMeters: dist,
              metroStation: props.city ? `Transit access via ${props.city} central line` : undefined,
              closedOn: 'Varies by local shopkeepers',
              timings: '10:00 AM - 08:30 PM',
              bargainingTip: 'Polite bargaining is customary with independent stall holders.',
              imageUrl: getDynamicPlaceImage({ name: rawName, category: 'supermarket' }),
              tags: ['market', specialty, rawName.toLowerCase()]
            });
          }
        } catch {
          // Gracefully continue next term
        }
      })
    );

    this.osmCache.set(cacheKey, { timestamp: Date.now(), markets: discovered });
    return discovered;
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
