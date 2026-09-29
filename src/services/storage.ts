import { Place, SavedPlace, OfflinePack, VoiceSettings, CorrectionReportRequest } from '../types';
import { MOCK_OFFLINE_PACKS } from '../data/mockData';
import { LiveLocationState } from '../hooks/useLiveLocation';

const STORAGE_KEYS = {
  SAVED_PLACES: 'local_v8_saved_places',
  OFFLINE_PACKS: 'local_v8_offline_packs',
  VOICE_SETTINGS: 'local_v8_voice_settings',
  STORE_EPOCH: 'local_v8_store_epoch',
  SYNC_GENERATION: 'local_v8_sync_generation',
  ACTIVE_CITY: 'local_v8_active_city',
  CORRECTION_REPORTS: 'local_v8_correction_reports'
};
const SAVED_PREFIX = 'local_v9_saved_place:';
const SAVED_EVENT = 'local:saved-places-changed';

function isSavedPlace(value: unknown): value is SavedPlace {
  if (!value || typeof value !== 'object') return false;
  const item = value as SavedPlace;
  return typeof item.placeId === 'string' && !!item.place && item.place.id === item.placeId
    && typeof item.place.name === 'string' && !!item.place.location
    && Number.isFinite(item.place.location.latitude) && Number.isFinite(item.place.location.longitude)
    && typeof item.version === 'string' && /^\d+$/.test(item.version)
    && (item.deleted_at === null || typeof item.deleted_at === 'string');
}

// Generate UUID v4
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Safe storage access helpers to prevent quota and private browsing crashes
function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    console.warn('Storage safeSetItem warning:', e);
  }
}

export class StorageService {
  private storeEpoch: string;
  private generation: string;

  constructor() {
    this.storeEpoch = safeGetItem(STORAGE_KEYS.STORE_EPOCH) || generateUUID();
    safeSetItem(STORAGE_KEYS.STORE_EPOCH, this.storeEpoch);

    this.generation = safeGetItem(STORAGE_KEYS.SYNC_GENERATION) || '1';
    safeSetItem(STORAGE_KEYS.SYNC_GENERATION, this.generation);

    // Pack metadata is a preview; no downloaded or verified pack bytes exist yet.
  }

  public getStoreEpoch(): string {
    return this.storeEpoch;
  }

  public getGeneration(): string {
    return this.generation;
  }

  // --- Saved Places (Section 12 & 22.4) ---
  public getSavedPlaces(): SavedPlace[] {
    return this.getAllTombstonesAndSaves().filter(item => !item.deleted_at);
  }

  public getAllTombstonesAndSaves(): SavedPlace[] {
    const records = new Map<string, SavedPlace>();
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SAVED_PLACES);
      const legacy: unknown = data ? JSON.parse(data) : [];
      if (Array.isArray(legacy)) {
        for (const item of legacy.filter(isSavedPlace)) records.set(item.placeId, item);
      }
    } catch { /* Preserve readable per-place records even if legacy data is corrupt. */ }
    try {
      for (let index = 0; index < localStorage.length; index++) {
        const key = localStorage.key(index);
        if (!key?.startsWith(SAVED_PREFIX)) continue;
        try {
          const item: unknown = JSON.parse(localStorage.getItem(key) || 'null');
          if (isSavedPlace(item) && key === this.savedKey(item.placeId)) records.set(item.placeId, item);
        } catch { /* Ignore only the damaged entry. */ }
      }
    } catch { /* Storage may be disabled by the browser. */ }
    return [...records.values()].sort((a, b) => a.placeId.localeCompare(b.placeId));
  }

  public isPlaceSaved(placeId: string): boolean {
    const list = this.getSavedPlaces();
    return list.some(item => item.placeId === placeId);
  }

  private savedKey(placeId: string): string {
    return `${SAVED_PREFIX}${encodeURIComponent(placeId)}`;
  }

  public subscribeSavedPlaces(listener: () => void): () => void {
    const onStorage = (event: StorageEvent) => {
      if (!event.key || event.key.startsWith(SAVED_PREFIX) || event.key === STORAGE_KEYS.SAVED_PLACES) listener();
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener(SAVED_EVENT, listener);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(SAVED_EVENT, listener);
    };
  }

  public async toggleSavePlace(place: Place): Promise<{ saved: boolean; eTag: string }> {
    if (!navigator.locks) {
      throw new Error('Saving requires a browser with Web Locks on HTTPS or localhost.');
    }
    return navigator.locks.request(this.savedKey(place.id), () => {
      const current = this.getAllTombstonesAndSaves().find(item => item.placeId === place.id);
      const now = new Date().toISOString();
      const saved = !current || current.deleted_at !== null;
      const version = String(BigInt(current?.version || '0') + 1n);
      const epoch = safeGetItem(STORAGE_KEYS.STORE_EPOCH) || this.storeEpoch;
      const eTag = `"${epoch}:${this.generation}:${place.id}:${version}"`;
      const record: SavedPlace = {
        placeId: place.id,
        account_id: `device:${epoch}`,
        version,
        deleted_at: saved ? null : now,
        updated_at: now,
        place,
        eTag,
      };
      // One key per place avoids overwriting other tabs' unrelated changes.
      // Web Locks serialize changes to the same place across tabs.
      try {
        localStorage.setItem(this.savedKey(place.id), JSON.stringify(record));
      } catch {
        throw new Error('Could not save this place. Browser storage is full or unavailable.');
      }
      window.dispatchEvent(new Event(SAVED_EVENT));
      return { saved, eTag };
    });
  }

  // --- Offline Packs (Section 13) ---
  public getOfflinePacks(): OfflinePack[] {
    return MOCK_OFFLINE_PACKS.map(pack => ({
      ...pack, installed: false, installing: false, progress: 0,
      manifest: { ...pack.manifest, hashes: {}, lengths: {}, signature: '', keyId: '' },
    }));
  }

  public updatePackStatus(_packId: string, installed: boolean): void {
    if (installed) throw new Error('Offline pack downloads are not available.');
  }

  // --- Dynamic Location Matching & On-Demand Pack Generation ---
  public getPackForLocation(location?: LiveLocationState): OfflinePack {
    const packs = this.getOfflinePacks();
    if (!location) {
      return packs.find(p => p.installed) || packs[0];
    }

    const cityId = (location.matchedCityId || '').toLowerCase();
    const cityName = (location.cityName || '').toLowerCase();
    const countryCode = (location.countryCode || '').toUpperCase();
    const coords = location.coords;

    // 1. Direct city identifier / keyword matching
    if (
      cityId === 'vijayawada' ||
      cityName.includes('vijayawada') ||
      cityName.includes('amaravati') ||
      cityName.includes('klef') ||
      cityName.includes('andhra') ||
      cityName.includes('guntur') ||
      cityName.includes('krishna')
    ) {
      const p = packs.find(p => p.id === 'pack-ap-amaravati-v10' || p.areaId === 'vijayawada');
      if (p) return p;
    }

    if (
      cityId === 'mumbai' ||
      cityName.includes('mumbai') ||
      cityName.includes('bombay') ||
      cityName.includes('maharashtra') ||
      cityName.includes('thane')
    ) {
      const p = packs.find(p => p.id === 'pack-mumbai-v29' || p.areaId === 'mumbai');
      if (p) return p;
    }

    if (
      cityId === 'delhi' ||
      cityName.includes('delhi') ||
      cityName.includes('ncr') ||
      cityName.includes('noida') ||
      cityName.includes('gurugram') ||
      cityName.includes('faridabad')
    ) {
      const p = packs.find(p => p.id === 'pack-delhi-v33' || p.areaId === 'delhi');
      if (p) return p;
    }

    if (
      cityId === 'goa' ||
      cityName.includes('goa') ||
      cityName.includes('panaji') ||
      cityName.includes('calangute') ||
      cityName.includes('baga') ||
      cityName.includes('margao')
    ) {
      const p = packs.find(p => p.id === 'pack-goa-v18' || p.areaId === 'goa');
      if (p) return p;
    }

    if (
      cityId === 'paris' ||
      cityName.includes('paris') ||
      cityName.includes('france') ||
      cityName.includes('versailles')
    ) {
      const p = packs.find(p => p.id === 'pack-paris-v45' || p.areaId === 'paris');
      if (p) return p;
    }

    if (
      cityId === 'london' ||
      cityName.includes('london') ||
      cityName.includes('westminster') ||
      cityName.includes('soho')
    ) {
      const p = packs.find(p => p.id === 'pack-london-v38' || p.areaId === 'london');
      if (p) return p;
    }

    if (
      cityId === 'newyork' ||
      cityName.includes('new york') ||
      cityName.includes('manhattan') ||
      cityName.includes('brooklyn') ||
      cityName.includes('queens')
    ) {
      const p = packs.find(p => p.id === 'pack-nyc-v40' || p.areaId === 'newyork');
      if (p) return p;
    }

    if (
      cityId === 'kyoto' ||
      cityName.includes('kyoto') ||
      cityName.includes('kansai') ||
      cityName.includes('gion') ||
      cityName.includes('osaka')
    ) {
      const p = packs.find(p => p.id === 'pack-kyoto-v42' || p.areaId === 'kyoto');
      if (p) return p;
    }

    if (
      cityId === 'sydney' ||
      cityName.includes('sydney') ||
      cityName.includes('nsw')
    ) {
      const p = packs.find(p => p.id === 'pack-syd-v31' || p.areaId === 'sydney');
      if (p) return p;
    }

    // 2. Coordinate geographic proximity checks (within ~350 km)
    if (coords && Number.isFinite(coords.latitude) && Number.isFinite(coords.longitude)) {
      // Andhra Pradesh / Amaravati / Vijayawada (~16.4, 80.6)
      if (Math.abs(coords.latitude - 16.5) < 3.5 && Math.abs(coords.longitude - 80.6) < 3.5) {
        const p = packs.find(p => p.id === 'pack-ap-amaravati-v10');
        if (p) return p;
      }
      // Mumbai (~18.9, 72.8)
      if (Math.abs(coords.latitude - 18.9) < 2.5 && Math.abs(coords.longitude - 72.8) < 2.5) {
        const p = packs.find(p => p.id === 'pack-mumbai-v29');
        if (p) return p;
      }
      // Delhi (~28.6, 77.2)
      if (Math.abs(coords.latitude - 28.6) < 2.5 && Math.abs(coords.longitude - 77.2) < 2.5) {
        const p = packs.find(p => p.id === 'pack-delhi-v33');
        if (p) return p;
      }
      // Goa (~15.4, 73.8)
      if (Math.abs(coords.latitude - 15.4) < 2.0 && Math.abs(coords.longitude - 73.8) < 2.0) {
        const p = packs.find(p => p.id === 'pack-goa-v18');
        if (p) return p;
      }
      // Paris (~48.8, 2.35)
      if (Math.abs(coords.latitude - 48.8) < 2.5 && Math.abs(coords.longitude - 2.35) < 2.5) {
        const p = packs.find(p => p.id === 'pack-paris-v45');
        if (p) return p;
      }
      // London (~51.5, -0.12)
      if (Math.abs(coords.latitude - 51.5) < 2.5 && Math.abs(coords.longitude - (-0.12)) < 2.5) {
        const p = packs.find(p => p.id === 'pack-london-v38');
        if (p) return p;
      }
      // New York (~40.7, -74.0)
      if (Math.abs(coords.latitude - 40.7) < 2.5 && Math.abs(coords.longitude - (-74.0)) < 2.5) {
        const p = packs.find(p => p.id === 'pack-nyc-v40');
        if (p) return p;
      }
      // Kyoto (~35.0, 135.7)
      if (Math.abs(coords.latitude - 35.0) < 2.5 && Math.abs(coords.longitude - 135.7) < 2.5) {
        const p = packs.find(p => p.id === 'pack-kyoto-v42');
        if (p) return p;
      }
    }

    // 3. Fallback country-level matching
    if (countryCode === 'IN') {
      const p = packs.find(p => p.country === 'India');
      if (p) return p;
    } else if (countryCode === 'FR') {
      const p = packs.find(p => p.country === 'France');
      if (p) return p;
    } else if (countryCode === 'GB') {
      const p = packs.find(p => p.country === 'United Kingdom');
      if (p) return p;
    } else if (countryCode === 'US') {
      const p = packs.find(p => p.country === 'United States');
      if (p) return p;
    } else if (countryCode === 'JP') {
      const p = packs.find(p => p.country === 'Japan');
      if (p) return p;
    } else if (countryCode === 'AU') {
      const p = packs.find(p => p.country === 'Australia');
      if (p) return p;
    }

    // 4. On-demand dynamic pack synthesis for any custom searched city
    return this.getOrGenerateCustomPack(location);
  }

  public getOrGenerateCustomPack(location?: LiveLocationState): OfflinePack {
    const rawName = location?.cityName || 'Custom Regional Area';
    const cleanName = (rawName.split(',')[0] || 'Regional Area').trim();
    const slug = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 18) || 'custom';
    const packId = `pack-custom-${slug}-v1`;

    const allPacks = this.getOfflinePacks();
    const existing = allPacks.find(p => p.id === packId || p.areaId === slug);
    if (existing) return existing;

    const lat = location?.coords?.latitude ?? 20;
    const lng = location?.coords?.longitude ?? 78;
    const sizeMB = 680 + Math.abs(Math.round((lat * 19 + lng * 23) % 360));
    const sizeBytes = sizeMB * 1024 * 1024;
    const sizeFormatted = sizeMB >= 1000 ? `${(sizeMB / 1024).toFixed(2)} GB` : `${sizeMB} MB`;
    const country = location?.countryCode ? `Country Code [${location.countryCode}]` : 'Global Territory';

    const dynamicPack: OfflinePack = {
      id: packId,
      areaId: slug,
      name: `${cleanName} & Surrounding District`,
      country,
      sizeBytes,
      sizeFormatted,
      version: '1.0.0-synced',
      installed: false,
      manifest: {
        packId,
        areaId: slug,
        version: '1.0.0',
        schemaVersion: 'v8-2026',
        hashes: {},
        lengths: {},
        issuedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
        keyId: '',
        signature: ''
      }
    };

    return dynamicPack;
  }

  public getTotalInstalledBytes(): number {
    return this.getOfflinePacks()
      .filter(p => p.installed)
      .reduce((acc, p) => acc + (p.sizeBytes || 0), 0);
  }

  public getTotalInstalledFormatted(): string {
    const bytes = this.getTotalInstalledBytes();
    if (bytes === 0) return '0 MB';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1000) {
      return `${(mb / 1024).toFixed(2)} GB`;
    }
    return `${Math.round(mb)} MB`;
  }

  // --- Voice Settings (Screen 3) ---
  public getVoiceSettings(): VoiceSettings {
    try {
      const data = safeGetItem(STORAGE_KEYS.VOICE_SETTINGS);
      if (data) return JSON.parse(data);
    } catch {}
    return {
      volumeMode: 'standard',
      speechRate: 1.0,
      language: 'en-US',
      ttsEngineReady: true,
      chimesEnabled: true
    };
  }

  public saveVoiceSettings(settings: VoiceSettings): void {
    safeSetItem(STORAGE_KEYS.VOICE_SETTINGS, JSON.stringify(settings));
  }

  // --- City Selection ---
  public getActiveCityId(): string {
    return safeGetItem(STORAGE_KEYS.ACTIVE_CITY) || 'kyoto';
  }

  public setActiveCityId(cityId: string): void {
    safeSetItem(STORAGE_KEYS.ACTIVE_CITY, cityId);
  }

  // --- Correction Reports ---
  public saveCorrectionReport(report: CorrectionReportRequest): string {
    const reportId = `rep-${generateUUID()}`;
    localStorage.setItem(`${STORAGE_KEYS.CORRECTION_REPORTS}:${reportId}`, JSON.stringify({
      ...report, reportId, receivedAt: new Date().toISOString(), status: 'SAVED_ON_DEVICE',
    }));
    return reportId;
  }
}

export const storage = new StorageService();
