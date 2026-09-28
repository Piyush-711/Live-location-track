import { 
  Place, 
  Category, 
  RouteResponse, 
  EmergencyDossier, 
  CountryBriefing, 
  CurrencyRates, 
  WeatherReport, 
  CorrectionReportRequest,
  RFC9457Error,
  LocationCoordinates,
  LocalMarket
} from '../types';
import { 
  MOCK_PLACES, 
  EMERGENCY_DOSSIERS, 
  COUNTRY_BRIEFINGS, 
  MOCK_KYOTO_ROUTE,
  CITIES 
} from '../data/mockData';
import { storage } from './storage';
import { osmService } from './osmService';
import { fxService } from './fxService';
import { weatherService } from './weatherService';

class ApiService {
  private baseUrl: string = '/v1';

  // Helper fetch with timeout and fallback
  private async safeFetch<T>(endpoint: string, options?: RequestInit, fallback?: () => T | Promise<T>): Promise<T> {
    // If running on a static host (like GitHub Pages) where Spring Boot backend is not mounted, use certified fallback
    const isStaticDeploy = typeof window !== 'undefined' && (
      window.location.hostname.includes('github.io') ||
      window.location.protocol === 'file:'
    );

    if (isStaticDeploy && fallback) {
      return await fallback();
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1200); // 1.2s timeout for local Spring server

      const res = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...(options?.headers || {})
        }
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        return await res.json();
      }
      throw new Error(`HTTP error ${res.status}`);
    } catch {
      // Offline / Network fail-over to local certified vault
      if (fallback) return await fallback();
      throw this.buildRFC9457Error('DEPENDENCY_UNAVAILABLE', 'Backend Unreachable', 503, 'Falling back to local offline storage.');
    }
  }

  // GET /v1/coverage
  public async getCoverage(areaId: string) {
    return this.safeFetch(`/coverage?areaId=${areaId}`, { method: 'GET' }, () => {
      const city = CITIES.find(c => c.id === areaId);
      if (!city) {
        throw this.buildRFC9457Error(
          'COVERAGE_UNSUPPORTED',
          'Coverage Not Supported',
          422,
          `The requested areaId '${areaId}' is not in the certified release coverage.`
        );
      }
      return {
        datasetVersion: `city-release-${areaId}-20260924`,
        coverage: {
          areaId: city.id,
          countryCode: city.countryCode,
          supported: true,
          capabilities: ['discovery', 'offline_packs', 'walking_routes', 'driving_routes', 'emergency']
        }
      };
    });
  }

  // POST /v1/places/nearby with OpenStreetMap Live Data Fallback
  public async getNearbyPlaces(
    areaId: string, 
    category?: Category | 'all',
    searchQuery?: string,
    radiusMeters: number = 12000,
    coords?: LocationCoordinates
  ): Promise<{ items: Place[]; datasetVersion: string; coverageArea: string }> {
    // 1. If live coordinates are provided, query live OpenStreetMap Overpass/Photon nodes
    if (coords && typeof coords.latitude === 'number' && typeof coords.longitude === 'number') {
      try {
        const osmPlaces = await osmService.fetchNearbyPOIs(
          coords.latitude,
          coords.longitude,
          category || 'all',
          radiusMeters,
          searchQuery
        );

        if (osmPlaces && osmPlaces.length > 0) {
          return {
            items: osmPlaces,
            datasetVersion: `osm-live-${coords.latitude.toFixed(2)}-${coords.longitude.toFixed(2)}`,
            coverageArea: areaId || 'osm-live'
          };
        }
      } catch (err) {
        console.warn('Live OSM POI fetch error, switching to certified cache:', err);
      }
    }

    // 2. Safe fetch against Spring Boot backend / certified local vault
    const lat = coords?.latitude || 28.6139;
    const lon = coords?.longitude || 77.2090;

    return this.safeFetch(
      '/places/nearby',
      {
        method: 'POST',
        body: JSON.stringify({
          areaId,
          origin: { latitude: lat, longitude: lon },
          category: category || 'all',
          radiusMeters,
          limit: 50
        })
      },
      () => {
        // Find closest city in registry
        let closestCityId = areaId;
        if (!MOCK_PLACES[closestCityId]) {
          const matched = CITIES.find(c => c.id === areaId.toLowerCase());
          if (matched && MOCK_PLACES[matched.id]) {
            closestCityId = matched.id;
          } else {
            closestCityId = 'delhi';
          }
        }

        let places = [...(MOCK_PLACES[closestCityId] || MOCK_PLACES['delhi'] || [])];

        if (category && category !== 'all') {
          places = places.filter(p => p.category === category);
        }

        if (searchQuery && searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          places = places.filter(p => 
            p.name.toLowerCase().includes(q) ||
            (p.localizedName && p.localizedName.toLowerCase().includes(q)) ||
            p.address.toLowerCase().includes(q) ||
            (p.tags && p.tags.some(t => t.toLowerCase().includes(q)))
          );
        }

        // Section 10 Requirement: Deterministic ordering by distance then place ID
        places.sort((a, b) => {
          if (a.distanceMeters !== b.distanceMeters) {
            return a.distanceMeters - b.distanceMeters;
          }
          return (a.id || '').localeCompare(b.id || '');
        });

        return {
          items: places,
          datasetVersion: `city-release-${areaId}-20260924`,
          coverageArea: areaId
        };
      }
    );
  }

  // GET /v1/places/{id}
  public async getPlaceById(id: string): Promise<Place> {
    return this.safeFetch(`/places/${id}`, { method: 'GET' }, () => {
      for (const cityList of Object.values(MOCK_PLACES)) {
        const found = cityList.find(p => p.id === id);
        if (found) return found;
      }
      throw this.buildRFC9457Error(
        'OBJECT_NOT_FOUND',
        'Place Not Found',
        404,
        `No place registered with ID ${id}`
      );
    });
  }

  // POST /v1/routes with Live OSRM Turn-by-Turn Engine
  public async getRoute(
    areaId: string,
    mode: 'walking' | 'driving' = 'walking',
    origin?: LocationCoordinates,
    destination?: LocationCoordinates
  ): Promise<RouteResponse> {
    // 1. If real origin and destination coordinates are available, query live OSRM
    if (origin && destination) {
      try {
        const liveRoute = await osmService.fetchLiveOSRMRoute(origin, destination, mode);
        if (liveRoute) {
          return liveRoute;
        }
      } catch (err) {
        console.warn('Live OSRM routing failed, falling back:', err);
      }
    }

    return this.safeFetch(
      '/routes',
      {
        method: 'POST',
        body: JSON.stringify({
          areaId,
          origin: origin || { latitude: 35.0037, longitude: 135.7772 },
          destination: destination || { latitude: 35.0045, longitude: 135.7785 },
          mode
        })
      },
      () => {
        const baseRoute = { ...MOCK_KYOTO_ROUTE };
        baseRoute.mode = mode;
        baseRoute.coverageAreaId = areaId;
        if (mode === 'driving') {
          baseRoute.distanceMeters = 650;
          baseRoute.durationSeconds = 120;
        }
        return baseRoute;
      }
    );
  }

  // GET /v1/content/{country}/{locale}
  public async getEmergencyDossier(countryCode: string): Promise<EmergencyDossier> {
    return this.safeFetch(
      `/content/${countryCode.toUpperCase()}/en-US`,
      { method: 'GET' },
      () => {
        const code = countryCode.toUpperCase();
        return EMERGENCY_DOSSIERS[code] || EMERGENCY_DOSSIERS['JP'];
      }
    );
  }

  // GET /v1/briefing/{country}
  public async getCountryBriefing(countryCode: string): Promise<CountryBriefing> {
    return this.safeFetch(
      `/briefing/${countryCode.toUpperCase()}`,
      { method: 'GET' },
      () => {
        const code = countryCode.toUpperCase();
        return COUNTRY_BRIEFINGS[code] || COUNTRY_BRIEFINGS['JP'];
      }
    );
  }

  // GET /v1/fx
  public async getFXRates(forceRefresh = false): Promise<CurrencyRates> {
    return this.safeFetch(
      '/fx',
      { method: 'GET' },
      () => fxService.getRates(forceRefresh)
    );
  }

  // POST /v1/weather
  public async getWeather(
    areaId: string,
    coords?: LocationCoordinates,
    cityName?: string,
    forceRefresh = false
  ): Promise<WeatherReport> {
    return this.safeFetch(
      '/weather',
      {
        method: 'POST',
        body: JSON.stringify({ areaId, coords, cityName })
      },
      async () => {
        if (coords) {
          return await weatherService.getLiveWeather(coords.latitude, coords.longitude, cityName, forceRefresh);
        }
        const city = CITIES.find(c => c.id === areaId) || CITIES[0];
        return await weatherService.getLiveWeather(city.lat, city.lng, cityName || city.name, forceRefresh);
      }
    );
  }

  // POST /v1/reports
  public async submitReport(report: CorrectionReportRequest): Promise<{ reportId: string; status: string }> {
    return this.safeFetch(
      '/reports',
      {
        method: 'POST',
        body: JSON.stringify(report)
      },
      () => {
        const reportId = storage.saveCorrectionReport(report);
        return { reportId, status: 'RECEIVED_202' };
      }
    );
  }

  // GET /v1/markets
  public async getMarkets(
    params: {
      areaId?: string;
      lat?: number;
      lon?: number;
      specialty?: string;
      q?: string;
    },
    fallback?: () => LocalMarket[] | Promise<LocalMarket[]>
  ): Promise<LocalMarket[]> {
    const searchParams = new URLSearchParams();
    if (params.areaId) searchParams.append('areaId', params.areaId);
    if (params.lat !== undefined && !isNaN(params.lat)) searchParams.append('lat', params.lat.toString());
    if (params.lon !== undefined && !isNaN(params.lon)) searchParams.append('lon', params.lon.toString());
    if (params.specialty && params.specialty !== 'all') searchParams.append('specialty', params.specialty);
    if (params.q) searchParams.append('q', params.q);

    const queryStr = searchParams.toString();
    const endpoint = `/markets${queryStr ? `?${queryStr}` : ''}`;

    return this.safeFetch<LocalMarket[]>(endpoint, { method: 'GET' }, fallback);
  }

  // GET /v1/markets/{id}
  public async getMarketById(id: string, fallback?: () => LocalMarket | undefined | Promise<LocalMarket | undefined>): Promise<LocalMarket> {
    return this.safeFetch<LocalMarket>(`/markets/${id}`, { method: 'GET' }, fallback as () => LocalMarket | Promise<LocalMarket>);
  }

  private buildRFC9457Error(code: string, title: string, status: number, detail: string): RFC9457Error {
    return {
      type: `https://api.localapp.internal/errors/${code.toLowerCase()}`,
      title,
      status,
      detail,
      instance: `/v1/req-${Math.random().toString(36).substring(7)}`,
      code
    };
  }
}

export const api = new ApiService();
