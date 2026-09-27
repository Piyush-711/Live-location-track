import { Place, SavedPlace, OfflinePack, VoiceSettings } from '../types';
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

class StorageService {
  private storeEpoch: string;
  private generation: string;

  constructor() {
    this.storeEpoch = localStorage.getItem(STORAGE_KEYS.STORE_EPOCH) || generateUUID();
    localStorage.setItem(STORAGE_KEYS.STORE_EPOCH, this.storeEpoch);

    this.generation = localStorage.getItem(STORAGE_KEYS.SYNC_GENERATION) || '1';
    localStorage.setItem(STORAGE_KEYS.SYNC_GENERATION, this.generation);

    // Initialize or migrate offline packs
    const rawPacks = localStorage.getItem(STORAGE_KEYS.OFFLINE_PACKS);
    if (!rawPacks) {
      localStorage.setItem(STORAGE_KEYS.OFFLINE_PACKS, JSON.stringify(MOCK_OFFLINE_PACKS));
    } else {
      try {
        const stored: OfflinePack[] = JSON.parse(rawPacks);
        // Merge missing certified packs
        let modified = false;
        for (const mockPack of MOCK_OFFLINE_PACKS) {
          if (!stored.some(p => p.id === mockPack.id)) {
            stored.push({ ...mockPack });
            modified = true;
          }
        }
        // If only Kyoto was installed from the legacy spec, enable Andhra Pradesh & Amaravati by default
        const onlyKyotoInstalled = stored.filter(p => p.installed).length === 1 && stored.find(p => p.id === 'pack-kyoto-v42')?.installed;
        if (onlyKyotoInstalled) {
          const apPack = stored.find(p => p.id === 'pack-ap-amaravati-v10');
          if (apPack) {
            apPack.installed = true;
            modified = true;
          }
        }
        if (modified) {
          localStorage.setItem(STORAGE_KEYS.OFFLINE_PACKS, JSON.stringify(stored));
        }
      } catch {
        localStorage.setItem(STORAGE_KEYS.OFFLINE_PACKS, JSON.stringify(MOCK_OFFLINE_PACKS));
      }
    }
  }

  public getStoreEpoch(): string {
    return this.storeEpoch;
  }

  public getGeneration(): string {
    return this.generation;
  }

  // --- Saved Places (Section 12 & 22.4) ---
  public getSavedPlaces(): SavedPlace[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SAVED_PLACES);
      if (!data) return [];
      const list: SavedPlace[] = JSON.parse(data);
      // Filter out tombstones for active presentation, but keep them internally for sync
      return list.filter(item => !item.deleted_at);
    } catch (e) {
      console.error('Error reading saved places', e);
      return [];
    }
  }

  public getAllTombstonesAndSaves(): SavedPlace[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SAVED_PLACES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public isPlaceSaved(placeId: string): boolean {
    const list = this.getSavedPlaces();
    return list.some(item => item.placeId === placeId);
  }

  public toggleSavePlace(place: Place): { saved: boolean; eTag: string } {
    const all = this.getAllTombstonesAndSaves();
    const existingIndex = all.findIndex(item => item.placeId === place.id);

    const now = new Date().toISOString();
    let isNowSaved = true;
    let newVersion = '1';

    if (existingIndex >= 0) {
      const current = all[existingIndex];
      if (current.deleted_at === null) {
        // Tombstone it (delete)
        current.deleted_at = now;
        current.updated_at = now;
        current.version = String(parseInt(current.version || '1', 10) + 1);
        isNowSaved = false;
        newVersion = current.version;
      } else {
        // Undelete / Re-save
        current.deleted_at = null;
        current.updated_at = now;
        current.version = String(parseInt(current.version || '1', 10) + 1);
        current.place = place;
        isNowSaved = true;
        newVersion = current.version;
      }
    } else {
      // New save
      const newSaved: SavedPlace = {
        placeId: place.id,
        account_id: 'acc-guest-local',
        version: '1',
        deleted_at: null,
        updated_at: now,
        place,
        eTag: `"${this.storeEpoch}:${this.generation}:${place.id}:1"`
      };
      all.push(newSaved);
      isNowSaved = true;
      newVersion = '1';
    }

    const strongETag = `"${this.storeEpoch}:${this.generation}:${place.id}:${newVersion}"`;
    localStorage.setItem(STORAGE_KEYS.SAVED_PLACES, JSON.stringify(all));
    return { saved: isNowSaved, eTag: strongETag };
  }

  // --- Offline Packs (Section 13) ---
  public getOfflinePacks(): OfflinePack[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.OFFLINE_PACKS);
      return data ? JSON.parse(data) : MOCK_OFFLINE_PACKS;
    } catch {
      return MOCK_OFFLINE_PACKS;
    }
  }

  public updatePackStatus(packId: string, installed: boolean): void {
    const packs = this.getOfflinePacks();
    const target = packs.find(p => p.id === packId);
    if (target) {
      target.installed = installed;
      target.installing = false;
      target.progress = installed ? 100 : 0;
      localStorage.setItem(STORAGE_KEYS.OFFLINE_PACKS, JSON.stringify(packs));
    }
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
    if (coords && coords.latitude && coords.longitude) {
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

  public getOrGenerateCustomPack(location: LiveLocationState): OfflinePack {
    const rawName = location.cityName || 'Custom Regional Area';
    const cleanName = rawName.split(',')[0].trim();
    const slug = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 18);
    const packId = `pack-custom-${slug}-v1`;

    const allPacks = this.getOfflinePacks();
    const existing = allPacks.find(p => p.id === packId || p.areaId === slug);
    if (existing) return existing;

    const lat = location.coords.latitude || 20;
    const lng = location.coords.longitude || 78;
    const sizeMB = 680 + Math.abs(Math.round((lat * 19 + lng * 23) % 360));
    const sizeBytes = sizeMB * 1024 * 1024;
    const sizeFormatted = sizeMB >= 1000 ? `${(sizeMB / 1024).toFixed(2)} GB` : `${sizeMB} MB`;
    const country = location.countryCode ? `Country Code [${location.countryCode}]` : 'Global Territory';

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
        hashes: {
          'basemap.mbtiles': `mbtiles-${slug}-${Math.random().toString(36).substring(2, 10)}`,
          'pois.sqlite': `sqlite-${slug}-${Math.random().toString(36).substring(2, 10)}`,
          'routing.osrm': `osrm-${slug}-${Math.random().toString(36).substring(2, 10)}`
        },
        lengths: {
          'basemap.mbtiles': Math.round(sizeBytes * 0.60),
          'pois.sqlite': Math.round(sizeBytes * 0.25),
          'routing.osrm': Math.round(sizeBytes * 0.15)
        },
        issuedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
        keyId: `key-dynamic-${slug}-2026`,
        signature: `eyJhbGciOiJFUzI1NiJ9.sig.${slug}`
      }
    };

    allPacks.push(dynamicPack);
    localStorage.setItem(STORAGE_KEYS.OFFLINE_PACKS, JSON.stringify(allPacks));
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
      const data = localStorage.getItem(STORAGE_KEYS.VOICE_SETTINGS);
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
    localStorage.setItem(STORAGE_KEYS.VOICE_SETTINGS, JSON.stringify(settings));
  }

  // --- City Selection ---
  public getActiveCityId(): string {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_CITY) || 'kyoto';
  }

  public setActiveCityId(cityId: string): void {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_CITY, cityId);
  }

  // --- Correction Reports ---
  public saveCorrectionReport(report: any): string {
    const reports = JSON.parse(localStorage.getItem(STORAGE_KEYS.CORRECTION_REPORTS) || '[]');
    const reportId = `rep-${generateUUID().substring(0, 8)}`;
    reports.push({ ...report, reportId, receivedAt: new Date().toISOString(), status: 'RECEIVED_IN_TRIAGE' });
    localStorage.setItem(STORAGE_KEYS.CORRECTION_REPORTS, JSON.stringify(reports));
    return reportId;
  }
}

export const storage = new StorageService();
