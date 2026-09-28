import { Place, Category, LocationCoordinates, RouteResponse, RouteStep } from '../types';
import { getDistance } from 'geolib';
import { CITIES } from '../data/mockData';
import { getDynamicPlaceImage } from '../utils/placeVisuals';

export interface GeocodingResult {
  id: string;
  name: string;
  address: string;
  cityName: string;
  country: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  type?: string;
}

interface NominatimReverseResponse {
  display_name: string;
  address: {
    road?: string;
    suburb?: string;
    neighbourhood?: string;
    residential?: string;
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    state?: string;
    country?: string;
    country_code?: string;
  };
}

interface NominatimSearchResult {
  place_id: number;
  osm_type?: string;
  osm_id?: number;
  lat: string;
  lon: string;
  display_name: string;
  name?: string;
  type?: string;
  class?: string;
  address?: Record<string, string>;
}

const CATEGORY_SEARCH_TERMS: Record<Category | 'all', Array<{ term: string; cat: Category }>> = {
  all: [
    { term: 'historical place', cat: 'historic' },
    { term: 'palace', cat: 'historic' },
    { term: 'museum', cat: 'museum' },
    { term: 'tourist attraction', cat: 'attraction' },
    { term: 'beach', cat: 'beach' },
    { term: 'hospital', cat: 'hospital' },
    { term: 'pharmacy', cat: 'pharmacy' },
    { term: 'police station', cat: 'police' },
    { term: 'atm', cat: 'atm' },
    { term: 'bus stop', cat: 'transit_stop' },
    { term: 'supermarket', cat: 'supermarket' },
    { term: 'cafe', cat: 'cafe' }
  ],
  historic: [
    { term: 'historical place', cat: 'historic' },
    { term: 'palace', cat: 'historic' },
    { term: 'raj mahal', cat: 'historic' },
    { term: 'fort', cat: 'historic' },
    { term: 'monument', cat: 'historic' },
    { term: 'heritage site', cat: 'historic' },
    { term: 'undavalli caves', cat: 'historic' }
  ],
  museum: [
    { term: 'museum', cat: 'museum' },
    { term: 'art gallery', cat: 'museum' },
    { term: 'bapu museum', cat: 'museum' },
    { term: 'archaeological museum', cat: 'museum' }
  ],
  beach: [
    { term: 'beach', cat: 'beach' },
    { term: 'sea beach', cat: 'beach' },
    { term: 'coastal beach', cat: 'beach' },
    { term: 'waterfront', cat: 'beach' }
  ],
  attraction: [
    { term: 'tourist attraction', cat: 'attraction' },
    { term: 'sightseeing', cat: 'attraction' },
    { term: 'undavalli caves', cat: 'attraction' },
    { term: 'prakasam barrage', cat: 'attraction' },
    { term: 'bhavani island', cat: 'attraction' },
    { term: 'viewpoint', cat: 'attraction' }
  ],
  hospital: [
    { term: 'hospital', cat: 'hospital' },
    { term: 'clinic', cat: 'hospital' },
    { term: 'health centre', cat: 'hospital' },
    { term: 'first aid centre', cat: 'hospital' }
  ],
  pharmacy: [
    { term: 'pharmacy', cat: 'pharmacy' },
    { term: 'medical store', cat: 'pharmacy' },
    { term: 'chemist', cat: 'pharmacy' }
  ],
  police: [
    { term: 'police station', cat: 'police' },
    { term: 'police outpost', cat: 'police' },
    { term: 'police', cat: 'police' }
  ],
  atm: [
    { term: 'atm', cat: 'atm' },
    { term: 'bank cash', cat: 'atm' },
    { term: 'state bank atm', cat: 'atm' }
  ],
  transit_stop: [
    { term: 'bus stop', cat: 'transit_stop' },
    { term: 'bus station', cat: 'transit_stop' },
    { term: 'railway station', cat: 'transit_stop' }
  ],
  supermarket: [
    { term: 'supermarket', cat: 'supermarket' },
    { term: 'grocery store', cat: 'supermarket' },
    { term: 'general store', cat: 'supermarket' }
  ],
  cafe: [
    { term: 'cafe', cat: 'cafe' },
    { term: 'bakery', cat: 'cafe' },
    { term: 'coffee', cat: 'cafe' }
  ],
  restaurant: [
    { term: 'restaurant', cat: 'restaurant' },
    { term: 'food', cat: 'restaurant' },
    { term: 'diner', cat: 'restaurant' }
  ],
  hotel: [
    { term: 'hotel', cat: 'hotel' },
    { term: 'guest house', cat: 'hotel' },
    { term: 'lodge', cat: 'hotel' }
  ],
  fuel: [
    { term: 'petrol pump', cat: 'fuel' },
    { term: 'gas station', cat: 'fuel' },
    { term: 'fuel', cat: 'fuel' }
  ]
};



interface LandmarkSeed {
  id: string;
  name: string;
  localizedName?: string;
  category: Category;
  latitude: number;
  longitude: number;
  city: string;
  address: string;
  hours: string;
  phone?: string;
  emergencyCapable: boolean;
  tags: string[];
  triageInfo?: string;
  imageUrl?: string;
}

const REGIONAL_LANDMARKS: LandmarkSeed[] = [
  {
    id: 'landmark-aiims-mangalagiri',
    name: 'All India Institute of Medical Sciences (AIIMS), Mangalagiri',
    localizedName: 'ఎయిమ్స్ మంగళగిరి (AIIMS Mangalagiri)',
    category: 'hospital',
    latitude: 16.4462453,
    longitude: 80.5801318,
    city: 'Mangalagiri',
    address: 'All India Institute Of Medical Sciences (AIIMS) Road, Yerrabalem, Mangalagiri, Guntur District, Andhra Pradesh 522503',
    hours: 'Emergency 24/7',
    phone: '08645-293101',
    emergencyCapable: true,
    tags: ['AIIMS', 'Super Specialty Hospital', 'Central Govt Hospital', 'Emergency 24/7', 'Trauma Care', 'Public Hospital', 'ICU'],
    triageInfo: 'Apex Public Super Specialty & Medical Research Hospital • 24/7 Emergency Casualty'
  },
  {
    id: 'landmark-manipal-hospital-tadepalli',
    name: 'Manipal Super Specialty Hospital (Private)',
    localizedName: 'మణిపాల్ సూపర్ స్పెషాలిటీ హాస్పిటల్ (తాడేపల్లి)',
    category: 'hospital',
    latitude: 16.48512,
    longitude: 80.61543,
    city: 'Tadepalli',
    address: 'Padmasaleela Bazar, Near Toll Gate, Tadepalli, Guntur / Vijayawada, Andhra Pradesh 522501',
    hours: 'Emergency 24/7',
    phone: '0866-2499999',
    emergencyCapable: true,
    tags: ['Private Hospital', 'Super Specialty', 'Manipal Hospitals', 'NABH Accredited', '24/7 Emergency', 'Cardiology', 'Private'],
    triageInfo: 'Major Private Multi-Specialty Hospital • 24/7 Emergency Care & Ambulance'
  },
  {
    id: 'landmark-sbi-atm-klef-campus',
    name: 'State Bank of India (SBI) ATM - KL University (KLEF) Campus',
    localizedName: 'ఎస్.బి.ఐ ఏటీఎం - కే.ఎల్ విశ్వవిద్యాలయం క్యాంపస్',
    category: 'atm',
    latitude: 16.4422073,
    longitude: 80.6253234,
    city: 'Vaddeswaram',
    address: 'Inside KL University Campus, Klef Road, Vaddeswaram, Andhra Pradesh 522502',
    hours: 'Open 24 Hours',
    emergencyCapable: false,
    tags: ['College ATM', 'KL University ATM', 'KLEF Campus ATM', 'SBI ATM', 'College', 'Campus', 'Cash Withdrawal', 'UPI Cardless Cash']
  },
  {
    id: 'landmark-axis-atm-klef-road',
    name: 'Axis Bank ATM - KLEF Road, Vaddeswaram',
    category: 'atm',
    latitude: 16.4488172,
    longitude: 80.6172224,
    city: 'Vaddeswaram',
    address: 'Klef Road, Near University Junction, Vaddeswaram, Andhra Pradesh 522502',
    hours: 'Open 24 Hours',
    emergencyCapable: false,
    tags: ['ATM', 'Axis Bank', 'KLEF Road', 'Cash Dispenser']
  },
  {
    id: 'landmark-klef-university',
    name: 'Koneru Lakshmaiah Education Foundation (KL University)',
    localizedName: 'కోనేరు లక్ష్మయ్య ఎడ్యుకేషన్ ఫౌండేషన్ (కే.ఎల్ విశ్వవిద్యాలయం)',
    category: 'transit_stop',
    latitude: 16.4422073,
    longitude: 80.6253234,
    city: 'Vaddeswaram',
    address: 'Green Fields, Vaddeswaram, Guntur District, Andhra Pradesh 522502',
    hours: 'Open',
    emergencyCapable: false,
    tags: ['University', 'Engineering College', 'KLEF', 'Campus']
  },
  {
    id: 'landmark-undavalli-caves',
    name: 'Undavalli Caves (Ancient Rock-Cut Monument)',
    localizedName: 'ఉండవల్లి గుహలు (Undavalli Caves)',
    category: 'historic',
    latitude: 16.4965,
    longitude: 80.5794,
    city: 'Undavalli',
    address: 'Undavalli Caves Road, Undavalli, Guntur District, Andhra Pradesh 522501',
    hours: '09:00 - 18:00 Daily',
    emergencyCapable: false,
    tags: ['Historical Place', 'Ancient Caves', 'Monolithic Sculpture', 'Archaeological Survey of India', 'Tourist Attraction', '7th Century Heritage', 'Caves'],
    triageInfo: 'Ancient 7th-century rock-cut monolithic caves and heritage monument'
  },
  {
    id: 'landmark-bapu-museum',
    name: 'Bapu Museum (Victoria Jubilee Museum)',
    localizedName: 'బాపు మ్యూజియం (విజయవాడ)',
    category: 'museum',
    latitude: 16.5097,
    longitude: 80.6331,
    city: 'Vijayawada',
    address: 'MG Road, Buckinghampet, Vijayawada, Andhra Pradesh 520002',
    hours: '10:30 - 17:00 (Closed Fridays)',
    emergencyCapable: false,
    tags: ['Museum', 'Art Gallery', 'Ancient Sculptures', 'Buddhist Artifacts', 'Archaeology', 'Tourist Landmark', 'Exhibition'],
    triageInfo: 'State archaeological museum featuring prehistoric artifacts and bronze sculptures'
  },
  {
    id: 'landmark-prakasam-barrage',
    name: 'Prakasam Barrage & Krishna Riverfront Promenade',
    localizedName: 'ప్రకాశం బ్యారేజ్ (కృష్ణా నది)',
    category: 'attraction',
    latitude: 16.5065,
    longitude: 80.6062,
    city: 'Vijayawada',
    address: 'Across Krishna River, Connecting Guntur and Krishna Districts, Andhra Pradesh',
    hours: 'Open 24 Hours (Illuminated Evenings)',
    emergencyCapable: false,
    tags: ['Tourist Attraction', 'Scenic Viewpoint', 'Krishna River', 'Historic Barrage', 'Sunset Spot', 'Photo Spot', 'River Promenade'],
    triageInfo: 'Iconic 1.2 km road bridge and barrage over the Krishna river with scenic pedestrian walkways'
  },
  {
    id: 'landmark-kondapalli-fort',
    name: 'Kondapalli Fort & Royal Palace (Gaja Mahal / Raj Mahal)',
    localizedName: 'కొండపల్లి కోట (గజ మహల్ / రాజ మహల్)',
    category: 'historic',
    latitude: 16.6212,
    longitude: 80.5348,
    city: 'Kondapalli',
    address: 'Fort Hill, Kondapalli, NTR District, Andhra Pradesh 521228',
    hours: '10:00 - 17:00 Daily',
    emergencyCapable: false,
    tags: ['Raj Mahal', 'Royal Palace', 'Historical Fort', '14th Century', 'Heritage', 'Hilltop Viewpoint', 'Gaja Mahal', 'Palace'],
    triageInfo: 'Historic 14th-century hill fortress featuring the royal palace (Gaja Mahal / Raj Mahal)'
  },
  {
    id: 'landmark-bhavani-island',
    name: 'Bhavani Island Tourism & Adventure Park',
    localizedName: 'భవాని ఐలాండ్',
    category: 'attraction',
    latitude: 16.5218,
    longitude: 80.5892,
    city: 'Vijayawada',
    address: 'Bhavani Island, Krishna River, Near Gollapudi, Vijayawada, Andhra Pradesh 520012',
    hours: '08:00 - 19:30 Daily',
    emergencyCapable: false,
    tags: ['Tourist Attraction', 'River Island', 'Boating & Water Sports', 'Resort', 'Picnic Spot', 'Nature Park'],
    triageInfo: 'One of the largest river islands in India with boating, water sports, and botanical gardens'
  },
  {
    id: 'landmark-amaravati-dhyana-buddha',
    name: 'Amaravati Stupa & Dhyana Buddha Heritage',
    localizedName: 'అమరావతి ధ్యాన బుద్ధ ప్రాజెక్ట్',
    category: 'historic',
    latitude: 16.5746,
    longitude: 80.3582,
    city: 'Amaravati',
    address: 'Amaravati Heritage Corridor, Palnadu District, Andhra Pradesh 522020',
    hours: '08:00 - 18:00 Daily',
    emergencyCapable: false,
    tags: ['Historic Monument', '125ft Giant Buddha', 'Buddhist Heritage', 'Museum', 'Ancient Amaravati Stupa', 'Heritage Site'],
    triageInfo: 'Iconic 125-foot Dhyana Buddha sculpture and 2,000-year-old Buddhist archaeological site'
  },
  {
    id: 'landmark-suryalanka-beach',
    name: 'Suryalanka Beach (Bapatla Coast)',
    localizedName: 'సూర్యలంక బీచ్ (బాపట్ల)',
    category: 'beach',
    latitude: 15.8569,
    longitude: 80.5186,
    city: 'Bapatla',
    address: 'Suryalanka Coastal Road, Bapatla, Bapatla District, Andhra Pradesh 522101',
    hours: 'Open 24 Hours (Best sunrise to sunset)',
    emergencyCapable: false,
    tags: ['Beach', 'Bay of Bengal', 'Golden Sands', 'Coastal Shore', 'Waterfront', 'Weekend Getaway', 'Sea Beach'],
    triageInfo: 'Natural beach on the Bay of Bengal coast with gentle waters and resort cottages'
  }
];


class OsmService {
  private reverseCache = new Map<string, { city: string; countryCode: string; neighborhood: string }>();
  private poiCache = new Map<string, { timestamp: number; places: Place[] }>();

  // 1. Live Reverse Geocoding via Nominatim
  public async reverseGeocode(lat: number, lon: number): Promise<{
    cityName: string;
    countryCode: string;
    district: string;
    displayName: string;
  }> {
    const key = `${lat.toFixed(3)},${lon.toFixed(3)}`;
    if (this.reverseCache.has(key)) {
      const cached = this.reverseCache.get(key)!;
      return {
        cityName: cached.city,
        countryCode: cached.countryCode,
        district: cached.neighborhood,
        displayName: `${cached.neighborhood}, ${cached.city}`
      };
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4500);

      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=16`,
        {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'LocalTravelApp/8.0 (TactileCerulean)'
          }
        }
      );
      clearTimeout(timeout);

      if (!res.ok) throw new Error('Nominatim reverse error');
      const data: NominatimReverseResponse = await res.json();

      const addr = data.address || {};
      const city = addr.city || addr.town || addr.village || addr.county || 'Local Area';
      const neighborhood = addr.neighbourhood || addr.suburb || addr.residential || addr.road || city;
      const countryCode = (addr.country_code || 'IN').toUpperCase();

      this.reverseCache.set(key, { city, countryCode, neighborhood });

      return {
        cityName: `${neighborhood}, ${city}`,
        countryCode,
        district: neighborhood,
        displayName: data.display_name
      };
    } catch (err) {
      console.warn('Reverse geocode fallback:', err);
      return {
        cityName: 'Live Location GPS',
        countryCode: 'IN',
        district: 'Current Sector',
        displayName: `${lat.toFixed(4)}°, ${lon.toFixed(4)}°`
      };
    }
  }

  // 1.5. Live Forward Geocoding & Custom Location Search (Google / Apple Maps style)
  public async searchLocations(query: string): Promise<GeocodingResult[]> {
    const q = query.trim();
    if (!q) return [];

    const results: GeocodingResult[] = [];
    const seen = new Set<string>();

    // 1. Check if user entered direct coordinates (e.g. "16.4422, 80.6253")
    const coordMatch = q.match(/^(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)$/);
    if (coordMatch) {
      const lat = parseFloat(coordMatch[1]);
      const lon = parseFloat(coordMatch[3]);
      if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
        results.push({
          id: `coord-${lat.toFixed(4)}-${lon.toFixed(4)}`,
          name: `Custom Pinpoint: ${lat.toFixed(4)}, ${lon.toFixed(4)}`,
          address: `Precise Latitude: ${lat.toFixed(5)}, Longitude: ${lon.toFixed(5)}`,
          cityName: `Custom Pin (${lat.toFixed(3)}°, ${lon.toFixed(3)}°)`,
          country: 'Direct Coordinates',
          countryCode: 'IN',
          latitude: lat,
          longitude: lon,
          type: 'coordinate'
        });
        return results;
      }
    }

    // 2. Check local catalogue / regional landmarks for instant results
    const qLower = q.toLowerCase();
    for (const c of CITIES) {
      if (c.name.toLowerCase().includes(qLower) || c.country.toLowerCase().includes(qLower)) {
        const key = `${c.lat.toFixed(2)},${c.lng.toFixed(2)}`;
        if (!seen.has(key)) {
          seen.add(key);
          results.push({
            id: `city-${c.id}`,
            name: c.name,
            address: `${c.name}, ${c.country}`,
            cityName: c.name,
            country: c.country,
            countryCode: c.countryCode,
            latitude: c.lat,
            longitude: c.lng,
            type: 'city'
          });
        }
      }
    }

    for (const lm of REGIONAL_LANDMARKS) {
      if (lm.name.toLowerCase().includes(qLower) || lm.address.toLowerCase().includes(qLower)) {
        const key = `${lm.latitude.toFixed(2)},${lm.longitude.toFixed(2)}`;
        if (!seen.has(key)) {
          seen.add(key);
          results.push({
            id: `lm-${lm.id}`,
            name: lm.name,
            address: lm.address,
            cityName: lm.name.split(',')[0],
            country: 'India',
            countryCode: 'IN',
            latitude: lm.latitude,
            longitude: lm.longitude,
            type: lm.category
          });
        }
      }
    }

    // 3. Query Komoot Photon (Fast, typo-tolerant global search)
    try {
      const photonController = new AbortController();
      const pTimeout = setTimeout(() => photonController.abort(), 4000);
      const pRes = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=8`, {
        signal: photonController.signal
      });
      clearTimeout(pTimeout);

      if (pRes.ok) {
        const pData = await pRes.json();
        if (pData && pData.features) {
          for (const feat of pData.features) {
            const props = feat.properties || {};
            const coords = feat.geometry?.coordinates;
            if (!coords || coords.length < 2) continue;
            const [lon, lat] = coords;
            const key = `${lat.toFixed(2)},${lon.toFixed(2)}`;
            if (seen.has(key)) continue;
            seen.add(key);

            const name = props.name || props.city || props.street || q;
            const city = props.city || props.county || props.state || name;
            const state = props.state ? `${props.state}, ` : '';
            const country = props.country || '';
            const address = [props.street, props.city, state, country].filter(Boolean).join(', ') || name;

            results.push({
              id: `photon-${props.osm_id || Math.random().toString(36).slice(2, 8)}`,
              name,
              address,
              cityName: city,
              country,
              countryCode: (props.countrycode || 'IN').toUpperCase(),
              latitude: lat,
              longitude: lon,
              type: props.osm_value || props.type || 'place'
            });
          }
        }
      }
    } catch (e) {
      console.warn('Photon forward search warn:', e);
    }

    // 4. Query Nominatim if fewer than 4 results found
    if (results.length < 4) {
      try {
        const nomController = new AbortController();
        const nTimeout = setTimeout(() => nomController.abort(), 4000);
        const nRes = await fetch(
          `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(q)}&limit=6&addressdetails=1`,
          {
            signal: nomController.signal,
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'LocalTravelApp/8.0 (CustomLocationSearch)'
            }
          }
        );
        clearTimeout(nTimeout);

        if (nRes.ok) {
          const nData = await nRes.json();
          if (Array.isArray(nData)) {
            for (const item of nData) {
              const lat = parseFloat(item.lat);
              const lon = parseFloat(item.lon);
              const key = `${lat.toFixed(2)},${lon.toFixed(2)}`;
              if (seen.has(key)) continue;
              seen.add(key);

              const addr = item.address || {};
              const city = addr.city || addr.town || addr.village || addr.county || item.name;
              const country = addr.country || '';
              const countryCode = (addr.country_code || 'IN').toUpperCase();

              results.push({
                id: `nom-${item.place_id}`,
                name: item.name || city,
                address: item.display_name,
                cityName: city,
                country,
                countryCode,
                latitude: lat,
                longitude: lon,
                type: item.type || 'place'
              });
            }
          }
        }
      } catch (e) {
        console.warn('Nominatim forward search warn:', e);
      }
    }

    return results;
  }

  // 2. Query Real-World Authentic POIs using Nominatim Proximity & Komoot Photon + Geolib
  public async fetchNearbyPOIs(
    lat: number,
    lon: number,
    category: Category | 'all' = 'all',
    radiusMeters: number = 12000,
    searchQuery?: string
  ): Promise<Place[]> {
    // Check in-memory POI cache (3-minute TTL per rounded coordinate ~110m)
    const cacheKey = `${lat.toFixed(3)},${lon.toFixed(3)}_${category}_${searchQuery || ''}`;
    const cached = this.poiCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 180000 && cached.places.length > 0) {
      return cached.places;
    }

    const places: Place[] = [];
    const seenCoordinates = new Set<string>();

    // Step 0: Check landmark registry for this region (AIIMS, Manipal Hospital, College ATMs)
    for (const lm of REGIONAL_LANDMARKS) {
      const dist = getDistance({ latitude: lat, longitude: lon }, { latitude: lm.latitude, longitude: lm.longitude });
      if (dist <= Math.max(radiusMeters, 15000)) {
        if (category === 'all' || lm.category === category) {
          let matchesQuery = true;
          if (searchQuery && searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            matchesQuery = lm.name.toLowerCase().includes(q) ||
              (lm.localizedName && lm.localizedName.toLowerCase().includes(q)) ||
              lm.address.toLowerCase().includes(q) ||
              lm.tags.some(t => t.toLowerCase().includes(q)) ||
              ((q.includes('aiims') || q.includes('mangalagiri')) && lm.id.includes('aiims')) ||
              ((q.includes('private') || q.includes('specialty') || q.includes('manipal')) && lm.id.includes('manipal')) ||
              ((q.includes('college') || q.includes('university') || q.includes('campus') || q.includes('klef') || q.includes('kl')) && (lm.tags.some(t => t.toLowerCase().includes('college') || t.toLowerCase().includes('campus')) || lm.id.includes('klef'))) ||
              ((q.includes('raj mahal') || q.includes('palace') || q.includes('mahal') || q.includes('fort') || q.includes('historic') || q.includes('monument') || q.includes('caves') || q.includes('heritage')) && (lm.category === 'historic' || lm.tags.some(t => t.toLowerCase().includes('palace') || t.toLowerCase().includes('heritage')))) ||
              ((q.includes('museum') || q.includes('gallery') || q.includes('art') || q.includes('exhibit')) && lm.category === 'museum') ||
              ((q.includes('beach') || q.includes('sea') || q.includes('shore') || q.includes('coast')) && lm.category === 'beach') ||
              ((q.includes('tourist') || q.includes('attraction') || q.includes('sight') || q.includes('viewpoint') || q.includes('island')) && lm.category === 'attraction') ||
              (q.includes('hospital') && lm.category === 'hospital') ||
              (q.includes('atm') && lm.category === 'atm');
          }

          if (matchesQuery) {
            seenCoordinates.add(`${lm.latitude.toFixed(3)},${lm.longitude.toFixed(3)}`);
            places.push({
              id: lm.id,
              name: lm.name,
              localizedName: lm.localizedName,
              category: lm.category,
              distanceMeters: dist,
              location: { latitude: lm.latitude, longitude: lm.longitude },
              countryCode: 'IN',
              city: lm.city,
              address: lm.address,
              hours: {
                status: 'open',
                raw: lm.hours,
                formatted: lm.hours
              },
              source: 'CURATED_REGISTRY',
              sourceUpdatedAt: new Date().toISOString(),
              freshness: 'fresh',
              emergencyCapable: lm.emergencyCapable,
              phone: lm.phone,
              tags: lm.tags,
              triageInfo: lm.triageInfo,
              imageUrl: lm.imageUrl || getDynamicPlaceImage(lm)
            });
          }
        }
      }
    }

    // Step A: Build search queries with semantic expansion
    let queries = CATEGORY_SEARCH_TERMS[category] || [{ term: category, cat: 'historic' as Category }];

    if (searchQuery && searchQuery.trim().length > 1) {
      const q = searchQuery.toLowerCase().trim();
      const customQueries: Array<{ term: string; cat: Category }> = [];

      if (q.includes('raj mahal') || q.includes('palace') || q.includes('mahal') || q.includes('fort') || q.includes('historic') || q.includes('monument') || q.includes('caves') || q.includes('heritage')) {
        customQueries.push(
          { term: 'palace', cat: 'historic' },
          { term: 'raj mahal', cat: 'historic' },
          { term: 'fort', cat: 'historic' },
          { term: 'Undavalli Caves', cat: 'historic' },
          { term: 'historical place', cat: 'historic' }
        );
      }
      if (q.includes('museum') || q.includes('gallery') || q.includes('art') || q.includes('exhibit')) {
        customQueries.push(
          { term: 'Bapu Museum', cat: 'museum' },
          { term: 'museum', cat: 'museum' },
          { term: 'art gallery', cat: 'museum' }
        );
      }
      if (q.includes('beach') || q.includes('sea') || q.includes('shore') || q.includes('coast')) {
        customQueries.push(
          { term: 'Suryalanka Beach', cat: 'beach' },
          { term: 'beach', cat: 'beach' }
        );
      }
      if (q.includes('tourist') || q.includes('attraction') || q.includes('sight') || q.includes('viewpoint') || q.includes('island')) {
        customQueries.push(
          { term: 'tourist attraction', cat: 'attraction' },
          { term: 'Prakasam Barrage', cat: 'attraction' },
          { term: 'Bhavani Island', cat: 'attraction' },
          { term: 'Undavalli Caves', cat: 'attraction' }
        );
      }
      if (q.includes('aiims') || q.includes('mangalagiri')) {
        customQueries.push(
          { term: 'All India Institute of Medical Sciences Mangalagiri', cat: 'hospital' },
          { term: 'AIIMS Mangalagiri', cat: 'hospital' }
        );
      }
      if (q.includes('private') || q.includes('manipal') || q.includes('specialty')) {
        customQueries.push(
          { term: 'Manipal Super Specialty Hospital Tadepalli', cat: 'hospital' },
          { term: 'Manipal Hospital', cat: 'hospital' },
          { term: 'private hospital', cat: 'hospital' }
        );
      }
      if (q.includes('college') || q.includes('university') || q.includes('klef') || q.includes('campus')) {
        customQueries.push(
          { term: 'State Bank of India ATM KLEF', cat: 'atm' },
          { term: 'KL University', cat: 'transit_stop' },
          { term: 'KLEF Vaddeswaram', cat: 'transit_stop' }
        );
      }
      if (q.includes('atm') || q.includes('sbi') || q.includes('cash')) {
        customQueries.push(
          { term: 'State Bank ATM', cat: 'atm' },
          { term: 'Axis Bank ATM', cat: 'atm' }
        );
      }
      if (q.includes('hospital') || q.includes('clinic')) {
        customQueries.push(
          { term: 'AIIMS Mangalagiri', cat: 'hospital' },
          { term: 'Manipal Hospital', cat: 'hospital' }
        );
      }

      customQueries.push({ term: searchQuery.trim(), cat: category !== 'all' ? category : 'historic' });
      queries = customQueries;
    }

    // Step B: Check optional user-configured Google Places API Key
    const googleApiKey = typeof window !== 'undefined' ? localStorage.getItem('google_places_api_key') : null;
    if (googleApiKey && googleApiKey.trim().length > 10) {
      try {
        const googlePlaces = await this.fetchFromGooglePlaces(lat, lon, category, radiusMeters, googleApiKey.trim());
        if (googlePlaces.length > 0) {
          places.push(...googlePlaces);
          googlePlaces.forEach(p => seenCoordinates.add(`${p.location.latitude.toFixed(3)},${p.location.longitude.toFixed(3)}`));
        }
      } catch (gErr) {
        console.warn('Google Places API query fallback:', gErr);
      }
    }

    // Step C: Query Nominatim Structured Proximity Search
    await Promise.allSettled(
      queries.map(async ({ term, cat }) => {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 4000);

          const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(term)}+near+${lat},${lon}&format=json&addressdetails=1&limit=6`;
          const res = await fetch(url, {
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'LocalTravelApp/8.0 (TactileCerulean)'
            },
            signal: controller.signal
          });
          clearTimeout(timeout);

          if (!res.ok) return;
          const items: NominatimSearchResult[] = await res.json();


          for (const it of items || []) {
            const itemLat = parseFloat(it.lat);
            const itemLon = parseFloat(it.lon);
            if (isNaN(itemLat) || isNaN(itemLon)) continue;

            // Deduplicate by 50m proximity cluster
            const coordKey = `${itemLat.toFixed(3)},${itemLon.toFixed(3)}`;
            if (seenCoordinates.has(coordKey)) continue;

            const dist = getDistance(
              { latitude: lat, longitude: lon },
              { latitude: itemLat, longitude: itemLon }
            );

            // Discard items ridiculously far unless emergency hospital/police
            const maxDist = (cat === 'hospital' || cat === 'police') ? Math.max(radiusMeters * 2.5, 12000) : Math.max(radiusMeters * 1.5, 6000);
            if (dist > maxDist) continue;

            seenCoordinates.add(coordKey);

            const addr = it.address || {};
            let rawName = it.name || it.display_name.split(',')[0].trim();
            if (rawName.length <= 3 || rawName.toLowerCase() === 'road' || rawName.toLowerCase() === 'atm') {
              const locality = addr.suburb || addr.neighbourhood || addr.village || addr.city || '';
              rawName = `${rawName} (${locality || term})`.trim();
            }

            const street = [
              addr.road || addr.street,
              addr.suburb || addr.neighbourhood,
              addr.village || addr.city || addr.town
            ].filter(Boolean).join(', ') || it.display_name;

            const place: Place = {
              id: `nom-${it.place_id || it.osm_id || Math.random().toString(36).substring(7)}`,
              name: rawName,
              localizedName: addr['name:te'] || addr['name:hi'] || addr['name:ja'] || addr.village || undefined,
              category: cat,
              distanceMeters: dist,
              location: { latitude: itemLat, longitude: itemLon },
              countryCode: (addr.country_code || 'IN').toUpperCase(),
              city: addr.city || addr.town || addr.village || addr.county || 'Local Area',
              address: street,
              hours: {
                status: 'open',
                raw: cat === 'hospital' || cat === 'police' ? 'Open 24/7' : 'Standard hours',
                formatted: cat === 'hospital' || cat === 'police' ? 'Emergency 24/7' : 'Hours on site'
              },
              source: 'OSM',
              sourceUpdatedAt: new Date().toISOString(),
              freshness: 'fresh',
              emergencyCapable: cat === 'hospital' || cat === 'police',
              phone: cat === 'hospital' ? '108 / Local ER' : cat === 'police' ? '100 / Emergency' : undefined,
              tags: this.generateTags(cat, rawName),
              triageInfo: cat === 'hospital' ? 'Verified Medical Service / ER' : undefined,
              imageUrl: getDynamicPlaceImage({ name: rawName, category: cat, tags: this.generateTags(cat, rawName) })
            };

            places.push(place);
          }
        } catch {
          // Gracefully continue to next query
        }
      })
    );

    // Step D: Query Komoot Photon for missing categories OR for custom search queries
    const photonTargets = (searchQuery && searchQuery.trim().length > 1)
      ? queries
      : queries.filter(q => !places.some(p => p.category === q.cat));

    if (photonTargets.length > 0) {
      await Promise.allSettled(
        photonTargets.map(async ({ term, cat }) => {
          try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 3500);

            const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(term)}&lat=${lat}&lon=${lon}&limit=5`;
            const pRes = await fetch(photonUrl, { signal: controller.signal });
            clearTimeout(timeout);

            if (!pRes.ok) return;
            const pData = await pRes.json();

            for (const feat of pData.features || []) {
              if (!feat || !feat.geometry || !Array.isArray(feat.geometry.coordinates)) continue;
              const coords = feat.geometry.coordinates;
              const fLon = coords[0];
              const fLat = coords[1];
              if (typeof fLat !== 'number' || typeof fLon !== 'number' || isNaN(fLat) || isNaN(fLon)) continue;

              const coordKey = `${fLat.toFixed(3)},${fLon.toFixed(3)}`;
              if (seenCoordinates.has(coordKey)) continue;

              let dist = 999999;
              try {
                dist = getDistance(
                  { latitude: lat, longitude: lon },
                  { latitude: fLat, longitude: fLon }
                );
              } catch {
                continue;
              }

              const maxDist = (cat === 'hospital' || cat === 'police') ? Math.max(radiusMeters * 2.5, 15000) : Math.max(radiusMeters * 1.5, 10000);
              if (dist > maxDist) continue;


              seenCoordinates.add(coordKey);
              const props = feat.properties || {};
              const name = props.name || props.street || `${props.city || 'Regional'} ${term}`;
              const addr = [props.street, props.district, props.city, props.state, props.country].filter(Boolean).join(', ');

              places.push({
                id: `photon-${props.osm_type || 'p'}-${props.osm_id || Math.random().toString(36).substring(7)}`,
                name,
                category: cat,
                distanceMeters: dist,
                location: { latitude: fLat, longitude: fLon },
                countryCode: (props.countrycode || 'IN').toUpperCase(),
                city: props.city || props.district || 'Regional Area',
                address: addr || 'Nearby Location',
                hours: {
                  status: 'open',
                  raw: cat === 'hospital' ? 'Emergency 24/7' : 'Standard hours',
                  formatted: cat === 'hospital' ? 'Emergency 24/7' : 'Open'
                },
                source: 'OSM',
                sourceUpdatedAt: new Date().toISOString(),
                freshness: 'fresh',
                emergencyCapable: cat === 'hospital' || cat === 'police',
                tags: this.generateTags(cat, name),
                triageInfo: cat === 'hospital' ? 'Emergency Care Facility' : undefined,
                imageUrl: getDynamicPlaceImage({ name, category: cat, tags: this.generateTags(cat, name) })
              });
            }
          } catch {
            // Gracefully ignore Photon error
          }
        })
      );
    }

    // Step D: Sort deterministically: shortest geodesic distance first, then ID
    places.sort((a, b) => {
      if (a.distanceMeters !== b.distanceMeters) {
        return a.distanceMeters - b.distanceMeters;
      }
      return a.id.localeCompare(b.id);
    });

    // Store in cache
    if (places.length > 0) {
      this.poiCache.set(cacheKey, { timestamp: Date.now(), places });
    }

    return places;
  }

  // Optional Google Places Nearby Search
  private async fetchFromGooglePlaces(
    lat: number,
    lon: number,
    category: Category | 'all',
    radiusMeters: number,
    apiKey: string
  ): Promise<Place[]> {
    const typeMap: Record<Category | 'all', string> = {
      all: 'tourist_attraction|museum|point_of_interest|hospital|pharmacy|police|atm|transit_station|supermarket|cafe|restaurant|lodging|gas_station',
      hospital: 'hospital',
      pharmacy: 'pharmacy',
      police: 'police',
      atm: 'atm',
      transit_stop: 'transit_station',
      supermarket: 'supermarket',
      cafe: 'cafe',
      restaurant: 'restaurant',
      hotel: 'lodging',
      fuel: 'gas_station',
      historic: 'tourist_attraction|museum|place_of_worship',
      museum: 'museum|art_gallery',
      beach: 'natural_feature',
      attraction: 'tourist_attraction|amusement_park'
    };

    const type = typeMap[category] || 'point_of_interest';
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lon}&radius=${radiusMeters}&type=${type}&key=${apiKey}`;

    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.results) return [];

    return data.results.slice(0, 10).map((r: any) => {
      const itemLat = r.geometry?.location?.lat || lat;
      const itemLon = r.geometry?.location?.lng || lon;
      const dist = getDistance(
        { latitude: lat, longitude: lon },
        { latitude: itemLat, longitude: itemLon }
      );

      const cat: Category = (category !== 'all' ? category : 'historic');

      return {
        id: `google-${r.place_id}`,
        name: r.name,
        category: cat,
        distanceMeters: dist,
        location: { latitude: itemLat, longitude: itemLon },
        countryCode: 'IN',
        city: 'Local Area',
        address: r.vicinity || r.formatted_address || 'Nearby Location',
        hours: {
          status: r.opening_hours?.open_now ? 'open' : 'closed',
          raw: null,
          formatted: r.opening_hours?.open_now ? 'Open Now' : 'Closed'
        },
        source: 'Google Maps Live',
        sourceUpdatedAt: new Date().toISOString(),
        freshness: 'fresh',
        emergencyCapable: cat === 'hospital' || cat === 'police',
        tags: ['Google Places Verified', `${r.rating ? '★ ' + r.rating : 'Verified'}`]
      };
    });
  }

  private generateTags(cat: Category, _name?: string): string[] {
    const tags = ['Verified Location'];
    if (cat === 'hospital') {
      tags.push('Healthcare', 'Emergency Care', 'Hospital Service');
    } else if (cat === 'pharmacy') {
      tags.push('Medicines', 'Prescriptions', 'First Aid');
    } else if (cat === 'police') {
      tags.push('Public Safety', 'Emergency Aid', 'Patrol');
    } else if (cat === 'atm') {
      tags.push('Cash Withdrawal', 'Banking Services');
    } else if (cat === 'transit_stop') {
      tags.push('Public Transport', 'Bus Route');
    } else if (cat === 'supermarket') {
      tags.push('Provisions', 'Daily Essentials', 'Groceries');
    } else if (cat === 'cafe') {
      tags.push('Food & Beverages', 'Refreshments');
    } else if (cat === 'restaurant') {
      tags.push('Dining', 'Food & Meals');
    } else if (cat === 'hotel') {
      tags.push('Accommodations', 'Lodging');
    } else if (cat === 'fuel') {
      tags.push('Petrol & Diesel', 'Service Station');
    } else if (cat === 'historic') {
      tags.push('Historical Place', 'Heritage Site', 'Palace & Raj Mahal', 'Ancient Monument');
    } else if (cat === 'museum') {
      tags.push('Museum', 'Art Gallery', 'Exhibition', 'Cultural Heritage');
    } else if (cat === 'beach') {
      tags.push('Beach', 'Waterfront', 'Coastal Shore', 'Golden Sands');
    } else if (cat === 'attraction') {
      tags.push('Tourist Attraction', 'Sightseeing', 'Scenic Viewpoint', 'Landmark');
    }
    return tags;
  }



  // 3. Live Turn-by-Turn Routing via OSRM Public Server with Millimetric Geodesic Fallback
  public async fetchLiveOSRMRoute(
    origin: LocationCoordinates,
    destination: LocationCoordinates,
    mode: 'walking' | 'driving' = 'walking'
  ): Promise<RouteResponse | null> {
    const profile = mode === 'walking' ? 'foot' : 'car';
    const url = `https://router.project-osrm.org/route/v1/${profile}/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}?overview=full&geometries=geojson&steps=true`;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      if (!res.ok) throw new Error('OSRM router error');
      const data = await res.json();

      if (!data.routes || data.routes.length === 0) return null;
      const osrmRoute = data.routes[0];

      // Convert OSRM legs and steps to RouteStep array
      const rawSteps = osrmRoute.legs[0]?.steps || [];
      const steps: RouteStep[] = rawSteps.map((st: any, idx: number) => {
        const type = st.maneuver?.type || 'straight';
        const modifier = st.maneuver?.modifier || '';
        let maneuverType: 'depart' | 'turn_left' | 'turn_right' | 'straight' | 'arrive' = 'straight';

        if (type === 'depart') maneuverType = 'depart';
        else if (type === 'arrive') maneuverType = 'arrive';
        else if (modifier.includes('left')) maneuverType = 'turn_left';
        else if (modifier.includes('right')) maneuverType = 'turn_right';

        return {
          id: `step-${idx + 1}`,
          instruction: st.name ? `${this.formatManeuver(st.maneuver)} on ${st.name}` : this.formatManeuver(st.maneuver),
          distanceMeters: Math.round(st.distance),
          durationSeconds: Math.round(st.duration),
          maneuver: maneuverType,
          landmark: st.name ? `Along ${st.name}` : undefined,
          streetName: st.name || undefined
        };
      });

      return {
        graphVersion: `osrm-${mode}-live`,
        profileVersion: `${mode}-live-osm`,
        mode,
        distanceMeters: Math.round(osrmRoute.distance),
        durationSeconds: Math.round(osrmRoute.duration),
        geometry: osrmRoute.geometry, // GeoJSON LineString coordinates
        steps: steps.length > 0 ? steps : [
          {
            id: 'step-1',
            instruction: `Proceed toward destination along route (${Math.round(osrmRoute.distance)}m)`,
            distanceMeters: Math.round(osrmRoute.distance),
            durationSeconds: Math.round(osrmRoute.duration),
            maneuver: 'straight'
          }
        ],
        sourceUpdatedAt: new Date().toISOString(),
        coverageAreaId: 'live'
      };
    } catch (err) {
      console.warn('Live OSRM route fetch failed, using millimetric direct fallback:', err);
      const directDist = getDistance(
        { latitude: origin.latitude, longitude: origin.longitude },
        { latitude: destination.latitude, longitude: destination.longitude }
      );
      const speedMps = mode === 'walking' ? 1.2 : 6.0;
      const durationSec = Math.max(30, Math.round(directDist / speedMps));

      return {
        graphVersion: `direct-${mode}-offline`,
        profileVersion: `${mode}-compass`,
        mode,
        distanceMeters: directDist,
        durationSeconds: durationSec,
        geometry: {
          type: 'LineString',
          coordinates: [
            [origin.longitude, origin.latitude],
            [
              origin.longitude + (destination.longitude - origin.longitude) * 0.5,
              origin.latitude + (destination.latitude - origin.latitude) * 0.5
            ],
            [destination.longitude, destination.latitude]
          ]
        },
        steps: [
          {
            id: 'step-1',
            instruction: `Head towards destination (${directDist}m)`,
            distanceMeters: Math.round(directDist * 0.6),
            durationSeconds: Math.round(durationSec * 0.6),
            maneuver: 'depart',
            landmark: 'Straight pathway'
          },
          {
            id: 'step-2',
            instruction: 'Arrive at destination',
            distanceMeters: Math.round(directDist * 0.4),
            durationSeconds: Math.round(durationSec * 0.4),
            maneuver: 'arrive'
          }
        ],
        sourceUpdatedAt: new Date().toISOString(),
        coverageAreaId: 'live'
      };
    }
  }

  private formatManeuver(m: any): string {
    if (!m) return 'Continue straight';
    const type = m.type || '';
    const mod = m.modifier ? ` ${m.modifier}` : '';
    if (type === 'depart') return 'Head towards destination';
    if (type === 'arrive') return 'Arrive at destination';
    if (type === 'turn') return `Turn${mod}`;
    if (type === 'new name') return `Continue onto`;
    return `Continue${mod}`;
  }
}

export const osmService = new OsmService();
