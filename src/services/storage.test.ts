import { beforeEach, describe, expect, it, vi } from 'vitest';
import { StorageService } from './storage';
import { MOCK_PLACES } from '../data/mockData';

const places = Object.values(MOCK_PLACES).flat();

beforeEach(() => {
  localStorage.clear();
  // Model the browser's cross-context exclusive lock scheduling.
  const queues = new Map<string, Promise<unknown>>();
  Object.defineProperty(navigator, 'locks', { configurable: true, value: {
    request: (name: string, callback: () => unknown) => {
      const result = (queues.get(name) || Promise.resolve()).then(callback);
      queues.set(name, result.catch(() => {}));
      return result;
    },
  } });
});

describe('device saved places', () => {
  it('preserves simultaneous saves of different places from two clients', async () => {
    const first = new StorageService();
    const second = new StorageService();
    await Promise.all([first.toggleSavePlace(places[0]), second.toggleSavePlace(places[1])]);
    expect(first.getSavedPlaces().map(p => p.placeId).sort()).toEqual([places[0].id, places[1].id].sort());
    expect(new StorageService().getSavedPlaces()).toHaveLength(2);
  });

  it('serializes same-place updates and persists the current ETag', async () => {
    const first = new StorageService();
    const second = new StorageService();
    const results = await Promise.all([first.toggleSavePlace(places[0]), second.toggleSavePlace(places[0])]);
    expect(results.map(r => r.saved)).toEqual([true, false]);
    expect(first.getSavedPlaces()).toEqual([]);
    expect(first.getAllTombstonesAndSaves()[0]).toMatchObject({ version: '2', eTag: results[1].eTag });
  });

  it('migrates an existing legacy save without resurrecting it after removal', async () => {
    localStorage.setItem('local_v8_saved_places', JSON.stringify([{
      placeId: places[0].id, place: places[0], version: '9', deleted_at: null,
      account_id: 'acc-guest-local', updated_at: '', eTag: 'old',
    }]));
    const store = new StorageService();
    expect(store.getSavedPlaces()).toHaveLength(1);
    await store.toggleSavePlace(places[0]);
    expect(new StorageService().getSavedPlaces()).toEqual([]);
    expect(store.getAllTombstonesAndSaves()[0].version).toBe('10');
  });

  it('keeps good records when the legacy JSON is malformed', async () => {
    const store = new StorageService();
    await store.toggleSavePlace(places[0]);
    localStorage.setItem('local_v8_saved_places', '{broken');
    expect(store.getSavedPlaces()).toHaveLength(1);
  });

  it('reports a failed write and emits no success event', async () => {
    const store = new StorageService();
    const listener = vi.fn();
    const unsubscribe = store.subscribeSavedPlaces(listener);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('Full', 'QuotaExceededError'); });
    await expect(store.toggleSavePlace(places[0])).rejects.toThrow('storage is full');
    expect(listener).not.toHaveBeenCalled();
    expect(store.getSavedPlaces()).toEqual([]);
    unsubscribe();
  });

  it('notifies same-tab and other-tab readers and removes listeners', async () => {
    const store = new StorageService();
    const listener = vi.fn();
    const unsubscribe = store.subscribeSavedPlaces(listener);
    await store.toggleSavePlace(places[0]);
    window.dispatchEvent(new StorageEvent('storage', { key: 'local_v9_saved_place:other' }));
    expect(listener).toHaveBeenCalledTimes(2);
    unsubscribe();
    window.dispatchEvent(new StorageEvent('storage', { key: null }));
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('does not claim that sample offline packs are installed or signed', () => {
    const store = new StorageService();
    expect(store.getTotalInstalledBytes()).toBe(0);
    expect(store.getOfflinePacks().every(p => !p.installed && !p.manifest.signature)).toBe(true);
  });
});
