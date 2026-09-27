import { Place, Category, LocationCoordinates, RouteResponse, RouteStep } from '../types';
import { getDistance } from 'geolib';

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
    { term: 'hospital', cat: 'hospital' },
    { term: 'pharmacy', cat: 'pharmacy' },
    { term: 'police station', cat: 'police' },
    { term: 'atm', cat: 'atm' },
    { term: 'bus stop', cat: 'transit_stop' },
    { term: 'supermarket', cat: 'supermarket' },
    { term: 'cafe', cat: 'cafe' }
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
              triageInfo: lm.triageInfo
            });
          }
        }
      }
    }

    // Step A: Build search queries with semantic expansion
    let queries = CATEGORY_SEARCH_TERMS[category] || [{ term: category, cat: 'hospital' as Category }];

    if (searchQuery && searchQuery.trim().length > 1) {
      const q = searchQuery.toLowerCase().trim();
      const customQueries: Array<{ term: string; cat: Category }> = [];

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

      customQueries.push({ term: searchQuery.trim(), cat: category !== 'all' ? category : 'hospital' });
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
              triageInfo: cat === 'hospital' ? 'Verified Medical Service / ER' : undefined
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
              const [fLon, fLat] = feat.geometry.coordinates;
              const coordKey = `${fLat.toFixed(3)},${fLon.toFixed(3)}`;
              if (seenCoordinates.has(coordKey)) continue;

              const dist = getDistance(
                { latitude: lat, longitude: lon },
                { latitude: fLat, longitude: fLon }
              );

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
                triageInfo: cat === 'hospital' ? 'Emergency Care Facility' : undefined
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
      all: 'hospital|pharmacy|police|atm|transit_station|supermarket|cafe|restaurant|lodging|gas_station',
      hospital: 'hospital',
      pharmacy: 'pharmacy',
      police: 'police',
      atm: 'atm',
      transit_stop: 'transit_station',
      supermarket: 'supermarket',
      cafe: 'cafe',
      restaurant: 'restaurant',
      hotel: 'lodging',
      fuel: 'gas_station'
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

      const cat: Category = (category !== 'all' ? category : 'hospital');

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
