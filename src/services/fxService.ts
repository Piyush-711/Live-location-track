import { CurrencyRates } from '../types';
import { fetchProviderJson } from './providerRequest';

const CACHE_KEY = 'travel_fx_rates_cache_v2';
const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;

export interface CurrencyMeta {
  code: string;
  name: string;
  symbol: string;
  flag: string;
}

export const POPULAR_CURRENCIES: CurrencyMeta[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳' },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', flag: '🇦🇪' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', flag: '🇨🇦' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', flag: '🇸🇬' },
  { code: 'THB', name: 'Thai Baht', symbol: '฿', flag: '🇹🇭' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'Fr', flag: '🇨🇭' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼', flag: '🇸🇦' }
];

const MAX_STALE_MS = 7 * 24 * 60 * 60 * 1000;

function validateRates(value: unknown): Record<string, number> | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const rates: Record<string, number> = {};
  for (const [currency, rate] of Object.entries(value)) {
    if (/^[A-Z]{3}$/.test(currency) && typeof rate === 'number' && Number.isFinite(rate) && rate > 0) rates[currency] = rate;
  }
  if (Object.keys(rates).length < 2 || (rates.USD !== undefined && rates.USD !== 1)) return undefined;
  return { ...rates, USD: 1 };
}

class FXService {
  private pending: Promise<CurrencyRates> | undefined;
  private memoryCache: CurrencyRates | undefined;

  public async getRates(forceRefresh = false): Promise<CurrencyRates> {
    if (this.pending) return this.pending;
    const cached = this.getCachedRates();
    if (!forceRefresh && cached?.lastFetched && Date.now() - cached.lastFetched < TWELVE_HOURS_MS) return cached;
    this.pending = this.fetchLiveRates().then(rates => {
      this.memoryCache = rates;
      this.saveToCache(rates);
      return rates;
    }).catch(error => {
      if (cached) return { ...cached, source: 'Cached reference rates (refresh unavailable)', isLive: false };
      throw error;
    }).finally(() => { this.pending = undefined; });
    return this.pending;
  }

  private async fetchLiveRates(): Promise<CurrencyRates> {
    try {
      const data = await fetchProviderJson<{
        result?: string; base_code?: string; rates?: unknown; time_last_update_utc?: string;
      }>('https://open.er-api.com/v6/latest/USD', 6000);
      const rates = validateRates(data?.rates);
      if (data?.result === 'success' && data.base_code === 'USD' && rates &&
          typeof data.time_last_update_utc === 'string' && Number.isFinite(Date.parse(data.time_last_update_utc))) {
        return this.report(rates, data.time_last_update_utc, 'ExchangeRate-API reference rates');
      }
    } catch {
      // Both providers have a bounded timeout, including their response body.
    }
    const data = await fetchProviderJson<{ base?: string; rates?: unknown; date?: string }>(
      'https://api.frankfurter.dev/v1/latest?base=USD', 6000
    );
    const rates = validateRates(data?.rates);
    if (data?.base !== 'USD' || !rates || typeof data.date !== 'string' || !Number.isFinite(Date.parse(data.date))) {
      throw new Error('Exchange-rate provider returned invalid data');
    }
    return this.report(rates, data.date, 'ECB reference rates');
  }

  private report(rates: Record<string, number>, asOf: string, source: string): CurrencyRates {
    const now = Date.now();
    return { base: 'USD', asOf, source, rates, lastFetched: now,
      nextUpdate: new Date(now + TWELVE_HOURS_MS).toISOString(), isLive: true };
  }

  public getCachedRates(): CurrencyRates | null {
    let cached: CurrencyRates | undefined = this.memoryCache;
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw && raw.length < 50_000) cached = JSON.parse(raw);
    } catch {
      // Storage can be disabled or corrupt; the memory cache remains usable.
    }
    const rates = validateRates(cached?.rates);
    if (!cached || cached.base !== 'USD' || !rates || typeof cached.lastFetched !== 'number' ||
        !Number.isFinite(cached.lastFetched) || cached.lastFetched > Date.now() ||
        Date.now() - cached.lastFetched > MAX_STALE_MS || typeof cached.asOf !== 'string' ||
        !Number.isFinite(Date.parse(cached.asOf))) return null;
    return { ...cached, rates };
  }

  private saveToCache(rates: CurrencyRates): void {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(rates)); } catch { /* Cache is optional. */ }
  }

  public getTimeUntilNextRefresh(lastFetched?: number): string {
    if (!lastFetched || !Number.isFinite(lastFetched)) return 'Due for update';
    const remaining = TWELVE_HOURS_MS - (Date.now() - lastFetched);
    if (remaining <= 0) return 'Due for update';
    const hours = Math.floor(remaining / 3_600_000);
    const minutes = Math.floor((remaining % 3_600_000) / 60_000);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  }
}

export const fxService = new FXService();
