import { WeatherReport } from '../types';
import { RequestCache, assertCoordinates, fetchProviderJson } from './providerRequest';

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
  private readonly cache = new RequestCache<LiveWeatherReport>(64, 15 * 60 * 1000);

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
    assertCoordinates(latitude, longitude);
    const key = `${latitude.toFixed(2)},${longitude.toFixed(2)}`;
    const report = await this.cache.load(key, async () => {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code&hourly=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=2`;

      const data = await fetchProviderJson<{
        current?: Record<string, unknown>;
        daily?: { temperature_2m_max?: number[]; temperature_2m_min?: number[] };
        hourly?: { time?: string[]; temperature_2m?: number[]; weather_code?: number[] };
        utc_offset_seconds?: number;
      }>(url);
      const current = data.current || {};
      const daily = data.daily || {};
      const hourly = data.hourly || {};

      const requiredNumbers = [current.temperature_2m, current.apparent_temperature, current.relative_humidity_2m,
        current.weather_code, daily.temperature_2m_max?.[0], daily.temperature_2m_min?.[0]];
      if (!requiredNumbers.every(value => typeof value === 'number' && Number.isFinite(value)) ||
          typeof current.time !== 'string' || !Number.isFinite(Date.parse(current.time)) ||
          (current.is_day !== 0 && current.is_day !== 1)) throw new Error('Weather provider returned incomplete data');
      const weatherCode = current.weather_code as number;
      const codeInfo = WEATHER_CODE_MAP[weatherCode] || { text: 'Unknown conditions', icon: 'cloud' };

      // Process hourly forecasts starting from current hour
      const hourlyList: Array<{ time: string; tempC: number; condition: string; conditionIcon?: string }> = [];
      const times: string[] = Array.isArray(hourly.time) ? hourly.time : [];
      const temps: number[] = Array.isArray(hourly.temperature_2m) ? hourly.temperature_2m : [];
      const codes: number[] = Array.isArray(hourly.weather_code) ? hourly.weather_code : [];

      const currentIsoTime = current.time;
      const currentHourIndex = times.findIndex((t: string) => t >= currentIsoTime.slice(0, 13));
      const startIndex = currentHourIndex >= 0 ? currentHourIndex : 0;

      for (let i = startIndex; i < Math.min(startIndex + 12, times.length); i++) {
        const timeStr = times[i];
        if (typeof timeStr !== 'string' || !Number.isFinite(temps[i]) || !Number.isFinite(codes[i])) continue;
        const hourPart = timeStr.includes('T') ? timeStr.split('T')[1].slice(0, 5) : timeStr.slice(11, 16);
        const hInfo = WEATHER_CODE_MAP[codes[i]] || { text: 'Unknown conditions', icon: 'cloud' };

        hourlyList.push({
          time: hourPart,
          tempC: Math.round(temps[i]),
          condition: hInfo.text,
          conditionIcon: hInfo.icon
        });
      }

      const report: LiveWeatherReport = {
        city: cityName,
        tempC: Math.round(current.temperature_2m as number),
        feelsLikeC: Math.round(current.apparent_temperature as number),
        condition: codeInfo.text,
        conditionIcon: codeInfo.icon,
        highC: Math.round(daily.temperature_2m_max![0]),
        lowC: Math.round(daily.temperature_2m_min![0]),
        humidity: Math.round(current.relative_humidity_2m as number),
        isDay: current.is_day === 1,
        observedAt: new Date(Date.parse(`${current.time}Z`) - (Number.isFinite(data.utc_offset_seconds) ? data.utc_offset_seconds! : 0) * 1000).toISOString(),
        hourly: hourlyList
      };

      return report;
    }, forceRefresh);
    return { ...report, city: cityName };
  }
}

export const weatherService = new WeatherService();
