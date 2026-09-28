import { Category } from '../types';

export interface CategoryVisualMeta {
  icon: string;
  label: string;
  emoji: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  badgeBgClass: string;
  badgeTextClass: string;
  hex: string;
}

// Deterministic string hash for consistent image selection
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

// Curated high-resolution, fast-loading imagery catalog
const CURATED_IMAGE_COLLECTIONS: Record<string, string[]> = {
  starbucks: [
    'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=600&q=80'
  ],
  cafe: [
    'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?auto=format&fit=crop&w=600&q=80'
  ],
  supermarket: [
    'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1534723452862-4c874018d66d?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?auto=format&fit=crop&w=600&q=80'
  ],
  hospital: [
    'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=600&q=80'
  ],
  pharmacy: [
    'https://images.unsplash.com/photo-1576602976047-174e57a47881?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80'
  ],
  historic: [
    'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1585136917122-c313a5f36e4f?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1608958435020-e8a7109ba809?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1566438480900-0609be27a4be?auto=format&fit=crop&w=600&q=80'
  ],
  museum: [
    'https://images.unsplash.com/photo-1565008447742-97f6f38c985c?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1518998053901-5348d3961a04?auto=format&fit=crop&w=600&q=80'
  ],
  beach: [
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80'
  ],
  attraction: [
    'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=600&q=80'
  ],
  atm: [
    'https://images.unsplash.com/photo-1601597111158-2fceff292cdc?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=600&q=80'
  ],
  transit_stop: [
    'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80'
  ],
  police: [
    'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80'
  ],
  restaurant: [
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80'
  ],
  hotel: [
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=600&q=80'
  ],
  fuel: [
    'https://images.unsplash.com/photo-1545459720-aac8509eb02c?auto=format&fit=crop&w=600&q=80'
  ]
};

/**
 * Returns dynamic visual metadata (Material Icon, label, emoji, styling classes, hex)
 * for a place or category. If no image is available, this provides the requested
 * "hospital icon, shop icon, cafe icon, or location mark" representation.
 */
export function getCategoryVisualMeta(category: Category, placeName?: string): CategoryVisualMeta {
  const name = (placeName || '').toLowerCase();

  // 1. Café / Coffee (e.g. Starbucks)
  if (name.includes('starbucks') || name.includes('coffee') || name.includes('cafe') || name.includes('café') || name.includes('bakery') || category === 'cafe') {
    return {
      icon: 'local_cafe',
      label: 'Café',
      emoji: '☕',
      bgClass: 'bg-amber-50',
      textClass: 'text-amber-700',
      borderClass: 'border-amber-200',
      badgeBgClass: 'bg-amber-50',
      badgeTextClass: 'text-amber-800',
      hex: '#d97706'
    };
  }

  // 2. Shops, Supermarkets, Grocers, Malls, Stores
  if (name.includes('supermarket') || name.includes('grocer') || name.includes('mart') || name.includes('shop') || name.includes('store') || name.includes('bazaar') || name.includes('retail') || category === 'supermarket') {
    return {
      icon: 'storefront',
      label: 'Shop',
      emoji: '🛍️',
      bgClass: 'bg-emerald-50',
      textClass: 'text-emerald-700',
      borderClass: 'border-emerald-200',
      badgeBgClass: 'bg-emerald-50',
      badgeTextClass: 'text-emerald-800',
      hex: '#059669'
    };
  }

  // 3. Hospitals, Emergency Rooms, Clinics, Healthcare
  if (name.includes('hospital') || name.includes('clinic') || name.includes('aiims') || name.includes('manipal') || name.includes('casualty') || name.includes('trauma') || name.includes('health') || category === 'hospital') {
    return {
      icon: 'local_hospital',
      label: 'Hospital',
      emoji: '🏥',
      bgClass: 'bg-red-50',
      textClass: 'text-red-600',
      borderClass: 'border-red-200',
      badgeBgClass: 'bg-red-50',
      badgeTextClass: 'text-red-700',
      hex: '#dc2626'
    };
  }

  // 4. Pharmacy & Dispensary
  if (name.includes('pharmacy') || name.includes('chemist') || name.includes('med') || name.includes('druggist') || category === 'pharmacy') {
    return {
      icon: 'medication',
      label: 'Pharmacy',
      emoji: '💊',
      bgClass: 'bg-teal-50',
      textClass: 'text-teal-700',
      borderClass: 'border-teal-200',
      badgeBgClass: 'bg-teal-50',
      badgeTextClass: 'text-teal-800',
      hex: '#0d9488'
    };
  }

  // 5. ATMs & Banks
  if (name.includes('atm') || name.includes('cash') || name.includes('bank') || name.includes('sbi') || category === 'atm') {
    return {
      icon: 'atm',
      label: 'ATM',
      emoji: '🏧',
      bgClass: 'bg-emerald-50',
      textClass: 'text-emerald-700',
      borderClass: 'border-emerald-200',
      badgeBgClass: 'bg-emerald-50',
      badgeTextClass: 'text-emerald-800',
      hex: '#059669'
    };
  }

  // 6. Raj Mahal, Palaces, Forts, Ancient Caves, Heritage Sites
  if (name.includes('raj mahal') || name.includes('palace') || name.includes('mahal') || name.includes('fort') || name.includes('caves') || name.includes('monument') || name.includes('heritage') || category === 'historic') {
    return {
      icon: 'castle',
      label: 'Heritage',
      emoji: '🏰',
      bgClass: 'bg-amber-50',
      textClass: 'text-amber-800',
      borderClass: 'border-amber-200',
      badgeBgClass: 'bg-amber-50',
      badgeTextClass: 'text-amber-800',
      hex: '#b45309'
    };
  }

  // 7. Museums & Art Galleries
  if (name.includes('museum') || name.includes('gallery') || name.includes('art') || name.includes('exhibit') || category === 'museum') {
    return {
      icon: 'museum',
      label: 'Museum',
      emoji: '🏛️',
      bgClass: 'bg-purple-50',
      textClass: 'text-purple-700',
      borderClass: 'border-purple-200',
      badgeBgClass: 'bg-purple-50',
      badgeTextClass: 'text-purple-800',
      hex: '#7e22ce'
    };
  }

  // 8. Beaches, Coastal Waterfronts, Islands
  if (name.includes('beach') || name.includes('sea') || name.includes('shore') || name.includes('coast') || name.includes('ocean') || category === 'beach') {
    return {
      icon: 'beach_access',
      label: 'Beach',
      emoji: '🏖️',
      bgClass: 'bg-cyan-50',
      textClass: 'text-cyan-700',
      borderClass: 'border-cyan-200',
      badgeBgClass: 'bg-cyan-50',
      badgeTextClass: 'text-cyan-800',
      hex: '#0891b2'
    };
  }

  // 9. Police Stations & Outposts
  if (name.includes('police') || name.includes('koban') || name.includes('station') && category === 'police' || category === 'police') {
    return {
      icon: 'local_police',
      label: 'Police',
      emoji: '👮',
      bgClass: 'bg-indigo-50',
      textClass: 'text-indigo-700',
      borderClass: 'border-indigo-200',
      badgeBgClass: 'bg-indigo-50',
      badgeTextClass: 'text-indigo-800',
      hex: '#4338ca'
    };
  }

  // 10. Transit Stops, Metro, Railway Stations, Bus Terminals
  if (name.includes('bus') || name.includes('train') || name.includes('metro') || name.includes('railway') || category === 'transit_stop') {
    return {
      icon: 'train',
      label: 'Transit',
      emoji: '🚆',
      bgClass: 'bg-sky-50',
      textClass: 'text-sky-700',
      borderClass: 'border-sky-200',
      badgeBgClass: 'bg-sky-50',
      badgeTextClass: 'text-sky-800',
      hex: '#0284c7'
    };
  }

  // 11. Restaurant & Dining
  if (category === 'restaurant' || name.includes('restaurant') || name.includes('diner') || name.includes('bistro')) {
    return {
      icon: 'restaurant',
      label: 'Dining',
      emoji: '🍽️',
      bgClass: 'bg-orange-50',
      textClass: 'text-orange-700',
      borderClass: 'border-orange-200',
      badgeBgClass: 'bg-orange-50',
      badgeTextClass: 'text-orange-800',
      hex: '#ea580c'
    };
  }

  // 12. Hotel & Lodging
  if (category === 'hotel' || name.includes('hotel') || name.includes('resort') || name.includes('lodge')) {
    return {
      icon: 'hotel',
      label: 'Hotel',
      emoji: '🏨',
      bgClass: 'bg-indigo-50',
      textClass: 'text-indigo-700',
      borderClass: 'border-indigo-200',
      badgeBgClass: 'bg-indigo-50',
      badgeTextClass: 'text-indigo-800',
      hex: '#4f46e5'
    };
  }

  // 13. Tourist Attractions & Viewpoints
  if (category === 'attraction' || name.includes('attraction') || name.includes('viewpoint') || name.includes('sight')) {
    return {
      icon: 'attractions',
      label: 'Attraction',
      emoji: '🎡',
      bgClass: 'bg-rose-50',
      textClass: 'text-rose-700',
      borderClass: 'border-rose-200',
      badgeBgClass: 'bg-rose-50',
      badgeTextClass: 'text-rose-800',
      hex: '#e11d48'
    };
  }

  // 14. Fuel & Gas Stations
  if (category === 'fuel' || name.includes('petrol') || name.includes('gas') || name.includes('fuel')) {
    return {
      icon: 'local_gas_station',
      label: 'Fuel',
      emoji: '⛽',
      bgClass: 'bg-amber-50',
      textClass: 'text-amber-700',
      borderClass: 'border-amber-200',
      badgeBgClass: 'bg-amber-50',
      badgeTextClass: 'text-amber-800',
      hex: '#d97706'
    };
  }

  // 15. Default Fallback Location Mark
  return {
    icon: 'location_on',
    label: 'Location',
    emoji: '📍',
    bgClass: 'bg-sky-50',
    textClass: 'text-sky-600',
    borderClass: 'border-sky-200',
    badgeBgClass: 'bg-slate-50',
    badgeTextClass: 'text-slate-700',
    hex: '#0284c7'
  };
}

/**
 * Dynamically resolves an authentic, high-quality image URL for any place.
 * Returns the place's explicit `imageUrl` if provided, or deterministically
 * selects a curated high-resolution photo based on brand name or place category.
 */
export function getDynamicPlaceImage(place: {
  name: string;
  category: Category;
  imageUrl?: string;
  tags?: string[];
}): string | undefined {
  // If explicitly assigned, respect it
  if (place.imageUrl && place.imageUrl.trim().length > 10) {
    return place.imageUrl;
  }

  const name = (place.name || '').toLowerCase();
  const seed = `${place.name}_${place.category}`;
  const hash = hashString(seed);

  // 1. Brand match: Starbucks
  if (name.includes('starbucks')) {
    const list = CURATED_IMAGE_COLLECTIONS.starbucks;
    return list[hash % list.length];
  }

  // 2. Category match or keyword match
  if (name.includes('cafe') || name.includes('coffee') || name.includes('bakery') || place.category === 'cafe') {
    const list = CURATED_IMAGE_COLLECTIONS.cafe;
    return list[hash % list.length];
  }

  if (name.includes('supermarket') || name.includes('grocer') || name.includes('mart') || name.includes('shop') || name.includes('store') || place.category === 'supermarket') {
    const list = CURATED_IMAGE_COLLECTIONS.supermarket;
    return list[hash % list.length];
  }

  if (name.includes('hospital') || name.includes('clinic') || name.includes('aiims') || name.includes('manipal') || place.category === 'hospital') {
    const list = CURATED_IMAGE_COLLECTIONS.hospital;
    return list[hash % list.length];
  }

  if (name.includes('pharmacy') || name.includes('chemist') || place.category === 'pharmacy') {
    const list = CURATED_IMAGE_COLLECTIONS.pharmacy;
    return list[hash % list.length];
  }

  if (name.includes('raj mahal') || name.includes('palace') || name.includes('fort') || name.includes('caves') || place.category === 'historic') {
    const list = CURATED_IMAGE_COLLECTIONS.historic;
    return list[hash % list.length];
  }

  if (name.includes('museum') || name.includes('gallery') || place.category === 'museum') {
    const list = CURATED_IMAGE_COLLECTIONS.museum;
    return list[hash % list.length];
  }

  if (name.includes('beach') || name.includes('sea') || place.category === 'beach') {
    const list = CURATED_IMAGE_COLLECTIONS.beach;
    return list[hash % list.length];
  }

  if (place.category === 'attraction' || name.includes('attraction')) {
    const list = CURATED_IMAGE_COLLECTIONS.attraction;
    return list[hash % list.length];
  }

  if (place.category === 'atm' || name.includes('atm') || name.includes('bank')) {
    const list = CURATED_IMAGE_COLLECTIONS.atm;
    return list[hash % list.length];
  }

  if (place.category === 'transit_stop' || name.includes('station') || name.includes('bus') || name.includes('train')) {
    const list = CURATED_IMAGE_COLLECTIONS.transit_stop;
    return list[hash % list.length];
  }

  if (place.category === 'police' || name.includes('police')) {
    const list = CURATED_IMAGE_COLLECTIONS.police;
    return list[hash % list.length];
  }

  if (place.category === 'restaurant') {
    const list = CURATED_IMAGE_COLLECTIONS.restaurant;
    return list[hash % list.length];
  }

  if (place.category === 'hotel') {
    const list = CURATED_IMAGE_COLLECTIONS.hotel;
    return list[hash % list.length];
  }

  if (place.category === 'fuel') {
    const list = CURATED_IMAGE_COLLECTIONS.fuel;
    return list[hash % list.length];
  }

  return undefined;
}
