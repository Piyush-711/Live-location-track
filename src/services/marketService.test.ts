import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { LiveLocationState } from '../hooks/useLiveLocation';

vi.mock('./api', () => ({ api: {
  getMarkets: vi.fn((_params, fallback) => fallback()),
  getMarketById: vi.fn((_id, fallback) => fallback())
} }));
import { api } from './api';
import { marketService } from './marketService';

function location(latitude: number, longitude: number, cityName: string): LiveLocationState {
  return { coords: { latitude, longitude }, cityName, countryCode: '', matchedCityId: 'custom',
    accuracyMeters: 0, altitudeMeters: null, heading: null, speed: null, status: 'fixed',
    lastUpdated: '', isSimulated: false };
}

beforeEach(() => vi.stubEnv('VITE_PHOTON_BASE_URL', 'https://photon.example'));
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe('market discovery', () => {
  it('keeps successful empty backend results authoritative', async () => {
    vi.mocked(api.getMarkets).mockResolvedValueOnce([]);
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    await expect(marketService.getLocalMarkets(location(28.61, 77.2, 'Delhi'))).resolves.toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('does not substitute markets from other countries when no local results exist', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    await expect(marketService.getLocalMarkets(location(-33.86, 151.2, 'Sydney'))).resolves.toEqual([]);
  });

  it('preserves locality and specialty constraints during search', async () => {
    const results = await marketService.getLocalMarkets(location(28.61, 77.2, 'Delhi'), 'electronics', 'jewelry');
    expect(results.every(market => market.specialty === 'jewelry' && (market.distanceMeters || 0) <= 55_000)).toBe(true);
    const local = await marketService.getLocalMarkets(location(51.51, -0.12, 'London'));
    expect(local.length).toBeGreaterThan(0);
    expect(marketService.marketToPlace(local[0])).toMatchObject({ countryCode: 'GB', hours: { status: 'unknown' }, freshness: 'unknown' });
  });
});
