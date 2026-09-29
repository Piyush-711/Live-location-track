import { Place, Category, LocationCoordinates, RouteResponse, RouteStep } from '../types';
import { getDistance } from 'geolib';
import { CITIES } from '../data/mockData';
import { getDynamicPlaceImage } from '../utils/placeVisuals';
import { RequestCache, assertCoordinates, validCoordinates, fetchProviderJson, photonBaseUrl, providerBaseUrl } from './providerRequest';

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


interface PhotonFeature {
  geometry?: { coordinates?: unknown[] };
  properties?: Record<string, unknown>;
}
interface PhotonResponse { features?: PhotonFeature[] }
interface ReverseResult { cityName: string; countryCode: string; district: string; displayName: string }
const textValue = (value: unknown): string => typeof value === 'string' ? value.trim() : '';
const countryCode = (value: unknown): string => /^[a-z]{2}$/i.test(textValue(value)) ? textValue(value).toUpperCase() : '';
const categoryQueries: Record<Category, [string, string]> = {
  hospital: ['hospital', 'amenity:hospital'], pharmacy: ['pharmacy', 'amenity:pharmacy'],
  police: ['police', 'amenity:police'], atm: ['atm', 'amenity:atm'],
  cafe: ['cafe', 'amenity:cafe'], restaurant: ['restaurant', 'amenity:restaurant'],
  hotel: ['hotel', 'tourism:hotel'], fuel: ['fuel', 'amenity:fuel'],
  supermarket: ['supermarket', 'shop:supermarket'], historic: ['monument', 'historic'],
  museum: ['museum', 'tourism:museum'], beach: ['beach', 'natural:beach'],
  attraction: ['attraction', 'tourism:attraction'], transit_stop: ['station', 'railway:station']
};

function featureCoordinates(feature: PhotonFeature): LocationCoordinates | undefined {
  const coordinates = feature?.geometry?.coordinates;
  if (!Array.isArray(coordinates) || !validCoordinates(coordinates[1], coordinates[0])) return undefined;
  return { latitude: coordinates[1] as number, longitude: coordinates[0] as number };
}
function featureId(props: Record<string, unknown>, location: LocationCoordinates, name: string): string {
  const id = typeof props.osm_id === 'number' || typeof props.osm_id === 'string' ? String(props.osm_id) : '';
  return id ? `osm-${textValue(props.osm_type) || 'unknown'}-${id}` :
    `osm-${location.latitude.toFixed(6)},${location.longitude.toFixed(6)}-${name.toLowerCase()}`;
}

class OsmService {
  private readonly reverseCache = new RequestCache<ReverseResult>(100, 30 * 60_000);
  private readonly searchCache = new RequestCache<GeocodingResult[]>(100, 5 * 60_000);
  private readonly poiCache = new RequestCache<Place[]>(100, 2 * 60_000);
  private readonly routeCache = new RequestCache<RouteResponse | null>(50, 60_000);

  public async reverseGeocode(lat: number, lon: number): Promise<ReverseResult> {
    assertCoordinates(lat, lon);
    try {
      return await this.reverseCache.load(`${lat.toFixed(3)},${lon.toFixed(3)}`, async () => {
        const data = await fetchProviderJson<PhotonResponse>(`${photonBaseUrl()}/reverse?lat=${lat}&lon=${lon}&limit=1`);
        const feature = Array.isArray(data?.features) ? data.features[0] : undefined;
        if (!feature || !featureCoordinates(feature)) throw new Error('No reverse-geocoding result');
        const props = feature.properties || {};
        const city = textValue(props.city) || textValue(props.county) || textValue(props.state) || 'Current location';
        const district = textValue(props.district) || textValue(props.locality) || city;
        return {
          cityName: district === city ? city : `${district}, ${city}`,
          countryCode: countryCode(props.countrycode), district,
          displayName: [textValue(props.name), district, city, textValue(props.country)].filter(Boolean).join(', ')
        };
      });
    } catch {
      return { cityName: 'Current location', countryCode: '', district: '', displayName: `${lat.toFixed(4)}°, ${lon.toFixed(4)}°` };
    }
  }

  public async searchLocations(query: string): Promise<GeocodingResult[]> {
    const q = query.trim().slice(0, 200);
    if (q.length < 2) return [];
    return this.searchCache.load(q.toLowerCase(), async () => {
      const coordinateMatch = q.match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);
      if (coordinateMatch) {
        const latitude = Number(coordinateMatch[1]);
        const longitude = Number(coordinateMatch[2]);
        if (!validCoordinates(latitude, longitude)) return [];
        return [{
          id: `coord-${latitude}-${longitude}`, name: `Pin: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
          address: `${latitude}, ${longitude}`, cityName: 'Custom location', country: '', countryCode: '',
          latitude, longitude, type: 'coordinate'
        }];
      }
      const lower = q.toLowerCase();
      const results: GeocodingResult[] = CITIES.filter(c => c.name.toLowerCase().includes(lower) || c.country.toLowerCase().includes(lower)).map(c => ({
        id: `city-${c.id}`, name: c.name, address: `${c.name}, ${c.country}`, cityName: c.name,
        country: c.country, countryCode: c.countryCode, latitude: c.lat, longitude: c.lng, type: 'city'
      }));
      results.push(...REGIONAL_LANDMARKS.filter(l => `${l.name} ${l.address}`.toLowerCase().includes(lower)).map(l => ({
        id: l.id, name: l.name, address: l.address, cityName: l.city, country: 'India', countryCode: 'IN',
        latitude: l.latitude, longitude: l.longitude, type: l.category
      })));
      try {
        const data = await fetchProviderJson<PhotonResponse>(`${photonBaseUrl()}/api/?q=${encodeURIComponent(q)}&limit=8`);
        for (const feature of Array.isArray(data?.features) ? data.features.slice(0, 20) : []) {
          const location = featureCoordinates(feature);
          if (!location) continue;
          const props = feature.properties || {};
          const name = textValue(props.name) || textValue(props.city) || textValue(props.street);
          if (!name) continue;
          results.push({
            id: featureId(props, location, name), name,
            address: [textValue(props.street), textValue(props.city), textValue(props.state), textValue(props.country)].filter(Boolean).join(', ') || name,
            cityName: textValue(props.city) || textValue(props.county) || name,
            country: textValue(props.country), countryCode: countryCode(props.countrycode), ...location,
            type: textValue(props.osm_value) || 'place'
          });
        }
      } catch {
        // Local catalogue results remain available when the provider is unavailable.
      }
      return [...new Map(results.map(item => [item.id, item])).values()].slice(0, 20);
    });
  }

  private inferCategory(props: Record<string, unknown>): Category | undefined {
    const key = textValue(props.osm_key);
    const value = textValue(props.osm_value);
    if (key === 'amenity') {
      const amenities: Record<string, Category> = {
        hospital: 'hospital', clinic: 'hospital', doctors: 'hospital', pharmacy: 'pharmacy',
        police: 'police', atm: 'atm', bank: 'atm', cafe: 'cafe', restaurant: 'restaurant',
        fast_food: 'restaurant', food_court: 'restaurant', bar: 'restaurant', pub: 'restaurant',
        marketplace: 'supermarket', bus_station: 'transit_stop', fuel: 'fuel'
      };
      return amenities[value];
    }
    if (key === 'shop') return value === 'chemist' ? 'pharmacy' : 'supermarket';
    if (key === 'historic') return 'historic';
    if (key === 'natural' && value === 'beach') return 'beach';
    if (key === 'railway' || (key === 'highway' && value === 'bus_stop') || key === 'public_transport') return 'transit_stop';
    if (key === 'tourism') {
      if (['hotel', 'guest_house', 'hostel', 'motel'].includes(value)) return 'hotel';
      if (['museum', 'gallery'].includes(value)) return 'museum';
      return 'attraction';
    }
    return undefined;
  }

  public async fetchNearbyPOIs(lat: number, lon: number, category: Category | 'all' = 'all', radiusMeters = 15000, searchQuery?: string): Promise<Place[]> {
    assertCoordinates(lat, lon);
    if (!Number.isFinite(radiusMeters) || radiusMeters <= 0 || radiusMeters > 50_000) throw new Error('Search radius must be between 1 and 50000 metres');
    if (category !== 'all' && !Object.prototype.hasOwnProperty.call(categoryQueries, category)) throw new Error('Invalid place category');
    const query = (searchQuery || '').trim().slice(0, 200);
    const key = `${lat.toFixed(5)},${lon.toFixed(5)}:${radiusMeters}:${category}:${query.toLowerCase()}`;
    return this.poiCache.load(key, async () => {
      const categories: Category[] = category === 'all' ? Object.keys(categoryQueries) as Category[] : [category];
      const params = new URLSearchParams({ lat: String(lat), lon: String(lon), limit: '50' });
      categories.forEach(c => params.append('osm_tag', categoryQueries[c][1]));
      const endpoint = query.length >= 2 ? 'api/' : 'reverse';
      if (query.length >= 2) params.set('q', query);
      else params.set('radius', String(radiusMeters / 1000));
      // Photon supports tag-filtered reverse lookup; one request covers all categories.
      const data = await fetchProviderJson<PhotonResponse>(`${photonBaseUrl()}/${endpoint}?${params}`, 4500);
      if (!Array.isArray(data?.features)) throw new Error('Location provider returned invalid data');
      const places = new Map<string, Place>();
        for (const feature of data.features.slice(0, 100)) {
          const location = featureCoordinates(feature);
          if (!location) continue;
          const props = feature.properties || {};
          const name = textValue(props.name);
          const inferred = this.inferCategory(props);
          if (!name || !inferred || (category !== 'all' && inferred !== category)) continue;
          const distanceMeters = getDistance({ latitude: lat, longitude: lon }, location);
          if (distanceMeters > radiusMeters) continue;
          const id = featureId(props, location, name);
          places.set(id, {
            id, name, category: inferred, location, distanceMeters,
            countryCode: countryCode(props.countrycode), city: textValue(props.city) || textValue(props.district),
            address: [textValue(props.street), textValue(props.locality), textValue(props.city), textValue(props.state), textValue(props.country)].filter(Boolean).join(', ') || 'Address unavailable',
            hours: { status: 'unknown', raw: null, formatted: 'Hours unavailable' },
            source: 'OSM', sourceUpdatedAt: '', freshness: 'unknown',
            tags: ['OpenStreetMap listing'],
            triageInfo: inferred === 'hospital' ? 'Emergency services and opening hours have not been verified.' : undefined,
            imageUrl: getDynamicPlaceImage({ name, category: inferred })
          });
        }
      return [...places.values()].sort((a, b) => a.distanceMeters - b.distanceMeters || a.id.localeCompare(b.id));
    });
  }

  /** Nearby hospital listing only; geocoding cannot verify emergency capability. */
  public async fetchNearestHospital(lat: number, lon: number): Promise<Place | null> {
    try {
      const places = await this.fetchNearbyPOIs(lat, lon, 'hospital', 50_000);
      return places.find(place => place.category === 'hospital') || null;
    } catch { return null; }
  }

  public async fetchLiveOSRMRoute(origin: LocationCoordinates, destination: LocationCoordinates, mode: 'walking' | 'driving' = 'walking'): Promise<RouteResponse | null> {
    assertCoordinates(origin.latitude, origin.longitude);
    assertCoordinates(destination.latitude, destination.longitude);
    if (mode !== 'walking' && mode !== 'driving') throw new Error('Invalid route mode');
    // OSRM profiles are prepared on the server: changing a URL segment cannot turn a car graph into a walking graph.
    const base = mode === 'walking' ? providerBaseUrl('VITE_OSRM_WALKING_BASE_URL') :
      providerBaseUrl('VITE_OSRM_DRIVING_BASE_URL', 'https://router.project-osrm.org');
    if (!base) return null;
    const key = `${mode}:${origin.latitude},${origin.longitude}:${destination.latitude},${destination.longitude}`;
    return this.routeCache.load(key, async () => {
      try {
        const url = `${base}/route/v1/driving/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}?overview=full&geometries=geojson&steps=true`;
        const data = await fetchProviderJson<{
          code?: string;
          routes?: Array<{ distance: number; duration: number; geometry: RouteResponse['geometry']; legs?: Array<{ steps?: Array<{
            distance: number; duration: number; name?: string; maneuver?: { type?: string; modifier?: string; exit?: number }
          }> }> }>;
        }>(url);
        const route = data?.routes?.[0];
        if (data.code !== 'Ok' || !route || !Number.isFinite(route.distance) || route.distance < 0 ||
            !Number.isFinite(route.duration) || route.duration < 0 || route.geometry?.type !== 'LineString' ||
            !Array.isArray(route.geometry.coordinates) || route.geometry.coordinates.length < 2 || route.geometry.coordinates.length > 50_000 ||
            !route.geometry.coordinates.every(c => Array.isArray(c) && validCoordinates(c[1], c[0]))) return null;
        const rawSteps = Array.isArray(route.legs) ? route.legs.flatMap(leg => Array.isArray(leg.steps) ? leg.steps : []).slice(0, 2000) : [];
        const steps: RouteStep[] = rawSteps.filter(step => Number.isFinite(step.distance) && step.distance >= 0 && Number.isFinite(step.duration) && step.duration >= 0).map((step, i) => {
          const type = textValue(step.maneuver?.type);
          const modifier = textValue(step.maneuver?.modifier);
          const name = textValue(step.name);
          const maneuver: RouteStep['maneuver'] = type === 'depart' ? 'depart' : type === 'arrive' ? 'arrive' : modifier.includes('left') ? 'turn_left' : modifier.includes('right') ? 'turn_right' : 'straight';
          const instruction = this.formatManeuver(type, modifier, step.maneuver?.exit);
          return { id: `step-${i + 1}`, instruction: name ? `${instruction} on ${name}` : instruction,
            distanceMeters: Math.round(step.distance), durationSeconds: Math.round(step.duration), maneuver, streetName: name || undefined };
        });
        if (!steps.length) return null;
        return { graphVersion: `osrm-${mode}`, profileVersion: `osrm-${mode}`, mode,
          distanceMeters: Math.round(route.distance), durationSeconds: Math.round(route.duration),
          geometry: route.geometry, steps, sourceUpdatedAt: new Date().toISOString(), coverageAreaId: 'live' };
      } catch {
        // A straight line is not a navigable route. Let the UI show route unavailable.
        return null;
      }
    });
  }

  private formatManeuver(type: string, modifier: string, exit?: number): string {
    const direction = modifier ? ` ${modifier === 'uturn' ? 'with a U-turn' : modifier}` : '';
    if (type === 'depart') return 'Start along the route';
    if (type === 'arrive') return 'Arrive at destination';
    if (type === 'roundabout' || type === 'rotary') {
      return Number.isInteger(exit) && exit! > 0 ? `Enter the roundabout and take exit ${exit}` : 'Enter the roundabout';
    }
    if (type === 'roundabout turn') return `At the roundabout, turn${direction}`;
    if (type === 'exit roundabout' || type === 'exit rotary') return `Exit the roundabout${direction}`;
    if (type === 'merge') return `Merge${direction}`;
    if (type === 'on ramp') return `Take the ramp${direction}`;
    if (type === 'off ramp') return `Take the exit${direction}`;
    if (type === 'fork') return `At the fork, keep${direction || ' along the route'}`;
    if (type === 'end of road') return `At the end of the road, turn${direction}`;
    if (type === 'turn') return modifier === 'uturn' ? 'Make a U-turn' : `Turn${direction}`;
    if (type === 'new name') return 'Continue onto the next road';
    if (type === 'use lane') return `Use the indicated lane${direction}`;
    return `Continue${direction || ' along the route'}`;
  }
}

export const osmService = new OsmService();
