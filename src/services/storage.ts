import { Place, SavedPlace, OfflinePack, VoiceSettings } from '../types';
import { MOCK_OFFLINE_PACKS } from '../data/mockData';

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

    // Initialize default pack if not exists
    if (!localStorage.getItem(STORAGE_KEYS.OFFLINE_PACKS)) {
      localStorage.setItem(STORAGE_KEYS.OFFLINE_PACKS, JSON.stringify(MOCK_OFFLINE_PACKS));
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
