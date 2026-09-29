import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CountryBriefing, CurrencyRates, WeatherReport } from '../types';
import { api } from '../services/api';
import { CITIES } from '../data/mockData';
import { fxService, POPULAR_CURRENCIES } from '../services/fxService';
import { LiveLocationState } from '../hooks/useLiveLocation';

interface TravelToolkitViewProps {
  activeCityId: string;
  liveCountryCode?: string;
  location?: LiveLocationState;
}

const PAYMENT_GUIDES: Record<string, {
  primaryMethod: string;
  primaryIcon: string;
  cashRequirement: string;
  cardAdvice: string;
  tippingNorm: string;
}> = {
  IN: {
    primaryMethod: 'UPI QR Codes (Google Pay, PhonePe, Paytm)',
    primaryIcon: 'qr_code_scanner',
    cashRequirement: 'Carry ₹100 - ₹500 notes for street vendors, auto rickshaws, and temple footwear stands.',
    cardAdvice: 'International Visa & Mastercard accepted at supermarkets, malls, and hotels. Always choose billing in INR to avoid dynamic conversion fees.',
    tippingNorm: '5-10% at sit-down restaurants. Rounding up taxi or auto fare is customary.'
  },
  JP: {
    primaryMethod: 'Suica / Pasmo IC Cards & PayPay',
    primaryIcon: 'contactless',
    cashRequirement: 'Essential! Small shrines, noodle bars, vending machines, and bus fares often require coins or 1,000 Yen notes.',
    cardAdvice: 'Credit cards accepted at convenience stores (7-Eleven, Lawson) and department stores. 7-Bank ATMs accept foreign cards 24/7.',
    tippingNorm: '0% — Tipping is not customary in Japan and may cause confusion.'
  },
  GB: {
    primaryMethod: 'Contactless Debit/Credit & Apple/Google Pay',
    primaryIcon: 'contactless',
    cashRequirement: 'Rarely needed. London buses, Underground, and many modern cafes are completely cashless.',
    cardAdvice: 'All Visa, Mastercard, and Amex cards widely accepted with zero minimum spend.',
    tippingNorm: '10-12.5% discretionary service charge is often included on dining bills.'
  },
  US: {
    primaryMethod: 'Contactless Tap & Chip Credit Cards',
    primaryIcon: 'credit_card',
    cashRequirement: 'Useful for tipping hotel valets, street food trucks, and small roadside diners.',
    cardAdvice: 'Universal credit card acceptance. Sales tax is added at register and not on price tag.',
    tippingNorm: '18-20% standard for restaurant sit-down service.'
  },
  AU: {
    primaryMethod: 'Contactless Tap-and-Go (Opal / Bank Card)',
    primaryIcon: 'contactless',
    cashRequirement: 'Mostly cashless economy; cash rarely required except remote beach stalls.',
    cardAdvice: 'Some small cafes charge a 1-1.5% card surcharge; EFTPOS and Visa/MC universal.',
    tippingNorm: 'Not required or expected; 5-10% for exceptional fine dining only.'
  },
  CA: {
    primaryMethod: 'Interac & Contactless Credit Cards',
    primaryIcon: 'contactless',
    cashRequirement: 'Rarely needed; standard Canadian currency accepted everywhere.',
    cardAdvice: 'Visa and Mastercard universal. Chip and PIN standard.',
    tippingNorm: '15-18% before tax is standard for restaurant table service.'
  }
};

export const TravelToolkitView: React.FC<TravelToolkitViewProps> = ({ activeCityId, liveCountryCode, location }) => {
  const activeCity = CITIES.find(c => c.id === activeCityId) || CITIES[0];
  const effectiveCountry = location ? location.countryCode : liveCountryCode || activeCity.countryCode;
  const effectiveCityName = location?.cityName || activeCity.name;
  const effectiveCoords = location?.coords;

  const [briefing, setBriefing] = useState<CountryBriefing | null>(null);
  const [rates, setRates] = useState<CurrencyRates | null>(null);
  const [weather, setWeather] = useState<WeatherReport | null>(null);
  const [isRefreshingWeather, setIsRefreshingWeather] = useState(false);
  const [weatherFeedback, setWeatherFeedback] = useState<string | null>(null);

  // Live 12-hour sync state
  const [isRefreshingRates, setIsRefreshingRates] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [countdownText, setCountdownText] = useState<string>('');

  // Currency Converter state
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState(
    effectiveCountry === 'JP' ? 'JPY' : 
    effectiveCountry === 'IN' ? 'INR' : 
    effectiveCountry === 'GB' ? 'GBP' : 
    effectiveCountry === 'AU' ? 'AUD' :
    effectiveCountry === 'CA' ? 'CAD' : 'EUR'
  );
  const [inputAmount, setInputAmount] = useState('100');

  const mountedRef = useRef(false);
  const weatherRequestRef = useRef(0);
  const ratesPendingRef = useRef(false);
  const weatherLat = effectiveCoords ? Number(effectiveCoords.latitude.toFixed(2)) : undefined;
  const weatherLng = effectiveCoords ? Number(effectiveCoords.longitude.toFixed(2)) : undefined;
  const [briefingError, setBriefingError] = useState<string | null>(null);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; weatherRequestRef.current += 1; };
  }, []);

  const loadRates = useCallback(async (force = false) => {
    if (ratesPendingRef.current) return;
    ratesPendingRef.current = true;
    if (force) setIsRefreshingRates(true);
    try {
      const data = await api.getFXRates(force);
      if (!mountedRef.current) return;
      setRates(data);
      if (force) setSyncFeedback(data.isLive ? 'Exchange rates updated.' : 'Showing cached or reference rates; live rates are unavailable.');
    } catch {
      if (mountedRef.current) setSyncFeedback('Unable to reach exchange rates. Retaining any cached data.');
    } finally {
      ratesPendingRef.current = false;
      if (mountedRef.current) setIsRefreshingRates(false);
    }
  }, []);

  const loadWeather = useCallback(async (force = false) => {
    const request = ++weatherRequestRef.current;
    if (force) setIsRefreshingWeather(true);
    setWeatherFeedback(null);
    try {
      const data = await api.getWeather(activeCityId, weatherLat === undefined || weatherLng === undefined ? undefined : { latitude: weatherLat, longitude: weatherLng }, effectiveCityName, force);
      if (!mountedRef.current || request !== weatherRequestRef.current) return;
      setWeather(data);
      if (force) setWeatherFeedback('Weather request completed.');
    } catch {
      if (mountedRef.current && request === weatherRequestRef.current) setWeatherFeedback('Weather is unavailable for this location.');
    } finally {
      if (mountedRef.current && request === weatherRequestRef.current) setIsRefreshingWeather(false);
    }
  }, [activeCityId, weatherLat, weatherLng, effectiveCityName]);

  useEffect(() => { void loadRates(); }, [loadRates]);
  useEffect(() => {
    setWeather(null);
    void loadWeather();
    return () => { weatherRequestRef.current += 1; };
  }, [loadWeather]);
  useEffect(() => {
    let current = true;
    setBriefing(null);
    setBriefingError(null);
    api.getCountryBriefing(effectiveCountry).then(data => { if (current) setBriefing(data); })
      .catch(() => { if (current) setBriefingError('Travel facts are unavailable for the selected country.'); });
    const currencies: Record<string, string> = { JP: 'JPY', GB: 'GBP', IN: 'INR', AU: 'AUD', CA: 'CAD', US: 'USD' };
    setToCurrency(currencies[effectiveCountry] || 'EUR');
    return () => { current = false; };
  }, [effectiveCountry]);
  // Periodic 12-hour timer update and auto-sync check
  useEffect(() => {
    const updateCountdown = () => {
      if (rates?.lastFetched) {
        const remainingStr = fxService.getTimeUntilNextRefresh(rates.lastFetched);
        setCountdownText(remainingStr);

        // Check if 12 hours (43,200,000 ms) passed to auto-refresh dynamically
        const elapsed = Date.now() - rates.lastFetched;
        if (elapsed >= 12 * 60 * 60 * 1000) {
          loadRates(true);
        }
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, [rates?.lastFetched, loadRates]);

  // Keypad handling
  const handleKeypadPress = (val: string) => {
    if (val === 'C') {
      setInputAmount('0');
    } else if (val === '.') {
      if (!inputAmount.includes('.')) {
        setInputAmount(inputAmount + '.');
      }
    } else {
      if (inputAmount === '0') {
        setInputAmount(val);
      } else if (inputAmount.length < 9) {
        setInputAmount(inputAmount + val);
      }
    }
  };

  const handleSwapCurrencies = () => {
    const temp = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(temp);
  };

  // Compute converted rate
  let convertedAmount = '0.00';
  let directUnitRate: number | null = null;
  if (rates && rates.rates[fromCurrency] && rates.rates[toCurrency]) {
    const fromVal = rates.rates[fromCurrency];
    const toVal = rates.rates[toCurrency];
    const num = parseFloat(inputAmount) || 0;
    
    // Direct rate
    directUnitRate = toVal / fromVal;
    
    // Base is USD
    const inUSD = num / fromVal;
    const converted = inUSD * toVal;
    convertedAmount = toCurrency === 'JPY' ? Math.round(converted).toLocaleString() : converted.toFixed(2);
  }

  const paymentGuide = PAYMENT_GUIDES[effectiveCountry] || {
    primaryMethod: briefing?.transitTip || 'Contactless Cards & Local Currency',
    primaryIcon: 'payments',
    cashRequirement: 'Keep small bills available for local transit and markets.',
    cardAdvice: 'Chip & PIN and contactless payments are standard.',
    tippingNorm: 'Discretionary 5-10% based on service quality.'
  };

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 pb-28 pt-2">
      {/* Header Banner */}
      <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 mb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Travel Utilities</h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Real-time currency converter, local payment customs, weather & essential destination info.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 text-sky-700 font-semibold text-xs border border-sky-100">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Travel information</span>
          </span>
        </div>
      </div>

      {/* Main Responsive Grid: 2 Columns on Desktop */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left Column: Currency Converter & Local Payment Guide (7 Cols) */}
        <div className="flex flex-col gap-6 md:col-span-7">
          {/* Currency Converter Card */}
          <div className="rounded-2xl bg-white p-5 sm:p-6 shadow-sm border border-slate-200/80 flex flex-col gap-4">
            {/* Header & Sync Status */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px]">currency_exchange</span>
                  </span>
                  <span>Currency Converter</span>
                </h2>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mt-1">
                  <span>{rates?.isLive ? 'Live Market Rates' : 'Cached / reference rates'}</span>
                  <span>•</span>
                  <span>Updates in {countdownText || '12 hours'}</span>
                </div>
              </div>

              <button
                onClick={() => loadRates(true)}
                disabled={isRefreshingRates}
                className={`px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  isRefreshingRates ? 'opacity-60 cursor-not-allowed' : ''
                }`}
                title="Refresh exchange rates"
              >
                <span className={`material-symbols-outlined text-[16px] ${isRefreshingRates ? 'animate-spin text-sky-600' : ''}`}>
                  sync
                </span>
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>

            {/* Sync Feedback Toast */}
            {syncFeedback && (
              <div className="px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
                <span className="material-symbols-outlined text-[16px] text-emerald-600">check_circle</span>
                <span>{syncFeedback}</span>
              </div>
            )}

            {/* Currency Inputs */}
            <div className="flex flex-col gap-2">
              {/* From Row */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between">
                <select
                  value={fromCurrency}
                  onChange={(e) => setFromCurrency(e.target.value)}
                  className="bg-white font-bold text-xs sm:text-sm text-slate-800 py-1.5 px-3 rounded-lg shadow-sm border border-slate-200 outline-none cursor-pointer"
                >
                  {POPULAR_CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.code} ({c.symbol})
                    </option>
                  ))}
                </select>
                <span className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                  {inputAmount}
                </span>
              </div>

              {/* Swap Button */}
              <div className="flex justify-center -my-2 z-10">
                <button
                  onClick={handleSwapCurrencies}
                  className="w-9 h-9 rounded-full bg-white shadow-md hover:shadow-lg active:scale-95 flex items-center justify-center text-sky-600 border border-slate-200 transition-all cursor-pointer"
                  title="Swap Currencies"
                >
                  <span className="material-symbols-outlined text-[18px]">swap_vert</span>
                </button>
              </div>

              {/* To Row */}
              <div className="p-3.5 rounded-xl bg-sky-50/60 border border-sky-100 flex items-center justify-between">
                <select
                  value={toCurrency}
                  onChange={(e) => setToCurrency(e.target.value)}
                  className="bg-white font-bold text-xs sm:text-sm text-sky-700 py-1.5 px-3 rounded-lg shadow-sm border border-sky-200 outline-none cursor-pointer"
                >
                  {POPULAR_CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.code} ({c.symbol})
                    </option>
                  ))}
                </select>
                <span className="text-2xl font-black text-sky-700 font-mono tracking-tight">
                  {convertedAmount}
                </span>
              </div>
            </div>

            {/* Direct Unit Rate */}
            {directUnitRate && (
              <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-50 text-xs font-semibold text-slate-600 border border-slate-100">
                <span>
                  1 {fromCurrency} = {directUnitRate < 1 ? directUnitRate.toFixed(4) : directUnitRate.toFixed(2)} {toCurrency}
                </span>
                <span className="text-slate-400">
                  1 {toCurrency} = {(1 / directUnitRate) < 1 ? (1 / directUnitRate).toFixed(4) : (1 / directUnitRate).toFixed(2)} {fromCurrency}
                </span>
              </div>
            )}

            {/* Amount Presets */}
            <div className="flex items-center gap-1.5 pt-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Quick:</span>
              {['10', '50', '100', '500', '1000'].map((amt) => (
                <button
                  key={amt}
                  onClick={() => setInputAmount(amt)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    inputAmount === amt 
                      ? 'bg-sky-600 text-white shadow-sm' 
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {amt}
                </button>
              ))}
            </div>

            {/* Keypad */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'C'].map((k) => (
                <button
                  key={k}
                  onClick={() => handleKeypadPress(k)}
                  className="h-11 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold text-base active:scale-95 transition-all flex items-center justify-center select-none cursor-pointer"
                >
                  {k}
                </button>
              ))}
            </div>
          </div>

          {/* Local Payment Customs & Guides */}
          <div className="rounded-2xl bg-white p-5 sm:p-6 shadow-sm border border-slate-200/80 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">payments</span>
                </span>
                <span>Payment Customs • {briefing?.countryName || effectiveCountry}</span>
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
                Local Norms
              </span>
            </div>

            <div className="flex flex-col gap-3 text-xs">
              {/* Primary Digital Method */}
              <div className="p-3.5 rounded-xl bg-sky-50/70 border border-sky-100 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-[18px]">
                    {paymentGuide.primaryIcon}
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Most Common Payment Method</h3>
                  <p className="text-slate-600 font-medium mt-0.5 leading-relaxed">
                    {paymentGuide.primaryMethod}
                  </p>
                </div>
              </div>

              {/* Cash Advice */}
              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-100 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-[18px]">attach_money</span>
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Cash Needs</h3>
                  <p className="text-slate-600 font-medium mt-0.5 leading-relaxed">
                    {paymentGuide.cashRequirement}
                  </p>
                </div>
              </div>

              {/* Card & Tipping Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex flex-col">
                  <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Cards & ATMs</span>
                  <span className="text-slate-700 font-medium mt-1 leading-relaxed">
                    {paymentGuide.cardAdvice}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex flex-col">
                  <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Tipping Etiquette</span>
                  <span className="text-slate-700 font-medium mt-1 leading-relaxed">
                    {paymentGuide.tippingNorm}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Country Info, Weather & Map Engine (5 Cols) */}
        <div className="flex flex-col gap-6 md:col-span-5">
          {briefingError && <p role="status" className="text-sm text-slate-600">{briefingError}</p>}
          {!weather && weatherFeedback && <p role="status" className="text-sm text-slate-600">{weatherFeedback}</p>}
          {/* Live Weather Card */}
          {weather && (
            <div className="rounded-2xl bg-white p-5 sm:p-6 shadow-sm border border-slate-200/80 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Local Weather</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mt-0.5">{weather.city}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => loadWeather(true)}
                    disabled={isRefreshingWeather}
                    className={`p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer ${
                      isRefreshingWeather ? 'opacity-60 cursor-not-allowed' : ''
                    }`}
                    title="Refresh weather"
                  >
                    <span className={`material-symbols-outlined text-[16px] ${isRefreshingWeather ? 'animate-spin text-sky-600' : ''}`}>
                      sync
                    </span>
                  </button>
                  <div className="flex items-center gap-1.5 text-sky-700 font-bold">
                    <span className="material-symbols-outlined text-[28px] text-amber-500">
                      {(weather as any).conditionIcon || 'wb_sunny'}
                    </span>
                    <span className="text-2xl font-black">{weather.tempC}°C</span>
                  </div>
                </div>
              </div>

              {weatherFeedback && (
                <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-1.5 animate-fadeIn">
                  <span className="material-symbols-outlined text-[15px] text-emerald-600">check_circle</span>
                  <span>{weatherFeedback}</span>
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-slate-600 font-medium pt-2 border-t border-slate-100">
                <span className="font-bold text-sky-700">{weather.condition}</span>
                <span>
                  High {weather.highC}° • Low {weather.lowC}° • {weather.humidity}% Humidity
                </span>
              </div>

              {/* Hourly Forecast */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
                {weather.hourly.map((h, i) => (
                  <div key={i} className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-center flex-shrink-0 text-xs">
                    <span className="text-slate-400 font-medium text-[11px]">{h.time}</span>
                    <span className="text-sm font-bold text-slate-800 my-0.5">{h.tempC}°</span>
                    <span className="text-sky-600 font-semibold text-[10px]">{h.condition}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Country Guide Dossier */}
          {briefing && (
            <div className="rounded-2xl bg-white p-5 sm:p-6 shadow-sm border border-slate-200/80 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sky-600 text-[18px]">public</span>
                  <span>{briefing.countryName} Travel Facts</span>
                </h3>
                <span className="text-xs font-semibold text-slate-400">Reference</span>
              </div>

              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex flex-col">
                  <span className="text-slate-400 font-medium">Country Calling Code</span>
                  <span className="text-base font-bold text-slate-900 mt-0.5">{briefing.callingCode}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex flex-col">
                  <span className="text-slate-400 font-medium">Standard Timezone</span>
                  <span className="text-base font-bold text-slate-900 mt-0.5">{briefing.timezone}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex flex-col">
                  <span className="text-slate-400 font-medium">Power Plugs</span>
                  <span className="text-sm font-bold text-slate-900 mt-0.5">{briefing.powerPlugs}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex flex-col">
                  <span className="text-slate-400 font-medium">Local Currency</span>
                  <span className="text-sm font-bold text-slate-900 mt-0.5">
                    {briefing.currency} ({briefing.currencySymbol})
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Map Preferences */}
          <div className="rounded-2xl bg-white p-5 sm:p-6 shadow-sm border border-slate-200/80 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-slate-500 text-[18px]">tune</span>
                <span>Search & Map Data</span>
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
                OpenStreetMap
              </span>
            </div>

            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Real-world places, hospitals, transit hubs, and tourist attractions are retrieved live using OpenStreetMap and Photon geocoding.
            </p>


          </div>
        </div>
      </div>
    </div>
  );
};
