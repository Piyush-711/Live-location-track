import { describe, expect, it } from 'vitest';
import { createPlaceMarker } from './mapMarker';
import { Place } from '../types';

const place: Place = {
  id: 'test', name: '<img src=x onerror=alert(1)>', category: 'cafe', distanceMeters: 12,
  location: { latitude: 1, longitude: 2 }, countryCode: '', city: '', address: '',
  hours: { status: 'unknown', raw: null }, source: 'OSM', sourceUpdatedAt: '', freshness: 'unknown'
};

describe('map marker untrusted content', () => {
  it('renders external names as text and image attributes as data', () => {
    const node = createPlaceMarker({ ...place, imageUrl: 'https://example.test/image" onerror="alert(1)' }, false);
    expect(node.textContent).toContain(place.name);
    expect(node.querySelectorAll('img')).toHaveLength(1);
    expect(node.querySelector('[onerror]')).toBeNull();
    expect(node.querySelector('script')).toBeNull();
  });
  it('rejects non-http image protocols', () => {
    const node = createPlaceMarker({ ...place, imageUrl: 'javascript:alert(1)' }, false);
    expect(node.querySelector('img')?.getAttribute('src') || '').not.toMatch(/^(javascript|data|file):/i);
    expect(node.textContent).toContain(place.name);
  });
});
