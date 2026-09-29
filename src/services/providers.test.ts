import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const json = (value: unknown) => ({ ok: true, json: async () => value });
const feature = (id: number, lat: number, lon: number, value = 'hospital', key = 'amenity') => ({
  properties: { osm_id: id, osm_type: 'N', osm_key: key, osm_value: value, name: `Place ${id}`, countrycode: 'gb' },
  geometry: { coordinates: [lon, lat] }
});

beforeEach(() => { vi.resetModules(); localStorage.clear(); vi.stubEnv('VITE_PHOTON_BASE_URL', 'https://photon.example'); });
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe('location providers', () => {
  it('shares nearby requests, respects the radius, and retains distinct colocated places', async () => {
    const fetchMock = vi.fn().mockResolvedValue(json({ features: [feature(1, 0, 0.001), feature(2, 0, 0.001), feature(3, 0, 0.01), feature(4, 0, 0.001, 'cafe')] }));
    vi.stubGlobal('fetch', fetchMock);
    const { osmService } = await import('./osmService');
    const [first, same] = await Promise.all([osmService.fetchNearbyPOIs(0, 0, 'hospital', 500), osmService.fetchNearbyPOIs(0, 0, 'hospital', 500)]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(first).toEqual(same);
    expect(first.map(p => p.id)).toEqual(['osm-N-1', 'osm-N-2']);
    expect(first.every(p => p.hours.status === 'unknown' && !p.emergencyCapable && !p.phone)).toBe(true);
    expect((await osmService.fetchNearbyPOIs(0, 0, 'hospital', 2000))).toHaveLength(3);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('recognizes hotels before generic tourism and queries restaurants directly', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(json({ features: [feature(1, 0, 0.001, 'hotel', 'tourism')] }))
      .mockResolvedValueOnce(json({ features: [feature(2, 0, 0.001, 'restaurant')] }));
    vi.stubGlobal('fetch', fetchMock);
    const { osmService } = await import('./osmService');
    expect((await osmService.fetchNearbyPOIs(0, 0, 'hotel'))[0]?.category).toBe('hotel');
    expect((await osmService.fetchNearbyPOIs(0, 0, 'restaurant'))[0]?.category).toBe('restaurant');
    expect(String(fetchMock.mock.calls[1][0])).toContain('amenity%3Arestaurant');
  });

  it('returns no hospital when the provider is unavailable instead of a pilot-city fallback', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    const { osmService } = await import('./osmService');
    await expect(osmService.fetchNearestHospital(-33.8, 151.2)).resolves.toBeNull();
    await expect(osmService.reverseGeocode(-33.8, 151.2)).resolves.toMatchObject({ countryCode: '' });
  });

  it('does not manufacture a route on failure or use a car graph for walking', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('offline'));
    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv('VITE_OSRM_WALKING_BASE_URL', '');
    vi.stubEnv('VITE_OSRM_DRIVING_BASE_URL', 'https://routing.example');
    const { osmService } = await import('./osmService');
    const origin = { latitude: 0, longitude: 0 };
    const target = { latitude: 0.01, longitude: 0 };
    await expect(osmService.fetchLiveOSRMRoute(origin, target, 'walking')).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
    await expect(osmService.fetchLiveOSRMRoute(origin, target, 'driving')).resolves.toBeNull();
  });
});

describe('weather and exchange rates', () => {
  it('coalesces weather requests while preserving each caller city label', async () => {
    const fetchMock = vi.fn().mockResolvedValue(json({
      current: { temperature_2m: 19, apparent_temperature: 18, relative_humidity_2m: 70, weather_code: 3, is_day: 1, time: '2026-09-28T10:00' },
      daily: { temperature_2m_max: [22], temperature_2m_min: [15] }, utc_offset_seconds: 3600,
      hourly: { time: ['2026-09-28T10:00'], temperature_2m: [19], weather_code: [3] }
    }));
    vi.stubGlobal('fetch', fetchMock);
    const { weatherService } = await import('./weatherService');
    const result = await Promise.all([weatherService.getLiveWeather(51, 0, 'City A'), weatherService.getLiveWeather(51, 0, 'City B')]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.map(r => r.city)).toEqual(['City A', 'City B']);
    expect(result[0].observedAt).toBe('2026-09-28T09:00:00.000Z');
  });

  it('rejects missing weather instead of returning fabricated temperatures', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json({})));
    const { weatherService } = await import('./weatherService');
    await expect(weatherService.getLiveWeather(0, 0)).rejects.toThrow('incomplete data');
  });

  it('shares rate refreshes and validates local cache input', async () => {
    localStorage.setItem('travel_fx_rates_cache_v2', JSON.stringify({ base: 'USD', rates: { USD: 1, EUR: -2 }, lastFetched: Date.now() + 100_000 }));
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json({ result: 'success', base_code: 'USD', rates: { USD: 1, EUR: 0.9 }, time_last_update_utc: '2026-09-28T00:00:00Z' })));
    const { fxService } = await import('./fxService');
    expect(fxService.getCachedRates()).toBeNull();
    const rates = await Promise.all([fxService.getRates(true), fxService.getRates(true)]);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(rates[0].rates.EUR).toBe(0.9);
    vi.mocked(fetch).mockRejectedValue(new Error('offline'));
    expect(await fxService.getRates(true)).toMatchObject({ isLive: false });
  });

  it('times out the secondary FX provider and never substitutes mock rates', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn().mockRejectedValueOnce(new Error('primary offline')).mockImplementation(() => new Promise(() => {})));
    const { fxService } = await import('./fxService');
    const request = fxService.getRates();
    const assertion = expect(request).rejects.toThrow('timed out');
    await vi.advanceTimersByTimeAsync(6001);
    await assertion;
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(vi.getTimerCount()).toBe(0);
  });
});
