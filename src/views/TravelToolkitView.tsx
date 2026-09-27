import React, { useState, useEffect } from 'react';
import { CountryBriefing, CurrencyRates, WeatherReport } from '../types';
import { api } from '../services/api';
import { CITIES } from '../data/mockData';

interface TravelToolkitViewProps {
  activeCityId: string;
  liveCountryCode?: string;
}

export const TravelToolkitView: React.FC<TravelToolkitViewProps> = ({ activeCityId, liveCountryCode }) => {
  const activeCity = CITIES.find(c => c.id === activeCityId) || CITIES[0];
  const effectiveCountry = liveCountryCode || activeCity.countryCode;

  const [briefing, setBriefing] = useState<CountryBriefing | null>(null);
  const [rates, setRates] = useState<CurrencyRates | null>(null);
  const [weather, setWeather] = useState<WeatherReport | null>(null);

  // Currency Converter state
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState(effectiveCountry === 'JP' ? 'JPY' : effectiveCountry === 'IN' ? 'INR' : effectiveCountry === 'GB' ? 'GBP' : 'USD');
  const [inputAmount, setInputAmount] = useState('100');

  useEffect(() => {
    api.getCountryBriefing(effectiveCountry).then(setBriefing);
    api.getFXRates().then(setRates);
    api.getWeather(activeCityId).then(setWeather);

    // Update target currency to match country
    if (effectiveCountry === 'JP') setToCurrency('JPY');
    else if (effectiveCountry === 'GB') setToCurrency('GBP');
    else if (effectiveCountry === 'IN') setToCurrency('INR');
    else if (effectiveCountry === 'AU') setToCurrency('AUD');
    else if (effectiveCountry === 'CA') setToCurrency('CAD');
    else setToCurrency('EUR');
  }, [activeCityId, effectiveCountry]);

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
  if (rates && rates.rates[fromCurrency] && rates.rates[toCurrency]) {
    const num = parseFloat(inputAmount) || 0;
    // Base is USD
    const inUSD = num / rates.rates[fromCurrency];
    const converted = inUSD * rates.rates[toCurrency];
    convertedAmount = toCurrency === 'JPY' ? Math.round(converted).toLocaleString() : converted.toFixed(2);
  }

  return (
    <div className="flex-1 flex flex-col w-full max-w-md mx-auto px-4 pb-28 pt-2">
      {/* Title */}
      <div className="py-2 flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-extrabold text-on-surface">Travel Toolkit</h1>
          <p className="text-[11px] text-on-surface-variant font-medium">
            Essential utilities • Offline calculated • ECB reference
          </p>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-surface-container shadow-tactile-inset-sm text-primary font-bold text-[11px] flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px]">tune</span>
          <span>Offline Ready</span>
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
                <span className="text-outline font-semibold">Voltage</span>
                <span className="text-[13px] font-bold text-on-surface mt-0.5">{briefing.voltage}</span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-[#F0F9FF] border border-[#E0F2FE] text-[11px] text-on-surface-variant flex items-start gap-2 font-medium">
              <span className="material-symbols-outlined text-primary text-[16px] flex-shrink-0 mt-0.5">
                credit_card
              </span>
              <span>{briefing.transitTip}</span>
            </div>
          </div>
        </section>
      )}

      {/* Tactile Currency Converter with Keypad */}
      <section className="pb-4">
        <div className="rounded-[22px] bg-surface p-4 shadow-tactile border border-[#eae6df] flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-extrabold text-on-surface flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-[18px]">currency_exchange</span>
              <span>Indicative Currency Converter</span>
            </span>
            <span className="text-[10px] font-semibold text-outline">
              ECB Rates • {rates?.asOf ? new Date(rates.asOf).toLocaleDateString() : 'Live'}
            </span>
          </div>

          {/* Amount Display Wells */}
          <div className="flex flex-col gap-2">
            {/* Input Row */}
            <div className="p-3 rounded-2xl bg-surface-container shadow-tactile-inset flex items-center justify-between">
              <div className="flex items-center gap-2">
                <select
                  value={fromCurrency}
                  onChange={(e) => setFromCurrency(e.target.value)}
                  className="bg-surface font-extrabold text-[13px] text-primary py-1 px-2.5 rounded-xl shadow-tactile-sm outline-none border border-primary/20"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="JPY">JPY (¥)</option>
                  <option value="INR">INR (₹)</option>
                  <option value="AUD">AUD (A$)</option>
                  <option value="CAD">CAD (C$)</option>
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
                  className="bg-surface font-extrabold text-[13px] text-secondary py-1 px-2.5 rounded-xl shadow-tactile-sm outline-none border border-secondary/20"
                >
                  <option value="JPY">JPY (¥)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="INR">INR (₹)</option>
                  <option value="AUD">AUD (A$)</option>
                  <option value="CAD">CAD (C$)</option>
                </select>
              </div>
              <span className="text-[26px] font-black text-primary font-mono">
                {convertedAmount}
              </span>
            </div>
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

      {/* Cultural Etiquette Tips */}
      {briefing && briefing.culturalEtiquette.length > 0 && (
        <section className="pb-6">
          <div className="rounded-[22px] bg-surface p-4 shadow-tactile border border-[#eae6df] flex flex-col gap-2.5">
            <span className="text-[13px] font-extrabold text-on-surface">Local Customs & Etiquette</span>
            <div className="flex flex-col gap-2 text-[11px] text-on-surface-variant">
              {briefing.culturalEtiquette.map((tip, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0"></span>
                  <span className="font-medium leading-relaxed">{tip}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
