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
  CITIES 
} from '../data/mockData';
import { getDistance } from 'geolib';
import { osmService } from './osmService';
import { fxService } from './fxService';
import { weatherService } from './weatherService';

export class ApiService {
  private baseUrl: string = (import.meta.env.VITE_API_BASE_URL || '/v1').replace(/\/$/, '');

  // Helper fetch with timeout and fallback
  private async safeFetch<T>(endpoint: string, options?: RequestInit, fallback?: () => T | Promise<T>): Promise<T> {
    const isStaticDeploy = typeof window !== 'undefined' && (
      (!import.meta.env.VITE_API_BASE_URL && window.location.hostname.endsWith('.github.io')) ||
      window.location.protocol === 'file:'
    );

    if (isStaticDeploy && fallback) {
      return await fallback();
    }

    const controller = new AbortController();
    const abort = () => controller.abort();
    options?.signal?.addEventListener('abort', abort, { once: true });
    if (options?.signal?.aborted) controller.abort();
    const timeoutId = setTimeout(abort, 8000);
    try {
      const headers = new Headers(options?.headers);
      headers.set('Accept', 'application/json');
      if (options?.body) headers.set('Content-Type', 'application/json');
      const res = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        signal: controller.signal,
        headers,
        credentials: 'omit',
        referrerPolicy: 'no-referrer',
      });
      if (res.ok) {
        return await res.json();
      }
      const problem = await res.json().catch(() => null);
      throw this.buildRFC9457Error(
        typeof problem?.code === 'string' ? problem.code : 'REQUEST_FAILED',
        typeof problem?.title === 'string' ? problem.title : 'Request Failed',
        res.status,
        typeof problem?.detail === 'string' ? problem.detail : `The server returned HTTP ${res.status}.`,
      );
    } catch (error) {
      if (options?.signal?.aborted) throw error;
      const status = (error as Partial<RFC9457Error>)?.status;
      // A rejected write or invalid request must never become a local success.
      if (status && status < 500) throw error;
      if (fallback) return await fallback();
      throw error && status ? error : this.buildRFC9457Error('DEPENDENCY_UNAVAILABLE', 'Service Unavailable', 503, 'The service could not be reached. Please try again.');
    } finally {
      clearTimeout(timeoutId);
      options?.signal?.removeEventListener('abort', abort);
    }
  }

  // GET /v1/coverage
  public async getCoverage(areaId: string) {
    return this.safeFetch(`/coverage?areaId=${encodeURIComponent(areaId)}`, { method: 'GET' }, () => {
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
          capabilities: ['sample_discovery']
        }
      };
    });
  }

  // POST /v1/places/nearby with OpenStreetMap Live Data Fallback
  public async getNearbyPlaces(
    areaId: string, 
    category?: Category | 'all',
    searchQuery?: string,
    radiusMeters: number = 10000,
    coords?: LocationCoordinates
  ): Promise<{ items: Place[]; datasetVersion: string; coverageArea: string }> {
    if (!Number.isFinite(radiusMeters) || radiusMeters < 100 || radiusMeters > 50000
      || (coords && (!Number.isFinite(coords.latitude) || !Number.isFinite(coords.longitude)
        || Math.abs(coords.latitude) > 90 || Math.abs(coords.longitude) > 180))) {
      throw this.buildRFC9457Error('VALIDATION_FAILED', 'Invalid Search', 400, 'Provide valid coordinates and a radius between 100 and 50000 metres.');
    }
    // When the provider succeeds, an empty result is authoritative too.
    if (coords && typeof coords.latitude === 'number' && typeof coords.longitude === 'number') {
      try {
        const osmPlaces = await osmService.fetchNearbyPOIs(
          coords.latitude,
          coords.longitude,
          category || 'all',
          radiusMeters,
          searchQuery
        );

        if (osmPlaces) {
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
    const city = CITIES.find(c => c.id === areaId);
    const lat = coords?.latitude ?? city?.lat;
    const lon = coords?.longitude ?? city?.lng;
    if (lat === undefined || lon === undefined) {
      throw this.buildRFC9457Error('COVERAGE_UNSUPPORTED', 'Area Unavailable', 422, 'Choose a supported city or provide coordinates.');
    }

    return this.safeFetch(
      searchQuery?.trim() ? '/places/search' : '/places/nearby',
      {
        method: 'POST',
        body: JSON.stringify({
          areaId,
          origin: { latitude: lat, longitude: lon },
          category: category || 'all',
          radiusMeters: Math.min(radiusMeters, 10000),
          query: searchQuery?.trim(),
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
            return { items: [], datasetVersion: 'unavailable', coverageArea: areaId };
          }
        }

        let places = (MOCK_PLACES[closestCityId] || []).map(place => ({
          ...place,
          distanceMeters: getDistance({ latitude: lat, longitude: lon }, place.location),
          freshness: 'unknown' as const,
        })).filter(place => place.distanceMeters <= radiusMeters);

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
          items: places.slice(0, 50),
          datasetVersion: `sample-${areaId}`,
          coverageArea: areaId
        };
      }
    );
  }

  // GET /v1/places/{id}
  public async getPlaceById(id: string): Promise<Place> {
    return this.safeFetch(`/places/${encodeURIComponent(id)}`, { method: 'GET' }, () => {
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
    if (!origin || !destination) {
      throw this.buildRFC9457Error('VALIDATION_FAILED', 'Missing Route Coordinates', 400, 'Both origin and destination are required.');
    }
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
          origin,
          destination,
          mode
        })
      }
    );
  }

  // GET /v1/content/{country}/{locale}
  public async getEmergencyDossier(countryCode: string): Promise<EmergencyDossier> {
    return this.safeFetch(
      `/content/${encodeURIComponent(countryCode.toUpperCase())}/en-US`,
      { method: 'GET' },
      () => {
        const code = countryCode.toUpperCase();
        const dossier = EMERGENCY_DOSSIERS[code];
        if (!dossier) throw this.buildRFC9457Error('COVERAGE_UNSUPPORTED', 'Emergency Information Unavailable', 422, 'Emergency information is unavailable for the selected country.');
        return dossier;
      }
    );
  }

  // GET /v1/briefing/{country}
  public async getCountryBriefing(countryCode: string): Promise<CountryBriefing> {
    return this.safeFetch(
      `/briefing/${encodeURIComponent(countryCode.toUpperCase())}`,
      { method: 'GET' },
      () => {
        const code = countryCode.toUpperCase();
        const briefing = COUNTRY_BRIEFINGS[code];
        if (!briefing) throw this.buildRFC9457Error('COVERAGE_UNSUPPORTED', 'Country Information Unavailable', 422, 'Information is unavailable for the selected country.');
        return briefing;
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
        const city = CITIES.find(c => c.id === areaId);
        if (!city) throw this.buildRFC9457Error('COVERAGE_UNSUPPORTED', 'Weather Unavailable', 422, 'Coordinates are required for this location.');
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
    return this.safeFetch<LocalMarket>(`/markets/${encodeURIComponent(id)}`, { method: 'GET' }, fallback ? async () => {
      const market = await fallback();
      if (!market) throw this.buildRFC9457Error('OBJECT_NOT_FOUND', 'Market Not Found', 404, 'The requested market is unavailable.');
      return market;
    } : undefined);
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
