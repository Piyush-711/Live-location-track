import { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { useLiveLocation, validCoordinates } from './useLiveLocation';
import { osmService } from '../services/osmService';

vi.mock('../services/osmService', () => ({ osmService: { reverseGeocode: vi.fn() } }));
let root: Root;
let output: ReturnType<typeof useLiveLocation>;
let watchers: PositionCallback[];
let clearWatch: ReturnType<typeof vi.fn>;
function Harness() { output = useLiveLocation('hyderabad'); return null; }
const position = (latitude: number, longitude: number) => ({
  coords: { latitude, longitude, accuracy: 4, altitude: 0, heading: 0, speed: 0 }, timestamp: Date.now()
}) as GeolocationPosition;

beforeEach(() => {
  (globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
  localStorage.clear();
  watchers = [];
  clearWatch = vi.fn();
  Object.defineProperty(navigator, 'geolocation', { configurable: true, value: {
    watchPosition: vi.fn((success: PositionCallback) => { watchers.push(success); return watchers.length; }), clearWatch
  } });
  vi.mocked(osmService.reverseGeocode).mockImplementation(() => new Promise(() => {}));
  root = createRoot(document.createElement('div'));
});
afterEach(() => { act(() => root.unmount()); });

describe('GPS watcher lifecycle', () => {
  it('keeps only one watch when GPS is requested repeatedly and clears it on unmount', () => {
    act(() => root.render(<Harness />));
    act(() => output.requestLiveGPS());
    act(() => output.requestLiveGPS());
    expect(watchers).toHaveLength(3);
    expect(clearWatch.mock.calls).toEqual([[1], [2]]);
    act(() => output.setCustomLocation({ latitude: 51, longitude: 0, cityName: 'Custom' }));
    expect(clearWatch).toHaveBeenLastCalledWith(3);
    act(() => watchers[2](position(10, 20)));
    expect(output.location.cityName).toBe('Custom');
  });
  it('rejects stale reverse geocoding responses after a newer GPS location', async () => {
    let first!: (value: Awaited<ReturnType<typeof osmService.reverseGeocode>>) => void;
    let second!: typeof first;
    vi.mocked(osmService.reverseGeocode)
      .mockImplementationOnce(() => new Promise(resolve => { first = resolve; }))
      .mockImplementationOnce(() => new Promise(resolve => { second = resolve; }));
    act(() => root.render(<Harness />));
    act(() => watchers[0](position(17.38, 78.48)));
    act(() => watchers[0](position(17.50, 78.60)));
    await act(async () => { second({ cityName: 'New location', countryCode: 'IN', district: '', displayName: 'New location' }); });
    await act(async () => { first({ cityName: 'Old location', countryCode: 'JP', district: '', displayName: 'Old location' }); });
    expect(output.location.cityName).toBe('New location');
    expect(output.location.countryCode).toBe('IN');
    expect(output.location.heading).toBe(0);
    expect(output.location.altitudeMeters).toBe(0);
  });
  it('rejects malformed persisted coordinates instead of treating them as a GPS fix', () => {
    localStorage.setItem('local_app_custom_location', '{"latitude":999,"longitude":0,"cityName":"Invalid"}');
    act(() => root.render(<Harness />));
    expect(output.location.isCustom).toBe(false);
    expect(watchers).toHaveLength(1);
    expect(validCoordinates(Infinity, 0)).toBe(false);
    expect(validCoordinates(0, -180)).toBe(true);
  });
});
