import { Place, EmergencyDossier, CountryBriefing, CurrencyRates, WeatherReport, OfflinePack, RouteResponse } from '../types';

export const CITIES = [
  { id: 'hyderabad', name: 'Hyderabad', country: 'India', countryCode: 'IN', lat: 17.3850, lng: 78.4867 },
  { id: 'delhi', name: 'New Delhi & NCR', country: 'India', countryCode: 'IN', lat: 28.6139, lng: 77.2090 },
  { id: 'mumbai', name: 'South Mumbai', country: 'India', countryCode: 'IN', lat: 18.9322, lng: 72.8311 },
  { id: 'bangalore', name: 'Bengaluru (Bangalore)', country: 'India', countryCode: 'IN', lat: 12.9716, lng: 77.5946 },
  { id: 'vijayawada', name: 'Vijayawada / Amaravati (KLEF)', country: 'India', countryCode: 'IN', lat: 16.4422, lng: 80.6253 },
  { id: 'jaipur', name: 'Jaipur (Pink City)', country: 'India', countryCode: 'IN', lat: 26.9124, lng: 75.7873 },
  { id: 'goa', name: 'Goa Coast', country: 'India', countryCode: 'IN', lat: 15.4909, lng: 73.8278 },
  { id: 'kyoto', name: 'Gion, Kyoto', country: 'Japan', countryCode: 'JP', lat: 35.0037, lng: 135.7772 },
  { id: 'london', name: 'Central London', country: 'United Kingdom', countryCode: 'GB', lat: 51.5074, lng: -0.1278 },
  { id: 'newyork', name: 'Manhattan, New York', country: 'United States', countryCode: 'US', lat: 40.7128, lng: -74.0060 },
  { id: 'sydney', name: 'Sydney CBD', country: 'Australia', countryCode: 'AU', lat: -33.8688, lng: 151.2093 },
  { id: 'montreal', name: 'Old Montreal', country: 'Canada', countryCode: 'CA', lat: 45.5017, lng: -73.5673 },
];

export const MOCK_PLACES: Record<string, Place[]> = {
  kyoto: [
    {
      id: 'p-kyoto-01',
      name: 'Kyoto City Hospital ER',
      localizedName: '京都市立病院 救命救急センター',
      category: 'hospital',
      distanceMeters: 450,
      location: { latitude: 35.0045, longitude: 135.7785 },
      countryCode: 'JP',
      city: 'Kyoto',
      address: '1-2 Gojo-dori, Shimogyo Ward, Kyoto 600-8887',
      hours: { status: 'open', raw: '24/7', formatted: 'Emergency 24/7' },
      source: 'CURATED_REGISTRY',
      sourceUpdatedAt: '2026-09-24T06:00:00Z',
      freshness: 'fresh',
      emergencyCapable: true,
      phone: '+81-75-311-5311',
      tags: ['Verified ER', 'Multilingual Triage', 'English Staff', 'Pediatric Unit'],
      triageInfo: 'English & Multi-language triage • Priority Tier 1',
      imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBf1Oco61bM_zrKP6fBDkscfjmPXkQpm2dtumKBhvVMMpnM7PNEbtUTOdWUsxW7lZFRnMbINgzyEa7c00Oirn4FqILpCC0NvxsJ-ViaRKQ6WyWTkVwLNf7hxZNHtNDt0D8H4c0Z9ChgnRyr9iZTllRAOKTfB8F-8ZEHh-CgdjSIgF_c3NEQk6NcYBx2Hgd8WDOXODNmcFp9XEo0iRkz6sP5yDoDp7kakn11sx0vcaAmUMUVWdHOzxC9',
      operatingSchedule: [
        { day: 'Monday', hours: 'Open 24 Hours', isOpenNow: true },
        { day: 'Tuesday', hours: 'Open 24 Hours', isOpenNow: true },
        { day: 'Wednesday', hours: 'Open 24 Hours', isOpenNow: true },
        { day: 'Thursday', hours: 'Open 24 Hours', isOpenNow: true },
        { day: 'Friday', hours: 'Open 24 Hours', isOpenNow: true },
        { day: 'Saturday', hours: 'Open 24 Hours', isOpenNow: true },
        { day: 'Sunday', hours: 'Open 24 Hours', isOpenNow: true },
      ]
    },
    {
      id: 'p-kyoto-02',
      name: 'Matsumotokiyoshi Pharmacy',
      localizedName: 'マツモトキヨシ 祇園四条店',
      category: 'pharmacy',
      distanceMeters: 180,
      location: { latitude: 35.0039, longitude: 135.7760 },
      countryCode: 'JP',
      city: 'Kyoto',
      address: '240 Gionmachi Kitagawa, Higashiyama Ward, Kyoto',
      hours: { status: 'open', raw: 'Mo-Su 09:00-22:00', formatted: 'Open until 22:00' },
      source: 'OSM',
      sourceUpdatedAt: '2026-09-23T12:00:00Z',
      freshness: 'fresh',
      emergencyCapable: false,
      phone: '+81-75-532-0181',
      tags: ['Tax-Free', 'English Support', 'Duty Pharmacist'],
      triageInfo: 'Duty Pharmacist On-Site for OTC consultations',
      imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBEveTz4X1fzq8bL0kx-8_1gAlUJIQt8jZ8mG36Q4QqcJhyNtKYV8LCkoTN33YiStQyPCfppt5GLPEYk5N6X3lUushyzf1KU4T0UxCsnH1yOFdoiHt3Cy5LUPZNOgUCdxKDBE43RfqJc-sVH4gs6X7sDFZOF08YeBgV4vHhzoZ0vWBDDDFeyvLBGohf5QCgMxWIf6saN3D1P2LksJEoPu_KM8WLr9kksZFyexMC3imf1LxWZVc2yWaI',
      operatingSchedule: [
        { day: 'Monday - Sunday', hours: '09:00 - 22:00', isOpenNow: true }
      ]
    },
    {
      id: 'p-kyoto-03',
      name: '7-Eleven ATM (Seven Bank)',
      localizedName: 'セブン銀行ATM 祇園四条',
      category: 'atm',
      distanceMeters: 90,
      location: { latitude: 35.0035, longitude: 135.7770 },
      countryCode: 'JP',
      city: 'Kyoto',
      address: 'Higashiyama Ward, Shijo-dori, Kyoto',
      hours: { status: 'open', raw: '24/7', formatted: '24/7 Service' },
      source: 'OSM',
      sourceUpdatedAt: '2026-09-22T08:00:00Z',
      freshness: 'fresh',
      tags: ['Global Cards', 'Visa/Mastercard/Cirrus', 'English GUI'],
      triageInfo: 'Zero foreign card markup detected',
      imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCP80wjYZ_cF-GpUbPbqeWerR8w2IUCq7jU6O414ZKxYchUpRT2QAvbjCuEX-xMkRZoqu4VAjT0WPOluEvxYm_CQfDKpsvhwdKaAoIjD53nzglJsA-tOV456XG0PsQ9K-z-o55LlIBS7f1XxovxF4d86fo8-znHs-u9-62YHr-DxkgUadDSOB2B6XfFxYOV6JJFjWA5ajZSkPLcG2Rv2t0Qq9uB7pGFjEhFIFfhJlVrmR-RnCSMZG1I'
    },
    {
      id: 'p-kyoto-04',
      name: 'Gion-Shijo Station',
      localizedName: '祇園四条駅',
      category: 'transit_stop',
      distanceMeters: 320,
      location: { latitude: 35.0038, longitude: 135.7725 },
      countryCode: 'JP',
      city: 'Kyoto',
      address: 'Keihan Main Line, Higashiyama Ward, Kyoto',
      hours: { status: 'open', raw: '05:00-24:00', formatted: 'Next train: 4 min' },
      source: 'OSM',
      sourceUpdatedAt: '2026-09-24T00:00:00Z',
      freshness: 'fresh',
      tags: ['Keihan Line', 'Barrier-free Exit 4', 'IC Card IC-OCA'],
      imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD4H4qLoHB3lrZDMrxWE9x9C62Mni6D55zfM-H2tvAWBNztsuSU7fQWJYB1UDP-lzOVXggjBvGqquXbSnLg8BvRjlO8Kf80MyNp-Twj8B1q-Fm-BJm2bdSXWBnO_PK9C5KcaDuBLfRNnT0a4AHCm973-svY4l6Cw5k8Uu53yFkdSD5O3TkLgOZbucpkeNsI0EE5mphgfFzmnfWVVwACY-3M1tz6ooqUl-OVsXOyXJ23tWTlDgCjiMx9'
    },
    {
      id: 'p-kyoto-05',
      name: 'Police Box (Kōban) - Gion',
      localizedName: '東山警察署 祇園交番',
      category: 'police',
      distanceMeters: 150,
      location: { latitude: 35.0036, longitude: 135.7758 },
      countryCode: 'JP',
      city: 'Kyoto',
      address: 'Gionmachi Minamigawa, Higashiyama Ward, Kyoto',
      hours: { status: 'open', raw: '24/7', formatted: 'Open 24 Hours' },
      source: 'CURATED_REGISTRY',
      sourceUpdatedAt: '2026-09-24T00:00:00Z',
      freshness: 'fresh',
      emergencyCapable: true,
      phone: '+81-75-525-0110',
      tags: ['Official Kōban', 'Lost & Found', 'Tourist Assistance', 'Direct Dial 110']
    },
    {
      id: 'p-kyoto-06',
      name: 'Fresco Supermarket Gion',
      localizedName: 'フレスコ 祇園店',
      category: 'supermarket',
      distanceMeters: 550,
      location: { latitude: 35.0028, longitude: 135.7745 },
      countryCode: 'JP',
      city: 'Kyoto',
      address: 'Higashiyama Ward, Kyoto',
      hours: { status: 'open', raw: '24/7', formatted: 'Open 24 Hours' },
      source: 'OSM',
      sourceUpdatedAt: '2026-09-20T10:00:00Z',
      freshness: 'fresh',
      tags: ['Groceries', 'Credit Card Accepted', 'Ready-to-eat Bento']
    },
    {
      id: 'p-kyoto-07',
      name: 'Drip & Drop Coffee Supply',
      localizedName: 'ドリップ＆ドロップ コーヒー',
      category: 'cafe',
      distanceMeters: 410,
      location: { latitude: 35.0062, longitude: 135.7735 },
      countryCode: 'JP',
      city: 'Kyoto',
      address: 'Sanjo-dori, Nakagyo Ward, Kyoto',
      hours: { status: 'open', raw: '08:00-19:00', formatted: 'Open until 19:00' },
      source: 'OSM',
      sourceUpdatedAt: '2026-09-18T14:00:00Z',
      freshness: 'fresh',
      tags: ['Specialty Coffee', 'Wi-Fi', 'Power Outlets']
    }
  ],
  london: [
    {
      id: 'p-lon-01',
      name: "St Thomas' Hospital Emergency Department",
      category: 'hospital',
      distanceMeters: 380,
      location: { latitude: 51.5005, longitude: -0.1195 },
      countryCode: 'GB',
      city: 'London',
      address: 'Westminster Bridge Rd, London SE1 7EH',
      hours: { status: 'open', raw: '24/7', formatted: 'Emergency 24/7' },
      source: 'CURATED_REGISTRY',
      sourceUpdatedAt: '2026-09-24T06:00:00Z',
      freshness: 'fresh',
      emergencyCapable: true,
      phone: '+44-20-7188-7188',
      tags: ['NHS Major Trauma Center', 'Pediatric A&E', 'Walk-in Triage']
    },
    {
      id: 'p-lon-02',
      name: 'Boots Pharmacy Strand',
      category: 'pharmacy',
      distanceMeters: 220,
      location: { latitude: 51.5100, longitude: -0.1220 },
      countryCode: 'GB',
      city: 'London',
      address: '44-46 Strand, London WC2N 5HX',
      hours: { status: 'open', raw: '08:00-21:00', formatted: 'Open until 21:00' },
      source: 'OSM',
      sourceUpdatedAt: '2026-09-22T10:00:00Z',
      freshness: 'fresh',
      tags: ['Prescriptions', 'Travel Clinic', 'First Aid Supplies']
    },
    {
      id: 'p-lon-03',
      name: 'Charing Cross Police Station',
      category: 'police',
      distanceMeters: 450,
      location: { latitude: 51.5085, longitude: -0.1250 },
      countryCode: 'GB',
      city: 'London',
      address: 'Agar St, London WC2N 4JP',
      hours: { status: 'open', raw: '24/7', formatted: 'Open 24/7' },
      source: 'CURATED_REGISTRY',
      sourceUpdatedAt: '2026-09-24T00:00:00Z',
      freshness: 'fresh',
      emergencyCapable: true,
      phone: '+44-20-7240-1212',
      tags: ['Metropolitan Police', '24h Front Counter']
    }
  ],
  mumbai: [
    {
      id: 'p-bom-01',
      name: 'KEM Hospital & Emergency Trauma Care',
      category: 'hospital',
      distanceMeters: 620,
      location: { latitude: 19.0028, longitude: 72.8427 },
      countryCode: 'IN',
      city: 'Mumbai',
      address: 'Acharya Donde Marg, Parel, Mumbai 400012',
      hours: { status: 'open', raw: '24/7', formatted: 'Emergency 24/7' },
      source: 'CURATED_REGISTRY',
      sourceUpdatedAt: '2026-09-24T06:00:00Z',
      freshness: 'fresh',
      emergencyCapable: true,
      phone: '+91-22-2410-7000',
      tags: ['Level 1 Trauma', 'Government Teaching Hospital', '24h Casualty']
    },
    {
      id: 'p-bom-02',
      name: 'Apollo Pharmacy Colaba',
      category: 'pharmacy',
      distanceMeters: 190,
      location: { latitude: 18.9220, longitude: 72.8315 },
      countryCode: 'IN',
      city: 'Mumbai',
      address: 'Shahid Bhagat Singh Rd, Colaba, Mumbai',
      hours: { status: 'open', raw: '24/7', formatted: 'Open 24 Hours' },
      source: 'OSM',
      sourceUpdatedAt: '2026-09-23T11:00:00Z',
      freshness: 'fresh',
      tags: ['24/7 Chemist', 'UPI Accepted', 'Cold Storage Meds']
    }
  ],
  newyork: [
    {
      id: 'p-nyc-01',
      name: 'NYC Health + Hospitals / Bellevue ER',
      category: 'hospital',
      distanceMeters: 510,
      location: { latitude: 40.7388, longitude: -73.9755 },
      countryCode: 'US',
      city: 'New York',
      address: '462 1st Ave, New York, NY 10016',
      hours: { status: 'open', raw: '24/7', formatted: 'Emergency 24/7' },
      source: 'CURATED_REGISTRY',
      sourceUpdatedAt: '2026-09-24T06:00:00Z',
      freshness: 'fresh',
      emergencyCapable: true,
      phone: '+1-212-562-4141',
      tags: ['Level 1 Trauma Center', 'Pediatric Emergency', 'Psychiatric ER']
    },
    {
      id: 'p-nyc-02',
      name: 'Duane Reade 24h Pharmacy',
      category: 'pharmacy',
      distanceMeters: 280,
      location: { latitude: 40.7410, longitude: -73.9820 },
      countryCode: 'US',
      city: 'New York',
      address: '305 Broadway, New York, NY 10007',
      hours: { status: 'open', raw: '24/7', formatted: 'Open 24 Hours' },
      source: 'OSM',
      sourceUpdatedAt: '2026-09-22T14:00:00Z',
      freshness: 'fresh',
      tags: ['24 Hour Pharmacy', 'Walgreens Pharmacy Hub']
    }
  ],
  sydney: [
    {
      id: 'p-syd-01',
      name: "St Vincent's Hospital Emergency Department",
      category: 'hospital',
      distanceMeters: 420,
      location: { latitude: -33.8785, longitude: 151.2215 },
      countryCode: 'AU',
      city: 'Sydney',
      address: '390 Victoria St, Darlinghurst NSW 2010',
      hours: { status: 'open', raw: '24/7', formatted: 'Emergency 24/7' },
      source: 'CURATED_REGISTRY',
      sourceUpdatedAt: '2026-09-24T06:00:00Z',
      freshness: 'fresh',
      emergencyCapable: true,
      phone: '+61-2-8382-1111',
      tags: ['Level 1 Trauma', '24/7 Emergency']
    }
  ],
  montreal: [
    {
      id: 'p-mtl-01',
      name: 'CHUM - Centre hospitalier de l’Université de Montréal',
      category: 'hospital',
      distanceMeters: 490,
      location: { latitude: 45.5125, longitude: -73.5570 },
      countryCode: 'CA',
      city: 'Montreal',
      address: '1051 Rue Sanguinet, Montréal, QC H2X 3E4',
      hours: { status: 'open', raw: '24/7', formatted: 'Urgences 24/7' },
      source: 'CURATED_REGISTRY',
      sourceUpdatedAt: '2026-09-24T06:00:00Z',
      freshness: 'fresh',
      emergencyCapable: true,
      phone: '+1-514-890-8000',
      tags: ['Trauma tertiaire', 'Soins intensifs', 'Bilingue En/Fr']
    }
  ]
};

export const EMERGENCY_DOSSIERS: Record<string, EmergencyDossier> = {
  JP: {
    countryCode: 'JP',
    countryName: 'Japan',
    city: 'Kyoto',
    nationalHotlines: [
      { service: 'Police (警察)', number: '110', description: 'Free instant emergency call from any phone or payphone (red button).', instantDial: true },
      { service: 'Ambulance & Fire (救急・消防)', number: '119', description: 'Immediate medical dispatch. Multilingual interpretation available.', instantDial: true },
      { service: 'Japan Helpline (All Emergencies)', number: '0570-000-911', description: '24-hour English emergency assistance and travel crisis support.', instantDial: true },
      { service: 'Coast Guard (海上保安庁)', number: '118', description: 'Maritime emergency and water rescue.', instantDial: false },
    ],
    emergencyPhrases: [
      { category: 'Medical', english: 'Please call an ambulance!', localScript: '救急車を呼んでください！', pronunciation: 'Kyūkyūsha o yonde kudasai!' },
      { category: 'Location', english: 'Where is the nearest hospital?', localScript: '一番近い病院はどこですか？', pronunciation: 'Ichiban chikai byōin wa doko desu ka?' },
      { category: 'Safety', english: 'Help me! Police!', localScript: '助けて！警察を呼んで！', pronunciation: 'Tasukete! Keisatsu o yonde!' },
      { category: 'Allergy', english: 'I have a severe medication allergy.', localScript: '私は重い薬のアレルギーがあります。', pronunciation: 'Watashi wa omoi kusuri no arerugī ga arimasu.' },
      { category: 'Language', english: 'Does anyone speak English?', localScript: '英語が話せる人はいませんか？', pronunciation: 'Eigo ga hanaseru hito wa imasen ka?' }
    ],
    verifiedER: MOCK_PLACES.kyoto[0],
    embassyContact: {
      name: 'U.S. Consulate General Osaka-Kobe',
      phone: '+81-6-6315-5900',
      address: '2-11-5 Nishitenma, Kita-ku, Osaka 530-8543'
    }
  },
  IN: {
    countryCode: 'IN',
    countryName: 'India',
    city: 'Mumbai',
    nationalHotlines: [
      { service: 'National Emergency Unified (ERSS)', number: '112', description: 'Single unified emergency helpline across all Indian States & UTs.', instantDial: true },
      { service: 'Ambulance', number: '108', description: 'State government emergency ambulance network.', instantDial: true },
      { service: 'Police Control', number: '100', description: 'Local city police control room dispatch.', instantDial: true },
      { service: 'Fire Brigade', number: '101', description: 'Fire and disaster response.', instantDial: true },
    ],
    emergencyPhrases: [
      { category: 'Medical', english: 'Please call an ambulance immediately!', localScript: 'कृपया तुरंत एम्बुलेंस बुलाएं!', pronunciation: 'Kripya turant ambulance bulayein!' },
      { category: 'Medical', english: 'I need urgent doctor assistance.', localScript: 'मुझे तुरंत डॉक्टर की ज़रूरत है।', pronunciation: 'Mujhe turant doctor ki zaroorat hai.' },
      { category: 'Location', english: 'Where is the nearest hospital casualty?', localScript: 'सबसे नज़दीकी अस्पताल कहाँ है?', pronunciation: 'Sabse nazdeeki aspatal kahan hai?' }
    ],
    verifiedER: MOCK_PLACES.mumbai[0]
  },
  GB: {
    countryCode: 'GB',
    countryName: 'United Kingdom',
    city: 'London',
    nationalHotlines: [
      { service: 'Emergency Services (All)', number: '999', description: 'Police, Ambulance, Fire, Coastguard. Free from any active SIM or emergency call-out.', instantDial: true },
      { service: 'Pan-European Emergency', number: '112', description: 'European standard emergency access routed directly to 999 response centers.', instantDial: true },
      { service: 'NHS Non-Emergency Health Advice', number: '111', description: '24/7 medical triage for urgent but non-life-threatening advice.', instantDial: true },
      { service: 'Police Non-Emergency', number: '101', description: 'Report minor incidents or lost property.', instantDial: false },
    ],
    emergencyPhrases: [
      { category: 'Medical', english: 'I need emergency medical assistance right now.', localScript: 'Emergency: Need paramedic on-site.', pronunciation: 'Direct verbal notice for UK first responders.' }
    ],
    verifiedER: MOCK_PLACES.london[0]
  },
  US: {
    countryCode: 'US',
    countryName: 'United States',
    city: 'New York',
    nationalHotlines: [
      { service: 'Emergency Dispatch (911)', number: '911', description: 'Nationwide emergency dispatch for Police, EMS, and Fire.', instantDial: true },
      { service: 'Poison Control Center', number: '1-800-222-1222', description: '24/7 toxic substance exposure and emergency medical guidance.', instantDial: true },
      { service: 'Crisis & Suicide Lifeline', number: '988', description: 'Confidential free mental health emergency triage.', instantDial: true }
    ],
    emergencyPhrases: [
      { category: 'Medical', english: 'Dial 911 immediately.', localScript: 'Emergency 911 dispatch.', pronunciation: 'Provide intersection or GPS coordinates.' }
    ],
    verifiedER: MOCK_PLACES.newyork[0]
  },
  AU: {
    countryCode: 'AU',
    countryName: 'Australia',
    city: 'Sydney',
    nationalHotlines: [
      { service: 'Emergency Services (Triple Zero)', number: '000', description: 'Police, Fire, Ambulance nationwide.', instantDial: true },
      { service: 'Mobile GSM Emergency', number: '112', description: 'International mobile emergency redirect to Triple Zero.', instantDial: true },
      { service: 'Poisons Information Centre', number: '13 11 26', description: 'Australia-wide emergency poisoning advisory.', instantDial: true }
    ],
    emergencyPhrases: [
      { category: 'Medical', english: 'Call Triple Zero (000) for ambulance.', localScript: 'Emergency 000 ambulance dispatch.', pronunciation: 'Standard Australian triple-zero protocol.' }
    ],
    verifiedER: MOCK_PLACES.sydney[0]
  },
  CA: {
    countryCode: 'CA',
    countryName: 'Canada',
    city: 'Montreal',
    nationalHotlines: [
      { service: 'Services d’urgence (911)', number: '911', description: 'Police, Pompiers, Ambulances au Canada.', instantDial: true },
      { service: 'Info-Santé / Info-Social', number: '811', description: 'Service de consultation téléphonique en santé 24/7.', instantDial: true },
      { service: 'Centre Antipoison du Québec', number: '1-800-463-5060', description: 'Assistance immédiate en cas d’intoxication.', instantDial: true }
    ],
    emergencyPhrases: [
      { category: 'Medical', english: 'Please call 911!', localScript: 'Appelez le 911 s’il vous plaît !', pronunciation: 'Ah-play luh neuf-un-un seel voo play!' },
      { category: 'Location', english: 'Where is the hospital?', localScript: 'Où est l’hôpital le plus proche ?', pronunciation: 'Oo ay lo-pee-tal luh ploo prosh?' }
    ],
    verifiedER: MOCK_PLACES.montreal[0]
  }
};

export const COUNTRY_BRIEFINGS: Record<string, CountryBriefing> = {
  JP: {
    countryCode: 'JP',
    countryName: 'Japan',
    city: 'Kyoto',
    callingCode: '+81',
    timezone: 'JST (UTC+9)',
    currency: 'JPY',
    currencySymbol: '¥',
    powerPlugs: 'Type A & B (100V, 50/60Hz)',
    voltage: '100V (US two-prong plugs fit without adapter)',
    transitTip: 'Tap IC Cards (Suica, Pasmo, ICOCA) on buses and trains. Mobile IC cards work without battery reserve.',
    culturalEtiquette: [
      'Tipping is strictly not customary and can cause confusion or polite refusal.',
      'Maintain low voice levels on transit; phone calls on trains are discouraged.',
      'Carry small bags for waste: public trash cans are rare outside train platforms and vending machines.'
    ]
  },
  GB: {
    countryCode: 'GB',
    countryName: 'United Kingdom',
    city: 'London',
    callingCode: '+44',
    timezone: 'GMT / BST (UTC+0 / UTC+1)',
    currency: 'GBP',
    currencySymbol: '£',
    powerPlugs: 'Type G (230V, 50Hz)',
    voltage: '230V (Three rectangular prongs)',
    transitTip: 'Tap any contactless credit card or Apple/Google Pay on London Underground and buses for daily fare caps.',
    culturalEtiquette: [
      'Stand on the right on escalators, walk on the left.',
      'Queueing is an essential social norm; always respect the line.',
      'Standard tip in restaurants is 10-12.5% (often added as discretionary service charge).'
    ]
  },
  IN: {
    countryCode: 'IN',
    countryName: 'India',
    city: 'Mumbai',
    callingCode: '+91',
    timezone: 'IST (UTC+5:30)',
    currency: 'INR',
    currencySymbol: '₹',
    powerPlugs: 'Type C, D & M (230V, 50Hz)',
    voltage: '230V (Round three-pin plugs)',
    transitTip: 'UPI QR code payments (Google Pay, PhonePe) are accepted universally, even by street vendors.',
    culturalEtiquette: [
      'Remove footwear before entering homes and places of worship.',
      'Eat and exchange money or objects predominantly with your right hand.',
      'Carry bottled water certified with ISI seal.'
    ]
  },
  US: {
    countryCode: 'US',
    countryName: 'United States',
    city: 'New York',
    callingCode: '+1',
    timezone: 'EST / EDT (UTC-5 / UTC-4)',
    currency: 'USD',
    currencySymbol: '$',
    powerPlugs: 'Type A & B (120V, 60Hz)',
    voltage: '120V',
    transitTip: 'Use OMNY contactless tap-and-go at all NYC subway turnstiles. 12 rides in 7 days unlocks free rides for the week.',
    culturalEtiquette: [
      'Tipping 18-20% is expected for sit-down restaurant table service.',
      'Sales tax is added at the register and not included in marked shelf prices.',
      'Walk briskly and step to the side when stopping on sidewalks.'
    ]
  },
  AU: {
    countryCode: 'AU',
    countryName: 'Australia',
    city: 'Sydney',
    callingCode: '+61',
    timezone: 'AEST / AEDT (UTC+10 / UTC+11)',
    currency: 'AUD',
    currencySymbol: 'A$',
    powerPlugs: 'Type I (230V, 50Hz)',
    voltage: '230V (Inverted V-shape pins)',
    transitTip: 'Opal card or contactless credit card taps apply to trains, ferries, light rail, and buses.',
    culturalEtiquette: [
      'Tipping is not required, but 10% for exceptional dining is appreciated.',
      'Sunscreen (SPF 50+) is essential year-round due to high UV index.',
      'Keep left on escalators and footpaths.'
    ]
  },
  CA: {
    countryCode: 'CA',
    countryName: 'Canada',
    city: 'Montreal',
    callingCode: '+1',
    timezone: 'EST / EDT (UTC-5 / UTC-4)',
    currency: 'CAD',
    currencySymbol: 'C$',
    powerPlugs: 'Type A & B (120V, 60Hz)',
    voltage: '120V',
    transitTip: 'OPUS card works on Montreal STM metro and buses. 1-day and 3-day tourist passes provide unlimited travel.',
    culturalEtiquette: [
      'In Quebec, greeting with "Bonjour" is appreciated before switching to English.',
      'Tipping 15-20% before tax is standard for service in restaurants and taxis.'
    ]
  }
};

export const MOCK_RATES: CurrencyRates = {
  base: 'USD',
  asOf: '2026-09-27T06:00:00Z',
  source: 'European Central Bank Reference / OpenFX Baseline',
  rates: {
    USD: 1.0,
    JPY: 152.42,
    EUR: 0.92,
    GBP: 0.77,
    INR: 83.54,
    AUD: 1.51,
    CAD: 1.36
  }
};

export const MOCK_WEATHER: Record<string, WeatherReport> = {
  kyoto: {
    city: 'Gion, Kyoto',
    tempC: 21,
    condition: 'Clear Daylight',
    highC: 24,
    lowC: 15,
    humidity: 58,
    observedAt: '2026-09-27T12:00:00Z',
    hourly: [
      { time: '13:00', tempC: 21, condition: 'Clear' },
      { time: '14:00', tempC: 22, condition: 'Sunny' },
      { time: '15:00', tempC: 22, condition: 'Partly Cloudy' },
      { time: '16:00', tempC: 20, condition: 'Clear' },
      { time: '17:00', tempC: 18, condition: 'Sunset' },
      { time: '18:00', tempC: 17, condition: 'Clear Night' },
    ]
  },
  london: {
    city: 'Central London',
    tempC: 16,
    condition: 'Overcast & Mild',
    highC: 18,
    lowC: 11,
    humidity: 74,
    observedAt: '2026-09-27T12:00:00Z',
    hourly: [
      { time: '13:00', tempC: 16, condition: 'Overcast' },
      { time: '14:00', tempC: 17, condition: 'Breezy' },
      { time: '15:00', tempC: 16, condition: 'Light Rain' },
      { time: '16:00', tempC: 15, condition: 'Cloudy' },
    ]
  },
  mumbai: {
    city: 'South Mumbai',
    tempC: 29,
    condition: 'Humid & Partly Sunny',
    highC: 32,
    lowC: 26,
    humidity: 82,
    observedAt: '2026-09-27T12:00:00Z',
    hourly: [
      { time: '13:00', tempC: 30, condition: 'Humid' },
      { time: '14:00', tempC: 31, condition: 'Sunny' },
      { time: '15:00', tempC: 30, condition: 'Passing Shower' },
      { time: '16:00', tempC: 29, condition: 'Warm' },
    ]
  },
  newyork: {
    city: 'Manhattan, New York',
    tempC: 19,
    condition: 'Crisp Autumn Day',
    highC: 21,
    lowC: 13,
    humidity: 50,
    observedAt: '2026-09-27T12:00:00Z',
    hourly: [
      { time: '13:00', tempC: 19, condition: 'Sunny' },
      { time: '14:00', tempC: 20, condition: 'Clear' },
      { time: '15:00', tempC: 21, condition: 'Clear' },
      { time: '16:00', tempC: 18, condition: 'Cool' },
    ]
  },
  sydney: {
    city: 'Sydney CBD',
    tempC: 20,
    condition: 'Sunny Coastal',
    highC: 23,
    lowC: 14,
    humidity: 62,
    observedAt: '2026-09-27T12:00:00Z',
    hourly: [
      { time: '13:00', tempC: 20, condition: 'Sunny' },
      { time: '14:00', tempC: 21, condition: 'Breezy' },
      { time: '15:00', tempC: 22, condition: 'Clear' },
      { time: '16:00', tempC: 19, condition: 'Cool' },
    ]
  },
  montreal: {
    city: 'Old Montreal',
    tempC: 14,
    condition: 'Cool & Sunny',
    highC: 16,
    lowC: 8,
    humidity: 55,
    observedAt: '2026-09-27T12:00:00Z',
    hourly: [
      { time: '13:00', tempC: 14, condition: 'Sunny' },
      { time: '14:00', tempC: 15, condition: 'Clear' },
      { time: '15:00', tempC: 16, condition: 'Partly Cloudy' },
      { time: '16:00', tempC: 13, condition: 'Crisp' },
    ]
  }
};

export const MOCK_OFFLINE_PACKS: OfflinePack[] = [
  {
    id: 'pack-ap-amaravati-v10',
    areaId: 'vijayawada',
    name: 'Andhra Pradesh & Amaravati (Vijayawada / KLEF)',
    country: 'India',
    sizeBytes: 859832320,
    sizeFormatted: '820 MB',
    version: '1.0.4-prod',
    installed: true,
    manifest: {
      packId: 'pack-ap-amaravati-v10',
      areaId: 'vijayawada',
      version: '1.0.4',
      schemaVersion: 'v8-2026',
      hashes: {
        'basemap.mbtiles': '3a88c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        'pois.sqlite': '9b26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae',
        'routing.osrm': '1c83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069'
      },
      lengths: {
        'basemap.mbtiles': 515899392,
        'pois.sqlite': 214958080,
        'routing.osrm': 128974848
      },
      issuedAt: '2026-09-26T00:00:00Z',
      expiresAt: '2026-10-26T00:00:00Z',
      keyId: 'key-ap-signer-2026-09',
      signature: 'eyJhbGciOiJFUzI1NiIsImtpZCI6ImtleS1hcC1zaWduZXItMjAyNi0wOSJ9.e30.APsigVijayawada'
    }
  },
  {
    id: 'pack-mumbai-v29',
    areaId: 'mumbai',
    name: 'Mumbai Metropolitan Region (MMR)',
    country: 'India',
    sizeBytes: 943718400,
    sizeFormatted: '900 MB',
    version: '2.9.4-prod',
    installed: false,
    manifest: {
      packId: 'pack-mumbai-v29',
      areaId: 'mumbai',
      version: '2.9.4',
      schemaVersion: 'v8-2026',
      hashes: { 'basemap.mbtiles': '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8' },
      lengths: { 'basemap.mbtiles': 943718400 },
      issuedAt: '2026-09-22T00:00:00Z',
      expiresAt: '2026-10-22T00:00:00Z',
      keyId: 'key-local-signer-2026-09',
      signature: 'eyJhbGciOiJFUzI1NiJ9.e30.sigMumbai'
    }
  },
  {
    id: 'pack-delhi-v33',
    areaId: 'delhi',
    name: 'Delhi NCR & Northern Heritage Circuit',
    country: 'India',
    sizeBytes: 1027604480,
    sizeFormatted: '980 MB',
    version: '3.3.1-prod',
    installed: false,
    manifest: {
      packId: 'pack-delhi-v33',
      areaId: 'delhi',
      version: '3.3.1',
      schemaVersion: 'v8-2026',
      hashes: { 'basemap.mbtiles': '7d884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8' },
      lengths: { 'basemap.mbtiles': 1027604480 },
      issuedAt: '2026-09-25T00:00:00Z',
      expiresAt: '2026-10-25T00:00:00Z',
      keyId: 'key-local-signer-2026-09',
      signature: 'eyJhbGciOiJFUzI1NiJ9.e30.sigDelhi'
    }
  },
  {
    id: 'pack-goa-v18',
    areaId: 'goa',
    name: 'Goa Coastal & Heritage District',
    country: 'India',
    sizeBytes: 671088640,
    sizeFormatted: '640 MB',
    version: '1.8.0-prod',
    installed: false,
    manifest: {
      packId: 'pack-goa-v18',
      areaId: 'goa',
      version: '1.8.0',
      schemaVersion: 'v8-2026',
      hashes: { 'basemap.mbtiles': '6c884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8' },
      lengths: { 'basemap.mbtiles': 671088640 },
      issuedAt: '2026-09-25T00:00:00Z',
      expiresAt: '2026-10-25T00:00:00Z',
      keyId: 'key-local-signer-2026-09',
      signature: 'eyJhbGciOiJFUzI1NiJ9.e30.sigGoa'
    }
  },
  {
    id: 'pack-paris-v45',
    areaId: 'paris',
    name: 'Île-de-France & Greater Paris Basin',
    country: 'France',
    sizeBytes: 1415577600,
    sizeFormatted: '1.32 GB',
    version: '4.5.0-prod',
    installed: false,
    manifest: {
      packId: 'pack-paris-v45',
      areaId: 'paris',
      version: '4.5.0',
      schemaVersion: 'v8-2026',
      hashes: { 'basemap.mbtiles': '8e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8' },
      lengths: { 'basemap.mbtiles': 1415577600 },
      issuedAt: '2026-09-24T00:00:00Z',
      expiresAt: '2026-10-24T00:00:00Z',
      keyId: 'key-local-signer-2026-09',
      signature: 'eyJhbGciOiJFUzI1NiJ9.e30.sigParis'
    }
  },
  {
    id: 'pack-london-v38',
    areaId: 'london',
    name: 'Greater London & South East',
    country: 'United Kingdom',
    sizeBytes: 1258291200,
    sizeFormatted: '1.20 GB',
    version: '3.8.0-prod',
    installed: false,
    manifest: {
      packId: 'pack-london-v38',
      areaId: 'london',
      version: '3.8.0',
      schemaVersion: 'v8-2026',
      hashes: { 'basemap.mbtiles': '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08' },
      lengths: { 'basemap.mbtiles': 1258291200 },
      issuedAt: '2026-09-20T00:00:00Z',
      expiresAt: '2026-10-20T00:00:00Z',
      keyId: 'key-local-signer-2026-09',
      signature: 'eyJhbGciOiJFUzI1NiJ9.e30.sigLondon'
    }
  },
  {
    id: 'pack-nyc-v40',
    areaId: 'newyork',
    name: 'New York City Tri-State',
    country: 'United States',
    sizeBytes: 1468006400,
    sizeFormatted: '1.40 GB',
    version: '4.0.2-prod',
    installed: false,
    manifest: {
      packId: 'pack-nyc-v40',
      areaId: 'newyork',
      version: '4.0.2',
      schemaVersion: 'v8-2026',
      hashes: { 'basemap.mbtiles': '4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a' },
      lengths: { 'basemap.mbtiles': 1468006400 },
      issuedAt: '2026-09-21T00:00:00Z',
      expiresAt: '2026-10-21T00:00:00Z',
      keyId: 'key-local-signer-2026-09',
      signature: 'eyJhbGciOiJFUzI1NiJ9.e30.sigNYC'
    }
  },
  {
    id: 'pack-kyoto-v42',
    areaId: 'kyoto',
    name: 'Kyoto Prefecture & Kansai Hub',
    country: 'Japan',
    sizeBytes: 1488977920,
    sizeFormatted: '1.42 GB',
    version: '4.2.1-prod',
    installed: false,
    manifest: {
      packId: 'pack-kyoto-v42',
      areaId: 'kyoto',
      version: '4.2.1',
      schemaVersion: 'v8-2026',
      hashes: {
        'basemap.mbtiles': 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        'pois.sqlite': '2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae',
        'routing.osrm': '7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069'
      },
      lengths: {
        'basemap.mbtiles': 880803840,
        'pois.sqlite': 335544320,
        'routing.osrm': 272629760
      },
      issuedAt: '2026-09-24T00:00:00Z',
      expiresAt: '2026-10-24T00:00:00Z',
      keyId: 'key-local-signer-2026-09',
      signature: 'eyJhbGciOiJFUzI1NiIsImtpZCI6ImtleS1sb2NhbC1zaWduZXItMjAyNi0wOSJ9.e30.D7S...'
    }
  },
  {
    id: 'pack-syd-v31',
    areaId: 'sydney',
    name: 'Greater Sydney & New South Wales',
    country: 'Australia',
    sizeBytes: 891289600,
    sizeFormatted: '850 MB',
    version: '3.1.0-prod',
    installed: false,
    manifest: {
      packId: 'pack-syd-v31',
      areaId: 'sydney',
      version: '3.1.0',
      schemaVersion: 'v8-2026',
      hashes: { 'basemap.mbtiles': 'ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d' },
      lengths: { 'basemap.mbtiles': 891289600 },
      issuedAt: '2026-09-23T00:00:00Z',
      expiresAt: '2026-10-23T00:00:00Z',
      keyId: 'key-local-signer-2026-09',
      signature: 'eyJhbGciOiJFUzI1NiJ9.e30.sigSyd'
    }
  }
];

export const MOCK_KYOTO_ROUTE: RouteResponse = {
  graphVersion: 'osrm-walking-v20260924',
  profileVersion: 'pedestrian-v8.1',
  mode: 'walking',
  distanceMeters: 280,
  durationSeconds: 240, // 4 mins
  sourceUpdatedAt: '2026-09-24T00:00:00Z',
  coverageAreaId: 'kyoto',
  geometry: {
    type: 'LineString',
    coordinates: [
      [135.7772, 35.0037],
      [135.7775, 35.0037],
      [135.7775, 35.0041],
      [135.7780, 35.0043],
      [135.7785, 35.0045]
    ]
  },
  steps: [
    {
      id: 'step-1',
      instruction: 'Head North on Shijo-dori toward Hanamikoji Street',
      instructionLocal: '四条通を花見小路方面へ北に進む',
      distanceMeters: 65,
      durationSeconds: 50,
      maneuver: 'depart',
      landmark: 'Start from current GPS fix at Gion crossing',
      streetName: 'Shijo-dori',
      streetNameLocal: '四条通'
    },
    {
      id: 'step-2',
      instruction: 'Turn Right onto Shijo-dori covered arcade',
      instructionLocal: '四条通のアーケードを右折',
      distanceMeters: 45,
      durationSeconds: 38,
      maneuver: 'turn_right',
      landmark: 'Follow covered arcade past Lawson convenience store',
      streetName: 'Shijo-dori Arcade',
      streetNameLocal: '四条通アーケード'
    },
    {
      id: 'step-3',
      instruction: 'Continue straight through the pedestrian crossing',
      instructionLocal: '歩行者用横断歩道をそのまま直進',
      distanceMeters: 90,
      durationSeconds: 75,
      maneuver: 'straight',
      landmark: 'Cross traffic light with audio acoustic signal',
      streetName: 'Gion Intersection',
      streetNameLocal: '祇園交差点'
    },
    {
      id: 'step-4',
      instruction: 'Turn Left onto Gojo Access Lane',
      instructionLocal: '五条連絡路を左折',
      distanceMeters: 55,
      durationSeconds: 45,
      maneuver: 'turn_left',
      landmark: 'Red emergency triage sign visible on right',
      streetName: 'Hospital Access Road',
      streetNameLocal: '病院進入路'
    },
    {
      id: 'step-5',
      instruction: 'Arrive at Kyoto City Hospital ER Entrance',
      instructionLocal: '京都市立病院 救急救命センター入口に到着',
      distanceMeters: 25,
      durationSeconds: 32,
      maneuver: 'arrive',
      landmark: 'Barrier-free 24/7 emergency entrance with ambulance bay',
      streetName: 'ER Entrance Way',
      streetNameLocal: '救急外来入口'
    }
  ]
};
