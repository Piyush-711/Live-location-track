import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiService } from './api';
import { osmService } from './osmService';

vi.mock('./osmService', () => ({ osmService: { fetchNearbyPOIs: vi.fn(), fetchLiveOSRMRoute: vi.fn() } }));

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
});
afterEach(() => vi.unstubAllGlobals());

describe('API error and fallback behavior', () => {
  it.each([400, 401, 403, 404, 409, 412, 429])('preserves HTTP %s instead of fabricating report success', async status => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ code: 'SERVER_REJECTION', detail: 'Rejected' }), { status }));
    await expect(new ApiService().submitReport({ placeId: 'p1', issueCategory: 'hours', description: 'Changed hours' }))
      .rejects.toMatchObject({ status, code: 'SERVER_REJECTION' });
  });

  it('does not silently queue an offline report as received', async () => {
    vi.mocked(fetch).mockRejectedValue(new TypeError('Network offline'));
    await expect(new ApiService().submitReport({ placeId: 'p1', issueCategory: 'hours', description: 'Changed hours' }))
      .rejects.toMatchObject({ status: 503 });
  });

  it('uses bundled read data only for availability failures', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response('{}', { status: 503 }));
    await expect(new ApiService().getCountryBriefing('JP')).resolves.toMatchObject({ countryCode: 'JP' });
  });

  it('never substitutes Japanese emergency information for an unsupported country', async () => {
    vi.mocked(fetch).mockRejectedValue(new TypeError('offline'));
    await expect(new ApiService().getEmergencyDossier('ZZ')).rejects.toMatchObject({ code: 'COVERAGE_UNSUPPORTED' });
  });

  it('keeps an empty nearby provider result without substituting unrelated places', async () => {
    vi.mocked(osmService.fetchNearbyPOIs).mockResolvedValue([]);
    const result = await new ApiService().getNearbyPlaces('custom', 'all', undefined, 1000, { latitude: 0, longitude: 0 });
    expect(result.items).toEqual([]);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('does not construct navigation when routing is unavailable', async () => {
    vi.mocked(osmService.fetchLiveOSRMRoute).mockRejectedValue(new Error('Unavailable'));
    vi.mocked(fetch).mockResolvedValue(new Response('{}', { status: 503 }));
    await expect(new ApiService().getRoute('kyoto', 'walking', { latitude: 0, longitude: 0 }, { latitude: 0.01, longitude: 0.01 }))
      .rejects.toMatchObject({ status: 503 });
  });
});
