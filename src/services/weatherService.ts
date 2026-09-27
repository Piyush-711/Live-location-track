import { WeatherReport } from '../types';
import { MOCK_WEATHER } from '../data/mockData';

export interface LiveWeatherReport extends WeatherReport {
  feelsLikeC?: number;
  conditionIcon?: string;
  isDay?: boolean;
}

const WEATHER_CODE_MAP: Record<number, { text: string; icon: string }> = {
  0: { text: 'Clear Sky', icon: 'wb_sunny' },
  1: { text: 'Mainly Clear', icon: 'sunny' },
  2: { text: 'Partly Cloudy', icon: 'partly_cloudy_day' },
  3: { text: 'Overcast', icon: 'cloud' },
  45: { text: 'Foggy', icon: 'foggy' },
  48: { text: 'Depositing Rime Fog', icon: 'foggy' },
  51: { text: 'Light Drizzle', icon: 'rainy' },
  53: { text: 'Moderate Drizzle', icon: 'rainy' },
  55: { text: 'Dense Drizzle', icon: 'rainy' },
  61: { text: 'Slight Rain', icon: 'rainy' },
  63: { text: 'Moderate Rain', icon: 'rainy' },
  65: { text: 'Heavy Rain', icon: 'water_drop' },
  71: { text: 'Slight Snow', icon: 'ac_unit' },
  73: { text: 'Moderate Snow', icon: 'ac_unit' },
  75: { text: 'Heavy Snow', icon: 'severe_cold' },
  80: { text: 'Light Rain Showers', icon: 'rainy' },
  81: { text: 'Moderate Showers', icon: 'rainy' },
  82: { text: 'Violent Rain Showers', icon: 'thunderstorm' },
  95: { text: 'Thunderstorm', icon: 'thunderstorm' },
  96: { text: 'Thunderstorm with Hail', icon: 'thunderstorm' },
  99: { text: 'Severe Thunderstorm', icon: 'thunderstorm' }
};

class WeatherService {
  private cache = new Map<string, { timestamp: number; data: LiveWeatherReport }>();
  private readonly CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

  /**
   * Fetches real live weather conditions using Open-Meteo global API
   * Automatically adapts to any coordinates worldwide.
   */
  public async getLiveWeather(
    latitude: number,
    longitude: number,
    cityName = 'Current Location',
    forceRefresh = false
  ): Promise<LiveWeatherReport> {
    const key = `${latitude.toFixed(2)},${longitude.toFixed(2)}`;
    
    // Check in-memory cache
    if (!forceRefresh && this.cache.has(key)) {
      const entry = this.cache.get(key)!;
      if (Date.now() - entry.timestamp < this.CACHE_TTL_MS) {
        return {
          ...entry.data,
          city: cityName // update city display if provided
        };
      }
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code&hourly=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=2`;

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!res.ok) throw new Error(`Open-Meteo HTTP error ${res.status}`);

      const data = await res.json();
      const current = data.current || {};
      const daily = data.daily || {};
      const hourly = data.hourly || {};

      const weatherCode = current.weather_code ?? 0;
      const codeInfo = WEATHER_CODE_MAP[weatherCode] || { text: 'Fair Weather', icon: 'wb_sunny' };

      // Process hourly forecasts starting from current hour
      const hourlyList: Array<{ time: string; tempC: number; condition: string; conditionIcon?: string }> = [];
      const times: string[] = hourly.time || [];
      const temps: number[] = hourly.temperature_2m || [];
      const codes: number[] = hourly.weather_code || [];

      const currentIsoTime = current.time || new Date().toISOString();
      const currentHourIndex = times.findIndex((t: string) => t >= currentIsoTime.slice(0, 13));
      const startIndex = currentHourIndex >= 0 ? currentHourIndex : 0;

      for (let i = startIndex; i < Math.min(startIndex + 12, times.length); i++) {
        const timeStr = times[i];
        const hourPart = timeStr.includes('T') ? timeStr.split('T')[1].slice(0, 5) : timeStr.slice(11, 16);
        const hCode = codes[i] ?? 0;
        const hInfo = WEATHER_CODE_MAP[hCode] || { text: 'Clear', icon: 'wb_sunny' };

        hourlyList.push({
          time: hourPart,
          tempC: Math.round(temps[i]),
          condition: hInfo.text,
          conditionIcon: hInfo.icon
        });
      }

      const report: LiveWeatherReport = {
        city: cityName,
        tempC: Math.round(current.temperature_2m ?? 24),
        feelsLikeC: Math.round(current.apparent_temperature ?? current.temperature_2m ?? 24),
        condition: codeInfo.text,
        conditionIcon: codeInfo.icon,
        highC: daily.temperature_2m_max ? Math.round(daily.temperature_2m_max[0]) : Math.round((current.temperature_2m ?? 24) + 4),
        lowC: daily.temperature_2m_min ? Math.round(daily.temperature_2m_min[0]) : Math.round((current.temperature_2m ?? 24) - 4),
        humidity: Math.round(current.relative_humidity_2m ?? 65),
        isDay: current.is_day === 1,
        observedAt: current.time || new Date().toISOString(),
        hourly: hourlyList.length > 0 ? hourlyList : [
          { time: '14:00', tempC: Math.round(current.temperature_2m ?? 24), condition: codeInfo.text },
          { time: '16:00', tempC: Math.round((current.temperature_2m ?? 24) - 1), condition: codeInfo.text },
          { time: '18:00', tempC: Math.round((current.temperature_2m ?? 24) - 3), condition: 'Sunset' },
          { time: '20:00', tempC: Math.round((current.temperature_2m ?? 24) - 5), condition: 'Cool' }
        ]
      };

      this.cache.set(key, { timestamp: Date.now(), data: report });
      return report;
    } catch (err) {
      console.warn('WeatherService: Live Open-Meteo fetch failed, using fallback:', err);
      
      // Fallback to cached or mock
      const mockKey = Object.keys(MOCK_WEATHER)[0];
      const fallback = MOCK_WEATHER[mockKey];
      return {
        ...fallback,
        city: cityName,
        tempC: fallback.tempC,
        condition: fallback.condition
      };
    }
  }
}

export const weatherService = new WeatherService();
