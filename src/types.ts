export type Category = 
  | 'hospital' 
  | 'pharmacy' 
  | 'police' 
  | 'atm' 
  | 'restaurant' 
  | 'cafe' 
  | 'hotel' 
  | 'transit_stop' 
  | 'supermarket' 
  | 'fuel'
  | 'historic'
  | 'museum'
  | 'beach'
  | 'attraction';


export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

export interface OperatingDay {
  day: string;
  hours: string;
  isOpenNow: boolean;
}

export interface Place {
  id: string;
  name: string;
  localizedName?: string;
  category: Category;
  distanceMeters: number;
  location: LocationCoordinates;
  countryCode: string;
  city: string;
  address: string;
  hours: {
    status: 'open' | 'closed' | 'unknown';
    raw: string | null;
    formatted?: string;
  };
  source: 'OSM' | 'CURATED_REGISTRY';
  sourceUpdatedAt: string;
  freshness: 'fresh' | 'stale' | 'unknown';
  emergencyCapable?: boolean;
  phone?: string;
  tags?: string[];
  triageInfo?: string;
  operatingSchedule?: OperatingDay[];
  imageUrl?: string;
  ratingNotice?: string; // Spec explicitly disallows commercial ratings
}

export type LocalMarketSpecialty = 
  | 'electronics' 
  | 'clothes' 
  | 'automobile' 
  | 'spices_food' 
  | 'jewelry' 
  | 'antiques_handicrafts' 
  | 'wholesale';

export interface LocalMarket {
  id: string;
  name: string;
  city: string;
  cityId?: string;
  specialty: LocalMarketSpecialty;
  specialtyLabel: string;
  famousFor: string;
  whatToBuy: string[];
  address: string;
  location: LocationCoordinates;
  distanceMeters?: number;
  metroStation?: string;
  closedOn?: string;
  timings: string;
  bargainingTip: string;
  imageUrl?: string;
  tags: string[];
}

export type RouteMode = 'walking' | 'driving';

export interface RouteStep {
  id: string;
  instruction: string;
  instructionLocal?: string;
  distanceMeters: number;
  durationSeconds: number;
  maneuver: 'depart' | 'turn_left' | 'turn_right' | 'straight' | 'arrive';
  landmark?: string;
  streetName?: string;
  streetNameLocal?: string;
}

export interface RouteResponse {
  graphVersion: string;
  profileVersion: string;
  mode: RouteMode;
  distanceMeters: number;
  durationSeconds: number;
  geometry: {
    type: 'LineString';
    coordinates: [number, number][]; // [longitude, latitude] pairs
  };
  steps: RouteStep[];
  sourceUpdatedAt: string;
  coverageAreaId: string;
}

export interface EmergencyHotline {
  service: string;
  number: string;
  description: string;
  instantDial: boolean;
}

export interface EmergencyPhrase {
  category: string;
  english: string;
  localScript: string;
  pronunciation: string;
}

export interface EmergencyDossier {
  countryCode: string;
  countryName: string;
  city: string;
  nationalHotlines: EmergencyHotline[];
  emergencyPhrases: EmergencyPhrase[];
  verifiedER: Place;
  embassyContact?: {
    name: string;
    phone: string;
    address: string;
  };
}

export interface CountryBriefing {
  countryCode: string;
  countryName: string;
  city: string;
  callingCode: string;
  timezone: string;
  currency: string;
  currencySymbol: string;
  powerPlugs: string;
  voltage: string;
  transitTip: string;
  culturalEtiquette: string[];
}

export interface CurrencyRates {
  base: string;
  asOf: string;
  source: string;
  rates: Record<string, number>;
  lastFetched?: number;
  nextUpdate?: string;
  isLive?: boolean;
}

export interface WeatherReport {
  city: string;
  tempC: number;
  condition: string;
  highC: number;
  lowC: number;
  humidity: number;
  observedAt: string;
  hourly: { time: string; tempC: number; condition: string }[];
}

export interface PackManifest {
  packId: string;
  areaId: string;
  version: string;
  schemaVersion: string;
  hashes: Record<string, string>;
  lengths: Record<string, number>;
  issuedAt: string;
  expiresAt: string;
  keyId: string;
  signature: string;
}

export interface OfflinePack {
  id: string;
  areaId: string;
  name: string;
  country: string;
  sizeBytes: number;
  sizeFormatted: string;
  version: string;
  installed: boolean;
  installing?: boolean;
  progress?: number;
  manifest: PackManifest;
}

export type VolumeProfile = 'low' | 'standard' | 'outdoor_boost';

export interface VoiceSettings {
  volumeMode: VolumeProfile;
  speechRate: number;
  language: string;
  ttsEngineReady: boolean;
  chimesEnabled: boolean;
}

export interface SavedPlace {
  placeId: string;
  account_id: string;
  version: string;
  deleted_at: string | null;
  updated_at: string;
  place: Place;
  eTag: string;
}

export interface CorrectionReportRequest {
  placeId: string;
  issueCategory: 'hours' | 'closed' | 'location' | 'phone' | 'safety';
  description: string;
  reporterEmail?: string;
}

export interface RFC9457Error {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  code: string;
}
