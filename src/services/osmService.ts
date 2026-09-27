import { Place, Category, LocationCoordinates, RouteResponse, RouteStep } from '../types';
import { calculateDistanceMeters } from '../hooks/useLiveLocation';

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

interface OverpassElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

interface OverpassResponse {
  elements: OverpassElement[];
}

class OsmService {
  private reverseCache = new Map<string, { city: string; countryCode: string; neighborhood: string }>();

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
      const timeout = setTimeout(() => controller.abort(), 4000);

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

      if (!res.ok) throw new Error('Nominatim error');
      const data: NominatimReverseResponse = await res.json();

      const addr = data.address || {};
      const city = addr.city || addr.town || addr.village || addr.county || 'Local Area';
      const neighborhood = addr.neighbourhood || addr.suburb || addr.residential || addr.road || city;
      const countryCode = (addr.country_code || 'JP').toUpperCase();

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
        countryCode: 'JP',
        district: 'Current Sector',
        displayName: `${lat.toFixed(4)}°, ${lon.toFixed(4)}°`
      };
    }
  }

  // 2. Query Live Overpass API for real-world POIs around coordinates
  public async fetchNearbyPOIs(
    lat: number,
    lon: number,
    category: Category | 'all',
    radiusMeters: number = 3000
  ): Promise<Place[]> {
    const categoryFilters = this.buildOverpassFilter(category, radiusMeters, lat, lon);
    const query = `
      [out:json][timeout:15];
      (
        ${categoryFilters}
      );
      out center 50;
    `;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const res = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(query)}`,
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (!res.ok) throw new Error(`Overpass status ${res.status}`);
      const data: OverpassResponse = await res.json();

      if (!data.elements || data.elements.length === 0) {
        return [];
      }

      const places: Place[] = [];

      for (const el of data.elements) {
        const itemLat = el.lat || el.center?.lat;
        const itemLon = el.lon || el.center?.lon;
        if (!itemLat || !itemLon) continue;

        const tags = el.tags || {};
        const cat = this.inferCategory(tags, category);
        const name = tags.name || tags['name:en'] || tags.brand || tags.operator || this.getGenericName(cat);
        const distance = calculateDistanceMeters(lat, lon, itemLat, itemLon);

        const street = tags['addr:street'] 
          ? `${tags['addr:housenumber'] ? tags['addr:housenumber'] + ' ' : ''}${tags['addr:street']}` 
          : tags['addr:city'] || 'Nearby Thoroughfare';

        const place: Place = {
          id: `osm-${el.type}-${el.id}`,
          name,
          localizedName: tags['name:ja'] || tags['name:hi'] || tags['name:local'] || undefined,
          category: cat,
          distanceMeters: distance,
          location: { latitude: itemLat, longitude: itemLon },
          countryCode: 'LIVE',
          city: tags['addr:city'] || 'Local Node',
          address: street,
          hours: {
            status: tags.opening_hours ? (tags.opening_hours.includes('24/7') ? 'open' : 'open') : 'unknown',
            raw: tags.opening_hours || null,
            formatted: tags.opening_hours || (cat === 'hospital' ? 'Emergency 24/7' : 'Hours on site')
          },
          source: 'OSM',
          sourceUpdatedAt: new Date().toISOString(),
          freshness: 'fresh',
          emergencyCapable: cat === 'hospital' || tags.emergency === 'yes',
          phone: tags.phone || tags['contact:phone'] || undefined,
          tags: this.extractTags(tags, cat),
          triageInfo: cat === 'hospital' ? 'Public Hospital / Medical Service' : undefined
        };

        places.push(place);
      }

      // Sort deterministically: distance then ID
      places.sort((a, b) => {
        if (a.distanceMeters !== b.distanceMeters) {
          return a.distanceMeters - b.distanceMeters;
        }
        return a.id.localeCompare(b.id);
      });

      return places;
    } catch (err) {
      console.warn('Overpass fetch failed, returning empty to use fallback:', err);
      return [];
    }
  }

  // 3. Live Turn-by-Turn Routing via OSRM Public Server
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

      // Convert OSRM legs and steps to our RouteStep array
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
      console.warn('Live OSRM route fetch failed:', err);
      return null;
    }
  }

  private buildOverpassFilter(cat: Category | 'all', radius: number, lat: number, lon: number): string {
    const r = radius;
    switch (cat) {
      case 'hospital':
        return `
          node["amenity"="hospital"](around:${r},${lat},${lon});
          way["amenity"="hospital"](around:${r},${lat},${lon});
          node["amenity"="clinic"](around:${r},${lat},${lon});
        `;
      case 'pharmacy':
        return `
          node["amenity"="pharmacy"](around:${r},${lat},${lon});
          way["amenity"="pharmacy"](around:${r},${lat},${lon});
        `;
      case 'police':
        return `
          node["amenity"="police"](around:${r},${lat},${lon});
          way["amenity"="police"](around:${r},${lat},${lon});
        `;
      case 'atm':
        return `
          node["amenity"="atm"](around:${r},${lat},${lon});
          node["amenity"="bank"](around:${r},${lat},${lon});
        `;
      case 'transit_stop':
        return `
          node["railway"="station"](around:${r},${lat},${lon});
          node["railway"="subway_entrance"](around:${r},${lat},${lon});
          node["highway"="bus_stop"](around:${r},${lat},${lon});
        `;
      case 'supermarket':
        return `
          node["shop"="supermarket"](around:${r},${lat},${lon});
          node["shop"="convenience"](around:${r},${lat},${lon});
        `;
      case 'cafe':
        return `
          node["amenity"="cafe"](around:${r},${lat},${lon});
        `;
      default:
        // 'all' essentials
        return `
          node["amenity"~"hospital|pharmacy|police|atm|cafe"](around:${r},${lat},${lon});
          node["shop"~"supermarket|convenience"](around:${r},${lat},${lon});
          node["railway"="subway_entrance"](around:${r},${lat},${lon});
        `;
    }
  }

  private inferCategory(tags: Record<string, string>, requested: Category | 'all'): Category {
    if (requested !== 'all') return requested;
    if (tags.amenity === 'hospital' || tags.amenity === 'clinic') return 'hospital';
    if (tags.amenity === 'pharmacy') return 'pharmacy';
    if (tags.amenity === 'police') return 'police';
    if (tags.amenity === 'atm' || tags.amenity === 'bank') return 'atm';
    if (tags.railway || tags.highway === 'bus_stop') return 'transit_stop';
    if (tags.shop === 'supermarket' || tags.shop === 'convenience') return 'supermarket';
    if (tags.amenity === 'cafe') return 'cafe';
    return 'hospital';
  }

  private getGenericName(cat: Category): string {
    switch (cat) {
      case 'hospital': return 'Medical Center / Hospital';
      case 'pharmacy': return 'Local Pharmacy';
      case 'police': return 'Police Station / Post';
      case 'atm': return 'Cash ATM';
      case 'transit_stop': return 'Transit Station';
      case 'supermarket': return 'Supermarket / Grocery';
      case 'cafe': return 'Coffee & Bakery';
      default: return 'Essential Service';
    }
  }

  private extractTags(tags: Record<string, string>, cat: Category): string[] {
    const list: string[] = ['OpenStreetMap Live'];
    if (tags.wheelchair === 'yes') list.push('Wheelchair Accessible');
    if (tags.opening_hours?.includes('24/7')) list.push('24/7 Service');
    if (tags.operator) list.push(tags.operator);
    if (cat === 'hospital') list.push('Emergency Care');
    if (cat === 'pharmacy') list.push('Dispensary');
    return list;
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
