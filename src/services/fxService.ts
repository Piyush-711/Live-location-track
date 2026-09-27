import { CurrencyRates } from '../types';
import { MOCK_RATES } from '../data/mockData';

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

class FXService {
  /**
   * Retrieves currency rates.
   * If cached rates are less than 12 hours old and forceRefresh is false, returns cached rates.
   * Otherwise, fetches live real-time market rates and updates the 12-hour cache.
   */
  public async getRates(forceRefresh = false): Promise<CurrencyRates> {
    const cached = this.getCachedRates();

    // If cache is valid (less than 12 hours old) and no force refresh requested, return cache
    if (!forceRefresh && cached && cached.lastFetched) {
      const ageMs = Date.now() - cached.lastFetched;
      if (ageMs < TWELVE_HOURS_MS) {
        return cached;
      }
    }

    // Try fetching fresh live rates
    try {
      const liveRates = await this.fetchLiveRates();
      this.saveToCache(liveRates);
      return liveRates;
    } catch (err) {
      console.warn('FXService: Live fetch failed, attempting cached fallback', err);
      if (cached) {
        return cached;
      }
      return {
        ...MOCK_RATES,
        lastFetched: Date.now() - TWELVE_HOURS_MS, // Mark as needing update
        nextUpdate: new Date(Date.now()).toISOString(),
        isLive: false
      };
    }
  }

  /**
   * Fetches live market rates from Open Exchange Rates (open.er-api.com)
   * with fallback to Frankfurter.
   */
  private async fetchLiveRates(): Promise<CurrencyRates> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      // Primary provider: ExchangeRate-API Open Endpoint (free, CORS enabled, no key needed)
      const res = await fetch('https://open.er-api.com/v6/latest/USD', {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' }
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.result === 'success' && data.rates) {
          clearTimeout(timeoutId);
          const now = Date.now();
          return {
            base: data.base_code || 'USD',
            asOf: data.time_last_update_utc || new Date().toISOString(),
            source: 'Live Interbank Rates (Auto-updated every 12h)',
            rates: {
              ...data.rates,
              USD: 1.0 // Ensure USD base
            },
            lastFetched: now,
            nextUpdate: new Date(now + TWELVE_HOURS_MS).toISOString(),
            isLive: true
          };
        }
      }
    } catch (e) {
      console.warn('FXService: Primary live API failed, trying secondary fallback...', e);
    } finally {
      clearTimeout(timeoutId);
    }

    // Secondary provider: Frankfurter ECB rates
    try {
      const altRes = await fetch('https://api.frankfurter.dev/v1/latest?base=USD');
      if (altRes.ok) {
        const altData = await altRes.json();
        if (altData && altData.rates) {
          const now = Date.now();
          return {
            base: 'USD',
            asOf: altData.date || new Date().toISOString(),
            source: 'ECB Live Reference (Auto-updated every 12h)',
            rates: {
              ...altData.rates,
              USD: 1.0
            },
            lastFetched: now,
            nextUpdate: new Date(now + TWELVE_HOURS_MS).toISOString(),
            isLive: true
          };
        }
      }
    } catch (e) {
      console.warn('FXService: Secondary live API failed', e);
    }

    throw new Error('All live exchange rate providers unreachable');
  }

  public getCachedRates(): CurrencyRates | null {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  private saveToCache(rates: CurrencyRates): void {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(rates));
    } catch (e) {
      console.warn('FXService: Failed to save to localStorage', e);
    }
  }

  /**
   * Returns human-readable time remaining until next 12-hour dynamic refresh
   */
  public getTimeUntilNextRefresh(lastFetched?: number): string {
    if (!lastFetched) return 'Due for update';
    const elapsed = Date.now() - lastFetched;
    const remaining = TWELVE_HOURS_MS - elapsed;
    if (remaining <= 0) return 'Updating now...';
    
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }
}

export const fxService = new FXService();
