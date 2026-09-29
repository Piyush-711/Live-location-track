import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it, vi } from 'vitest';
import { RoutePreviewModal } from './RoutePreviewModal';
import { api } from '../services/api';
import { Place } from '../types';
vi.mock('../services/api', () => ({ api: { getRoute: vi.fn() } }));
vi.mock('../components/LiveLeafletMap', () => ({ LiveLeafletMap: () => null }));

describe('route failures', () => {
  it('cannot start an invented route while loading or after a provider error', async () => {
    (globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
    let reject!: (reason: Error) => void;
    vi.mocked(api.getRoute).mockImplementation(() => new Promise((_resolve, fail) => { reject = fail; }));
    const element = document.createElement('div');
    const root = createRoot(element);
    const start = vi.fn();
    const place: Place = { id: '1', name: 'Hospital', category: 'hospital', location: { latitude: 1, longitude: 2 }, distanceMeters: 10,
      countryCode: '', city: '', address: '', hours: { status: 'unknown', raw: null }, source: 'OSM', sourceUpdatedAt: '', freshness: 'unknown' };
    act(() => root.render(<RoutePreviewModal place={place} mode="walking" userLocation={{ latitude: 0, longitude: 0 }} onClose={() => {}} onStartLiveNavigation={start} />));
    const button = () => [...element.querySelectorAll('button')].find(item => item.textContent?.includes('Open Route Guide'))!;
    expect(button().disabled).toBe(true);
    await act(async () => { reject(new Error('Walking routes unavailable')); });
    expect(button().disabled).toBe(true);
    expect(element.querySelector('[role="alert"]')?.textContent).toContain('Walking routes unavailable');
    act(() => button().click());
    expect(start).not.toHaveBeenCalled();
    expect(element.textContent).not.toContain('Head directly toward');
    act(() => root.unmount());
  });
});
