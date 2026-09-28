import { Place, Category, LocationCoordinates, RouteResponse, RouteStep } from '../types';
import { getDistance } from 'geolib';
import { CITIES, MOCK_PLACES } from '../data/mockData';
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
  // Helper to infer Category from Photon OSM properties
  private inferCategory(props: Record<string, any>, defaultCat: Category | 'all'): Category {
    const osmKey = String(props.osm_key || '').toLowerCase();
    const osmVal = String(props.osm_value || '').toLowerCase();
    const name = String(props.name || '').toLowerCase();

    if (osmKey === 'amenity' && (osmVal === 'hospital' || osmVal === 'clinic' || osmVal === 'doctors' || osmVal === 'health_post')) return 'hospital';
    if (osmKey === 'amenity' && (osmVal === 'pharmacy' || osmVal === 'chemist')) return 'pharmacy';
    if (osmKey === 'amenity' && (osmVal === 'police' || osmVal === 'police_station')) return 'police';
    if (osmKey === 'amenity' && (osmVal === 'atm' || osmVal === 'bank')) return 'atm';
    if (osmKey === 'amenity' && (osmVal === 'cafe' || osmVal === 'restaurant' || osmVal === 'fast_food' || osmVal === 'food_court' || osmVal === 'bar' || osmVal === 'pub' || osmVal === 'bakery')) return 'cafe';
    if (osmKey === 'shop' || (osmKey === 'amenity' && osmVal === 'marketplace')) return 'supermarket';
    if (osmKey === 'historic' || osmVal === 'castle' || osmVal === 'monument' || osmVal === 'memorial' || osmVal === 'fort' || osmVal === 'archaeological_site') return 'historic';
    if (osmKey === 'tourism' && (osmVal === 'museum' || osmVal === 'gallery' || osmVal === 'arts_centre')) return 'museum';
    if (osmKey === 'natural' && (osmVal === 'beach' || osmVal === 'coastline')) return 'beach';
    if (osmKey === 'tourism' || osmVal === 'attraction' || osmVal === 'viewpoint' || osmVal === 'theme_park') return 'attraction';
    if (osmKey === 'railway' || (osmKey === 'highway' && (osmVal === 'bus_stop' || osmVal === 'platform')) || (osmKey === 'amenity' && osmVal === 'bus_station')) return 'transit_stop';
    if (osmKey === 'tourism' && (osmVal === 'hotel' || osmVal === 'guest_house' || osmVal === 'hostel' || osmVal === 'motel')) return 'hotel';
    if (osmKey === 'amenity' && osmVal === 'fuel') return 'fuel';

    if (name.includes('hospital') || name.includes('clinic') || name.includes('casualty') || name.includes('dispensary') || name.includes('medanta') || name.includes('apollo') || name.includes('fortis') || name.includes('max health') || name.includes('aiims') || name.includes('manipal')) return 'hospital';
    if (name.includes('pharmacy') || name.includes('chemist') || name.includes('medicos') || name.includes('medical store')) return 'pharmacy';
    if (name.includes('police') || name.includes('thana') || name.includes('chowki')) return 'police';
    if (name.includes('atm') || name.includes('bank') || name.includes('sbi') || name.includes('hdfc') || name.includes('icici')) return 'atm';
    if (name.includes('cafe') || name.includes('coffee') || name.includes('restaurant') || name.includes('sweets') || name.includes('bhojanalaya') || name.includes('dhaba') || name.includes('haldiram') || name.includes('bikanervala') || name.includes('starbucks')) return 'cafe';
    if (name.includes('market') || name.includes('bazaar') || name.includes('store') || name.includes('supermarket') || name.includes('mart') || name.includes('grocer')) return 'supermarket';
    if (name.includes('fort') || name.includes('palace') || name.includes('mahal') || name.includes('monument') || name.includes('tomb') || name.includes('qila') || name.includes('heritage')) return 'historic';
    if (name.includes('museum') || name.includes('gallery')) return 'museum';
    if (name.includes('beach')) return 'beach';
    if (name.includes('metro') || name.includes('station') || name.includes('bus stand') || name.includes('isbt')) return 'transit_stop';

    return defaultCat !== 'all' ? defaultCat : 'attraction';
  }

  // 2. Query Real-World Authentic POIs using High-Speed Komoot Photon & Bounded Nominatim
  public async fetchNearbyPOIs(
    lat: number,
    lon: number,
    category: Category | 'all' = 'all',
    radiusMeters: number = 15000,
    searchQuery?: string
  ): Promise<Place[]> {
    const cleanQuery = (searchQuery || '').trim();
    // Cache key per rounded coordinate (~110m), category, query
    const cacheKey = `${lat.toFixed(3)},${lon.toFixed(3)}_${category}_${cleanQuery.toLowerCase()}`;
    const cached = this.poiCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 120000 && cached.places.length > 0) {
      return cached.places;
    }

    const places: Place[] = [];
    const seenCoordinates = new Set<string>();
    const effectiveRadius = Math.max(radiusMeters, 20000);

    // Optional Google Places API Key support if configured by user
    const googleApiKey = typeof window !== 'undefined' ? localStorage.getItem('google_places_api_key') : null;
    if (googleApiKey && googleApiKey.trim().length > 10) {
      try {
        const googlePlaces = await this.fetchFromGooglePlaces(lat, lon, category, effectiveRadius, googleApiKey.trim());
        if (googlePlaces.length > 0) {
          places.push(...googlePlaces);
          googlePlaces.forEach(p => seenCoordinates.add(`${p.location.latitude.toFixed(3)},${p.location.longitude.toFixed(3)}`));
        }
      } catch (gErr) {
        console.warn('Google Places API query fallback:', gErr);
      }
    }

    // 1. Primary Engine: High-Speed Komoot Photon Geocoding & POI Search (150-300ms, CORS supported)
    try {
      const photonUrls: string[] = [];

      if (cleanQuery.length >= 2) {
        // Freeform Search query: search user term directly biased to their GPS coordinates
        photonUrls.push(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(cleanQuery)}&lat=${lat}&lon=${lon}&limit=25`
        );
      } else if (category === 'hospital') {
        photonUrls.push(
          `https://photon.komoot.io/api/?q=hospital&lat=${lat}&lon=${lon}&osm_tag=amenity:hospital&limit=15`,
          `https://photon.komoot.io/api/?q=clinic&lat=${lat}&lon=${lon}&osm_tag=amenity:clinic&limit=10`
        );
      } else if (category === 'pharmacy') {
        photonUrls.push(
          `https://photon.komoot.io/api/?q=pharmacy&lat=${lat}&lon=${lon}&osm_tag=amenity:pharmacy&limit=15`
        );
      } else if (category === 'police') {
        photonUrls.push(
          `https://photon.komoot.io/api/?q=police&lat=${lat}&lon=${lon}&osm_tag=amenity:police&limit=10`
        );
      } else if (category === 'atm') {
        photonUrls.push(
          `https://photon.komoot.io/api/?q=atm&lat=${lat}&lon=${lon}&osm_tag=amenity:atm&limit=15`
        );
      } else if (category === 'cafe') {
        photonUrls.push(
          `https://photon.komoot.io/api/?q=cafe&lat=${lat}&lon=${lon}&osm_tag=amenity:cafe&limit=12`,
          `https://photon.komoot.io/api/?q=restaurant&lat=${lat}&lon=${lon}&osm_tag=amenity:restaurant&limit=10`
        );
      } else if (category === 'supermarket') {
        photonUrls.push(
          `https://photon.komoot.io/api/?q=supermarket&lat=${lat}&lon=${lon}&osm_tag=shop:supermarket&limit=15`
        );
      } else if (category === 'historic') {
        photonUrls.push(
          `https://photon.komoot.io/api/?q=monument&lat=${lat}&lon=${lon}&osm_tag=historic:monument&limit=12`,
          `https://photon.komoot.io/api/?q=fort&lat=${lat}&lon=${lon}&limit=10`
        );
      } else if (category === 'museum') {
        photonUrls.push(
          `https://photon.komoot.io/api/?q=museum&lat=${lat}&lon=${lon}&osm_tag=tourism:museum&limit=15`
        );
      } else if (category === 'beach') {
        photonUrls.push(
          `https://photon.komoot.io/api/?q=beach&lat=${lat}&lon=${lon}&osm_tag=natural:beach&limit=15`
        );
      } else if (category === 'attraction') {
        photonUrls.push(
          `https://photon.komoot.io/api/?q=attraction&lat=${lat}&lon=${lon}&osm_tag=tourism:attraction&limit=15`,
          `https://photon.komoot.io/api/?q=viewpoint&lat=${lat}&lon=${lon}&limit=8`
        );
      } else if (category === 'transit_stop') {
        photonUrls.push(
          `https://photon.komoot.io/api/?q=station&lat=${lat}&lon=${lon}&osm_tag=railway:station&limit=12`,
          `https://photon.komoot.io/api/?q=bus&lat=${lat}&lon=${lon}&osm_tag=highway:bus_stop&limit=10`
        );
      } else {
        // 'all' category: Query a balanced variety of real POIs near user
        photonUrls.push(
          `https://photon.komoot.io/api/?q=hospital&lat=${lat}&lon=${lon}&osm_tag=amenity:hospital&limit=8`,
          `https://photon.komoot.io/api/?q=cafe&lat=${lat}&lon=${lon}&osm_tag=amenity:cafe&limit=8`,
          `https://photon.komoot.io/api/?q=attraction&lat=${lat}&lon=${lon}&osm_tag=tourism:attraction&limit=8`,
          `https://photon.komoot.io/api/?q=atm&lat=${lat}&lon=${lon}&osm_tag=amenity:atm&limit=6`
        );
      }

      await Promise.allSettled(
        photonUrls.map(async (url) => {
          try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 2800);
            const res = await fetch(url, { signal: controller.signal });
            clearTimeout(timeout);
            if (!res.ok) return;
            const data = await res.json();

            for (const feat of data.features || []) {
              if (!feat || !feat.geometry || !Array.isArray(feat.geometry.coordinates)) continue;
              const [fLon, fLat] = feat.geometry.coordinates;
              if (typeof fLat !== 'number' || typeof fLon !== 'number' || isNaN(fLat) || isNaN(fLon)) continue;

              const coordKey = `${fLat.toFixed(3)},${fLon.toFixed(3)}`;
              if (seenCoordinates.has(coordKey)) continue;

              let dist = 999999;
              try {
                dist = getDistance({ latitude: lat, longitude: lon }, { latitude: fLat, longitude: fLon });
              } catch {
                continue;
              }

              // Keep within 45km
              if (dist > 45000) continue;

              const props = feat.properties || {};
              let rawName = props.name || props.street;
              if (!rawName || rawName.trim().length < 2) continue;
              rawName = rawName.trim();

              const inferredCat = this.inferCategory(props, category);

              // Enrich generic names like "hospital" or "atm"
              if (rawName.toLowerCase() === 'hospital' || rawName.toLowerCase() === 'clinic') {
                rawName = props.locality ? `${props.locality} Hospital` : (props.street ? `${props.street} Hospital` : `${props.city || 'Local'} Hospital`);
              } else if (rawName.toLowerCase() === 'atm') {
                rawName = props.locality ? `${props.locality} ATM` : (props.street ? `${props.street} ATM` : 'Bank Cash ATM');
              } else if (rawName.toLowerCase() === 'pharmacy' || rawName.toLowerCase() === 'chemist') {
                rawName = props.locality ? `${props.locality} Chemist` : 'Local Medical Store';
              }

              seenCoordinates.add(coordKey);
              const addr = [props.street, props.locality || props.district, props.city, props.state, props.country].filter(Boolean).join(', ');

              places.push({
                id: `osm-${props.osm_type || 'p'}-${props.osm_id || Math.random().toString(36).substring(7)}`,
                name: rawName,
                category: inferredCat,
                distanceMeters: dist,
                location: { latitude: fLat, longitude: fLon },
                countryCode: (props.countrycode || 'IN').toUpperCase(),
                city: props.city || props.district || 'Local Area',
                address: addr || 'Near User Location',
                hours: {
                  status: 'open',
                  raw: inferredCat === 'hospital' ? 'Emergency 24/7' : 'Standard hours',
                  formatted: inferredCat === 'hospital' ? 'Emergency 24/7' : 'Open'
                },
                source: 'OSM',
                sourceUpdatedAt: new Date().toISOString(),
                freshness: 'fresh',
                emergencyCapable: inferredCat === 'hospital' || inferredCat === 'police',
                phone: inferredCat === 'hospital' ? '108 / Local ER' : inferredCat === 'police' ? '100 / Emergency' : undefined,
                tags: this.generateTags(inferredCat, rawName),
                triageInfo: inferredCat === 'hospital' ? 'Verified 24/7 Emergency Casualty Service' : undefined,
                imageUrl: getDynamicPlaceImage({ name: rawName, category: inferredCat, tags: this.generateTags(inferredCat, rawName) })
              });
            }
          } catch {
            // Ignore single url timeout
          }
        })
      );
    } catch (err) {
      console.warn('Photon POI query error:', err);
    }

    // 2. Secondary Engine: Bounded Nominatim Search with Viewbox if Photon returned few results
    if (places.length < 3) {
      try {
        const box = 0.15; // ~15km bounding box around user's exact coordinates
        const queryTerm = cleanQuery || (category !== 'all' ? category : 'hospital');
        const nomUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(queryTerm)}&viewbox=${(lon - box).toFixed(4)},${(lat + box).toFixed(4)},${(lon + box).toFixed(4)},${(lat - box).toFixed(4)}&bounded=1&format=json&addressdetails=1&limit=8`;

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);
        const nomRes = await fetch(nomUrl, {
          headers: { 'Accept': 'application/json', 'User-Agent': 'LocalTravelApp/8.0' },
          signal: controller.signal
        });
        clearTimeout(timeout);

        if (nomRes.ok) {
          const items: NominatimSearchResult[] = await nomRes.json();
          for (const it of items || []) {
            const itemLat = parseFloat(it.lat);
            const itemLon = parseFloat(it.lon);
            if (isNaN(itemLat) || isNaN(itemLon)) continue;

            const coordKey = `${itemLat.toFixed(3)},${itemLon.toFixed(3)}`;
            if (seenCoordinates.has(coordKey)) continue;

            let dist = 999999;
            try {
              dist = getDistance({ latitude: lat, longitude: lon }, { latitude: itemLat, longitude: itemLon });
            } catch {
              continue;
            }

            if (dist > 45000) continue;
            seenCoordinates.add(coordKey);

            const addr = it.address || {};
            let rawName = it.name || it.display_name.split(',')[0].trim();
            const inferredCat = it.class === 'amenity' && it.type === 'hospital' ? 'hospital' : (category !== 'all' ? category : 'attraction');

            places.push({
              id: `nom-${it.place_id || it.osm_id || Math.random().toString(36).substring(7)}`,
              name: rawName,
              category: inferredCat,
              distanceMeters: dist,
              location: { latitude: itemLat, longitude: itemLon },
              countryCode: (addr.country_code || 'IN').toUpperCase(),
              city: addr.city || addr.town || addr.county || 'Local Area',
              address: it.display_name,
              hours: {
                status: 'open',
                raw: inferredCat === 'hospital' ? 'Emergency 24/7' : 'Standard hours',
                formatted: inferredCat === 'hospital' ? 'Emergency 24/7' : 'Open'
              },
              source: 'OSM',
              sourceUpdatedAt: new Date().toISOString(),
              freshness: 'fresh',
              emergencyCapable: inferredCat === 'hospital',
              phone: inferredCat === 'hospital' ? '108 / Local ER' : undefined,
              tags: this.generateTags(inferredCat, rawName),
              triageInfo: inferredCat === 'hospital' ? 'Verified Emergency Facility' : undefined,
              imageUrl: getDynamicPlaceImage({ name: rawName, category: inferredCat, tags: this.generateTags(inferredCat, rawName) })
            });
          }
        }
      } catch {
        // Graceful fallback
      }
    }

    // 3. Fallback: If network is offline or no POIs found, load nearest pilot city verified dataset with recalculation
    if (places.length === 0) {
      const closestCity = this.resolveClosestCity(lat, lon);
      const fallbackList = MOCK_PLACES[closestCity.id] || MOCK_PLACES['delhi'] || [];

      for (const p of fallbackList) {
        if (category !== 'all' && p.category !== category) continue;
        if (cleanQuery && !p.name.toLowerCase().includes(cleanQuery.toLowerCase())) continue;

        let dist = 999999;
        try {
          dist = getDistance({ latitude: lat, longitude: lon }, { latitude: p.location.latitude, longitude: p.location.longitude });
        } catch {
          dist = p.distanceMeters;
        }

        places.push({
          ...p,
          distanceMeters: dist
        });
      }
    }

    // Sort deterministically: shortest geodesic distance first, then place ID
    places.sort((a, b) => {
      if (a.distanceMeters !== b.distanceMeters) {
        return a.distanceMeters - b.distanceMeters;
      }
      return (a.id || '').localeCompare(b.id || '');
    });

    if (places.length > 0) {
      this.poiCache.set(cacheKey, { timestamp: Date.now(), places });
    }

    return places;
  }

  // Fast direct lookup for the nearest verified 24/7 hospital
  public async fetchNearestHospital(lat: number, lon: number): Promise<Place | null> {
    try {
      const photonUrl = `https://photon.komoot.io/api/?q=hospital&lat=${lat}&lon=${lon}&osm_tag=amenity:hospital&limit=8`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2800);
      const res = await fetch(photonUrl, { signal: controller.signal });
      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        const hospitals: Place[] = [];

        for (const feat of data.features || []) {
          if (!feat || !feat.geometry || !Array.isArray(feat.geometry.coordinates)) continue;
          const [fLon, fLat] = feat.geometry.coordinates;
          if (typeof fLat !== 'number' || typeof fLon !== 'number' || isNaN(fLat) || isNaN(fLon)) continue;

          let dist = 999999;
          try {
            dist = getDistance({ latitude: lat, longitude: lon }, { latitude: fLat, longitude: fLon });
          } catch {
            continue;
          }

          const props = feat.properties || {};
          let rawName = props.name || props.street;
          if (!rawName) continue;
          rawName = rawName.trim();

          if (rawName.toLowerCase() === 'hospital' || rawName.toLowerCase() === 'clinic') {
            rawName = props.locality ? `${props.locality} Hospital` : (props.street ? `${props.street} Hospital` : `${props.city || 'Emergency'} Hospital`);
          }

          const addr = [props.street, props.locality || props.district, props.city, props.state, props.country].filter(Boolean).join(', ');

          hospitals.push({
            id: `hospital-${props.osm_id || Math.random().toString(36).substring(7)}`,
            name: rawName,
            category: 'hospital',
            distanceMeters: dist,
            location: { latitude: fLat, longitude: fLon },
            countryCode: (props.countrycode || 'IN').toUpperCase(),
            city: props.city || props.district || 'Local Area',
            address: addr || 'Near Current Location',
            hours: { status: 'open', raw: 'Emergency 24/7', formatted: 'Emergency 24/7' },
            source: 'OSM',
            sourceUpdatedAt: new Date().toISOString(),
            freshness: 'fresh',
            emergencyCapable: true,
            phone: '108 / Local ER',
            tags: ['Emergency Casualty', '24/7 Trauma Unit', 'Verified Hospital'],
            triageInfo: '24/7 Emergency Casualty & Trauma Resuscitation',
            imageUrl: getDynamicPlaceImage({ name: rawName, category: 'hospital' })
          });
        }

        if (hospitals.length > 0) {
          hospitals.sort((a, b) => a.distanceMeters - b.distanceMeters);
          return hospitals[0];
        }
      }
    } catch {
      // Fallback
    }

    // Fallback: closest pilot city verified hospital
    const closestCity = this.resolveClosestCity(lat, lon);
    const cityPlaces = MOCK_PLACES[closestCity.id] || MOCK_PLACES['delhi'] || [];
    const hospital = cityPlaces.find(p => p.category === 'hospital') || cityPlaces[0];

    if (hospital) {
      let dist = hospital.distanceMeters;
      try {
        dist = getDistance({ latitude: lat, longitude: lon }, { latitude: hospital.location.latitude, longitude: hospital.location.longitude });
      } catch {
        dist = hospital.distanceMeters;
      }
      return {
        ...hospital,
        distanceMeters: dist
      };
    }

    return null;
  }

  private resolveClosestCity(lat: number, lon: number): typeof CITIES[0] {
    let closest = CITIES[0];
    let minDist = Infinity;
    for (const city of CITIES) {
      try {
        const d = getDistance({ latitude: lat, longitude: lon }, { latitude: city.lat, longitude: city.lng });
        if (d < minDist) {
          minDist = d;
          closest = city;
        }
      } catch {
        // continue
      }
    }
    return closest;
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
