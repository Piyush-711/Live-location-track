import { afterEach, describe, expect, it, vi } from 'vitest';
import { RequestCache, fetchProviderJson, providerBaseUrl, validCoordinates } from './providerRequest';

afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe('provider request controls', () => {
  it('coalesces concurrent refreshes and allows retry after failure', async () => {
    const cache = new RequestCache<number>(2, 1000);
    let resolve!: (value: number) => void;
    const loader = vi.fn(() => new Promise<number>(done => { resolve = done; }));
    const first = cache.load('same', loader);
    const second = cache.load('same', loader, true);
    await Promise.resolve();
    expect(loader).toHaveBeenCalledTimes(1);
    resolve(7);
    expect(await Promise.all([first, second])).toEqual([7, 7]);
    await expect(cache.load('bad', async () => { throw new Error('offline'); })).rejects.toThrow('offline');
    await expect(cache.load('bad', async () => 9)).resolves.toBe(9);
  });

  it('evicts least recently used entries and expires cached values', async () => {
    vi.useFakeTimers();
    const cache = new RequestCache<number>(2, 1000);
    await cache.load('a', async () => 1);
    await cache.load('b', async () => 2);
    expect(cache.get('a')).toBe(1);
    await cache.load('c', async () => 3);
    expect(cache.get('b')).toBeUndefined();
    vi.advanceTimersByTime(1001);
    expect(cache.get('a')).toBeUndefined();
    expect(cache.get('c')).toBeUndefined();
  });

  it('aborts a stalled response body and releases its timer', async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: () => new Promise(() => {}) });
    vi.stubGlobal('fetch', fetchMock);
    const request = fetchProviderJson('https://provider.example/data', 100);
    const assertion = expect(request).rejects.toThrow('timed out');
    await vi.advanceTimersByTimeAsync(101);
    await assertion;
    expect(fetchMock.mock.calls[0][1].signal.aborted).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('limits concurrent outbound fetches to four', async () => {
    const releases: Array<() => void> = [];
    let concurrent = 0;
    let maximum = 0;
    vi.stubGlobal('fetch', vi.fn(async () => {
      concurrent++;
      maximum = Math.max(maximum, concurrent);
      await new Promise<void>(resolve => releases.push(() => { concurrent--; resolve(); }));
      return { ok: true, json: async () => ({ ok: true }) };
    }));
    const requests = Array.from({ length: 8 }, (_, i) => fetchProviderJson(`https://provider.example/${i}`));
    await vi.waitFor(() => expect(releases).toHaveLength(4));
    releases.splice(0).forEach(release => release());
    await vi.waitFor(() => expect(releases).toHaveLength(4));
    releases.splice(0).forEach(release => release());
    await Promise.all(requests);
    expect(maximum).toBe(4);
  });

  it('rejects invalid coordinates and secret-bearing provider URLs', () => {
    expect(validCoordinates(Infinity, 30)).toBe(false);
    expect(validCoordinates(30, 181)).toBe(false);
    expect(validCoordinates(0, 0)).toBe(true);
    vi.stubEnv('VITE_PHOTON_BASE_URL', 'https://user:secret@example.com');
    expect(() => providerBaseUrl('VITE_PHOTON_BASE_URL')).toThrow('Invalid public provider URL');
    vi.stubEnv('VITE_PHOTON_BASE_URL', '/providers/photon/');
    expect(providerBaseUrl('VITE_PHOTON_BASE_URL')).toBe('/providers/photon');
    vi.stubEnv('VITE_PHOTON_BASE_URL', '/providers/photon?key=secret');
    expect(() => providerBaseUrl('VITE_PHOTON_BASE_URL')).toThrow('Invalid public provider URL');
  });
});
