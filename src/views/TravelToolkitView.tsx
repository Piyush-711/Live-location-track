import React, { useState, useEffect, useCallback } from 'react';
import { CountryBriefing, CurrencyRates, WeatherReport } from '../types';
import { api } from '../services/api';
import { CITIES } from '../data/mockData';
import { fxService, POPULAR_CURRENCIES } from '../services/fxService';

interface TravelToolkitViewProps {
  activeCityId: string;
  liveCountryCode?: string;
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

export const TravelToolkitView: React.FC<TravelToolkitViewProps> = ({ activeCityId, liveCountryCode }) => {
  const activeCity = CITIES.find(c => c.id === activeCityId) || CITIES[0];
  const effectiveCountry = liveCountryCode || activeCity.countryCode;

  const [briefing, setBriefing] = useState<CountryBriefing | null>(null);
  const [rates, setRates] = useState<CurrencyRates | null>(null);
  const [weather, setWeather] = useState<WeatherReport | null>(null);

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

  // Google Maps / Places Engine settings
  const [googleApiKey, setGoogleApiKey] = useState(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('google_places_api_key') || '' : '';
  });
  const [keySavedFeedback, setKeySavedFeedback] = useState(false);

  const handleSaveGoogleKey = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('google_places_api_key', googleApiKey.trim());
    setKeySavedFeedback(true);
    setTimeout(() => setKeySavedFeedback(false), 2500);
  };

  // Load rates and briefing
  const loadRates = useCallback(async (force = false) => {
    try {
      if (force) setIsRefreshingRates(true);
      const data = await api.getFXRates(force);
      setRates(data);
      if (force) {
        setSyncFeedback('Rates synced with live market! Next 12h update scheduled.');
        setTimeout(() => setSyncFeedback(null), 3500);
      }
    } catch (e) {
      console.warn('Failed to load rates', e);
      if (force) {
        setSyncFeedback('Unable to reach live rates. Retaining cached data.');
        setTimeout(() => setSyncFeedback(null), 3500);
      }
    } finally {
      if (force) setIsRefreshingRates(false);
    }
  }, []);

  useEffect(() => {
    api.getCountryBriefing(effectiveCountry).then(setBriefing);
    loadRates(false);
    api.getWeather(activeCityId).then(setWeather);

    // Update target currency to match country
    if (effectiveCountry === 'JP') setToCurrency('JPY');
    else if (effectiveCountry === 'GB') setToCurrency('GBP');
    else if (effectiveCountry === 'IN') setToCurrency('INR');
    else if (effectiveCountry === 'AU') setToCurrency('AUD');
    else if (effectiveCountry === 'CA') setToCurrency('CAD');
    else setToCurrency('EUR');
  }, [activeCityId, effectiveCountry, loadRates]);

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
    <div className="flex-1 flex flex-col w-full max-w-md mx-auto px-4 pb-28 pt-2">
      {/* Title */}
      <div className="py-2 flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-extrabold text-on-surface">Travel Toolkit</h1>
          <p className="text-[11px] text-on-surface-variant font-medium">
            Dynamic 12h Live Rates • Verified Dossier • Offline Resilient
          </p>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-surface-container shadow-tactile-inset-sm text-primary font-bold text-[11px] flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px]">bolt</span>
          <span>12h Live Sync</span>
        </span>
      </div>

      {/* Country Briefing Dossier */}
      {briefing && (
        <section className="pt-1 pb-3">
          <div className="rounded-[22px] bg-surface p-4 shadow-tactile border border-[#eae6df] flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-primary flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  flag
                </span>
                <span>{briefing.countryName} Dossier</span>
              </span>
              <span className="text-[10px] font-bold text-outline">Verified Standards</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2.5 rounded-xl bg-surface-container shadow-tactile-inset-sm flex flex-col">
                <span className="text-outline font-semibold">Calling Code</span>
                <span className="text-[14px] font-extrabold text-on-surface mt-0.5">{briefing.callingCode}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-surface-container shadow-tactile-inset-sm flex flex-col">
                <span className="text-outline font-semibold">Timezone</span>
                <span className="text-[14px] font-extrabold text-on-surface mt-0.5">{briefing.timezone}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-surface-container shadow-tactile-inset-sm flex flex-col">
                <span className="text-outline font-semibold">Power Plugs</span>
                <span className="text-[13px] font-bold text-on-surface mt-0.5">{briefing.powerPlugs}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-surface-container shadow-tactile-inset-sm flex flex-col">
                <span className="text-outline font-semibold">Currency</span>
                <span className="text-[13px] font-bold text-on-surface mt-0.5">
                  {briefing.currency} ({briefing.currencySymbol})
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Real-time Dynamic Payment & Currency Exchange */}
      <section className="pb-4">
        <div className="rounded-[22px] bg-surface p-4 shadow-tactile border border-[#eae6df] flex flex-col gap-3">
          {/* Header with 12h Live Status and Refresh Button */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[13px] font-extrabold text-on-surface flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-[18px]">currency_exchange</span>
                <span>Live Currency & Payment Rates</span>
              </span>
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-outline mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>{rates?.isLive ? 'Live Interbank Rates' : 'Cached Baseline'}</span>
                <span>•</span>
                <span>Next refresh: {countdownText || '12 hours'}</span>
              </div>
            </div>

            <button
              onClick={() => loadRates(true)}
              disabled={isRefreshingRates}
              className={`p-2 rounded-xl bg-surface-container shadow-tactile active:scale-95 text-primary flex items-center gap-1 text-[11px] font-bold transition-all ${
                isRefreshingRates ? 'opacity-60 cursor-not-allowed' : ''
              }`}
              title="Force Sync Live Rates"
            >
              <span className={`material-symbols-outlined text-[16px] ${isRefreshingRates ? 'animate-spin' : ''}`}>
                sync
              </span>
              <span className="hidden sm:inline">Sync Now</span>
            </button>
          </div>

          {/* Toast / Sync Feedback Alert */}
          {syncFeedback && (
            <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold flex items-center gap-1.5 animate-fadeIn">
              <span className="material-symbols-outlined text-[15px] text-emerald-600">check_circle</span>
              <span>{syncFeedback}</span>
            </div>
          )}

          {/* Amount Display Wells */}
          <div className="flex flex-col gap-2">
            {/* Input Row */}
            <div className="p-3 rounded-2xl bg-surface-container shadow-tactile-inset flex items-center justify-between">
              <div className="flex items-center gap-2">
                <select
                  value={fromCurrency}
                  onChange={(e) => setFromCurrency(e.target.value)}
                  className="bg-surface font-extrabold text-[13px] text-primary py-1 px-2.5 rounded-xl shadow-tactile-sm outline-none border border-primary/20 cursor-pointer"
                >
                  {POPULAR_CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.code} ({c.symbol})
                    </option>
                  ))}
                </select>
              </div>
              <span className="text-[24px] font-black text-on-surface font-mono">
                {inputAmount}
              </span>
            </div>

            {/* Swap Button */}
            <div className="flex justify-center -my-1.5 z-10">
              <button
                onClick={handleSwapCurrencies}
                className="w-8 h-8 rounded-full bg-surface shadow-tactile active:scale-90 flex items-center justify-center text-primary border border-[#eae6df]"
                title="Swap Currencies"
              >
                <span className="material-symbols-outlined text-[18px]">swap_vert</span>
              </button>
            </div>

            {/* Result Row */}
            <div className="p-3 rounded-2xl bg-surface-container-low shadow-tactile-inset flex items-center justify-between border border-[#eae6df]">
              <div className="flex items-center gap-2">
                <select
                  value={toCurrency}
                  onChange={(e) => setToCurrency(e.target.value)}
                  className="bg-surface font-extrabold text-[13px] text-secondary py-1 px-2.5 rounded-xl shadow-tactile-sm outline-none border border-secondary/20 cursor-pointer"
                >
                  {POPULAR_CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.code} ({c.symbol})
                    </option>
                  ))}
                </select>
              </div>
              <span className="text-[26px] font-black text-primary font-mono">
                {convertedAmount}
              </span>
            </div>
          </div>

          {/* Direct Exchange Unit Rate Indicator */}
          {directUnitRate && (
            <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-surface-container text-[11px] font-bold text-on-surface-variant">
              <span>
                1 {fromCurrency} = {directUnitRate < 1 ? directUnitRate.toFixed(4) : directUnitRate.toFixed(2)} {toCurrency}
              </span>
              <span className="text-outline font-semibold">
                1 {toCurrency} = {(1 / directUnitRate) < 1 ? (1 / directUnitRate).toFixed(4) : (1 / directUnitRate).toFixed(2)} {fromCurrency}
              </span>
            </div>
          )}

          {/* Quick Amount Preset Chips */}
          <div className="flex items-center gap-1.5 pt-0.5">
            <span className="text-[10px] font-bold text-outline uppercase tracking-wider mr-1">Presets:</span>
            {['10', '50', '100', '500', '1000'].map((amt) => (
              <button
                key={amt}
                onClick={() => setInputAmount(amt)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all shadow-tactile-sm active:scale-95 ${
                  inputAmount === amt 
                    ? 'bg-primary text-white shadow-tactile-inset-sm' 
                    : 'bg-surface text-on-surface border border-[#eae6df]'
                }`}
              >
                {amt}
              </button>
            ))}
          </div>

          {/* Tactile Keypad */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'C'].map((k) => (
              <button
                key={k}
                onClick={() => handleKeypadPress(k)}
                className="h-11 rounded-xl bg-surface text-on-surface font-extrabold text-[15px] shadow-tactile active:shadow-tactile-inset transition-all flex items-center justify-center select-none"
              >
                {k}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Local Payment Methods & Intelligence */}
      <section className="pb-4">
        <div className="rounded-[22px] bg-surface p-4 shadow-tactile border border-[#eae6df] flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-extrabold uppercase tracking-wider text-primary flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">payments</span>
              <span>Local Payment Guide ({briefing?.countryName || effectiveCountry})</span>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 font-bold text-[10px]">
              Accepted Methods
            </span>
          </div>

          <div className="flex flex-col gap-2.5 text-[11px]">
            {/* Primary Digital Method */}
            <div className="p-3 rounded-xl bg-[#F0F9FF] border border-[#E0F2FE] flex items-start gap-2.5">
              <span className="material-symbols-outlined text-primary text-[20px] flex-shrink-0 mt-0.5">
                {paymentGuide.primaryIcon}
              </span>
              <div className="flex flex-col">
                <span className="font-extrabold text-on-surface">Top Digital Method</span>
                <span className="text-on-surface-variant font-medium mt-0.5">
                  {paymentGuide.primaryMethod}
                </span>
              </div>
            </div>

            {/* Cash Requirements */}
            <div className="p-3 rounded-xl bg-[#FFFBEB] border border-[#FEF3C7] flex items-start gap-2.5">
              <span className="material-symbols-outlined text-amber-600 text-[20px] flex-shrink-0 mt-0.5">
                attach_money
              </span>
              <div className="flex flex-col">
                <span className="font-extrabold text-on-surface">Cash Necessity</span>
                <span className="text-on-surface-variant font-medium mt-0.5">
                  {paymentGuide.cashRequirement}
                </span>
              </div>
            </div>

            {/* Card & Tipping Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="p-2.5 rounded-xl bg-surface-container shadow-tactile-inset-sm flex flex-col">
                <span className="text-outline font-semibold">Cards & ATMs</span>
                <span className="text-[11px] text-on-surface font-medium mt-1">
                  {paymentGuide.cardAdvice}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-surface-container shadow-tactile-inset-sm flex flex-col">
                <span className="text-outline font-semibold">Tipping Customs</span>
                <span className="text-[11px] text-on-surface font-medium mt-1">
                  {paymentGuide.tippingNorm}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Local Weather Card */}
      {weather && (
        <section className="pb-4">
          <div className="rounded-[22px] bg-surface p-4 shadow-tactile border border-[#eae6df] flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-extrabold uppercase text-outline">Live Conditions</span>
                <h3 className="text-[16px] font-extrabold text-on-surface">{weather.city}</h3>
              </div>
              <div className="flex items-center gap-1.5 text-primary">
                <span className="material-symbols-outlined text-[28px]">wb_sunny</span>
                <span className="text-[26px] font-black">{weather.tempC}°C</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-on-surface-variant font-semibold pt-1 border-t border-[#eae6df]/70">
              <span>{weather.condition}</span>
              <span>H: {weather.highC}°C • L: {weather.lowC}°C • Humidity {weather.humidity}%</span>
            </div>

            {/* Hourly Pills */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
              {weather.hourly.map((h, i) => (
                <div key={i} className="px-3 py-2 rounded-xl bg-surface-container shadow-tactile-inset-sm flex flex-col items-center flex-shrink-0 text-[10px]">
                  <span className="text-outline font-semibold">{h.time}</span>
                  <span className="text-[12px] font-extrabold text-on-surface my-0.5">{h.tempC}°</span>
                  <span className="text-primary font-bold">{h.condition}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Map & Geocoding Engine Preferences */}
      <section className="pb-6">
        <div className="rounded-[22px] bg-surface p-4 shadow-tactile border border-[#eae6df] flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-extrabold uppercase tracking-wider text-primary flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">map</span>
              <span>Map & Geocoding Engine</span>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 font-bold text-[10px]">
              Geolib WGS-84 Active
            </span>
          </div>

          <p className="text-[11px] text-on-surface-variant font-medium leading-relaxed">
            The app uses millimetric geodesic distance formulas from <code className="text-primary font-bold">geolib</code> and fetches 100% verified real facilities from OpenStreetMap Nominatim and Komoot Photon.
          </p>

          <form onSubmit={handleSaveGoogleKey} className="flex flex-col gap-2 pt-1 border-t border-[#eae6df]/70">
            <label className="text-[11px] font-bold text-on-surface flex items-center justify-between">
              <span>Optional Google Places API Key:</span>
              {keySavedFeedback && (
                <span className="text-emerald-600 font-bold text-[10px] animate-pulse">Saved Successfully!</span>
              )}
            </label>
            <div className="flex gap-2">
              <input
                type="password"
                placeholder="AIzaSy... (optional for Google POIs)"
                value={googleApiKey}
                onChange={(e) => setGoogleApiKey(e.target.value)}
                className="flex-1 px-3 py-2 text-[12px] rounded-xl bg-surface-container border border-[#eae6df] focus:outline-none focus:border-primary font-mono"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-primary text-white text-[12px] font-bold shadow-tactile active:scale-95 transition-all"
              >
                Save
              </button>
            </div>
            <p className="text-[10px] text-outline">
              Without an API key, Google Maps Street & Satellite tiles plus free high-precision Nominatim & Photon POIs work automatically with zero configuration.
            </p>
          </form>
        </div>
      </section>
    </div>
  );
};
