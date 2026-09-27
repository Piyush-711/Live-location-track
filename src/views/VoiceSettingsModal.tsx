import React, { useState } from 'react';
import { VolumeProfile, VoiceSettings } from '../types';
import { storage } from '../services/storage';
import { speechEngine } from '../services/speechEngine';

interface VoiceSettingsModalProps {
  onClose: () => void;
  onOpenOfflineVault: () => void;
}

export const VoiceSettingsModal: React.FC<VoiceSettingsModalProps> = ({
  onClose,
  onOpenOfflineVault
}) => {
  const [settings, setSettings] = useState<VoiceSettings>(storage.getVoiceSettings());
  const [testingAudio, setTestingAudio] = useState(false);

  const handleSelectMode = (mode: VolumeProfile) => {
    const updated = { ...settings, volumeMode: mode };
    setSettings(updated);
    storage.saveVoiceSettings(updated);
    speechEngine.updateVolume(mode);
    speechEngine.playAcousticChime('tap');
  };

  const handleToggleChimes = () => {
    const updated = { ...settings, chimesEnabled: !settings.chimesEnabled };
    setSettings(updated);
    storage.saveVoiceSettings(updated);
    if (updated.chimesEnabled) {
      speechEngine.playAcousticChime('turn');
    }
  };

  const handleLanguageChange = (lang: string) => {
    const updated = { ...settings, language: lang };
    setSettings(updated);
    storage.saveVoiceSettings(updated);
  };

  const handleTestVoice = () => {
    setTestingAudio(true);
    speechEngine.speak(
      "In 45 meters, turn right at the upcoming intersection. Turn-by-turn navigation is active.",
      () => setTestingAudio(false)
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-md rounded-3xl bg-white p-5 sm:p-6 shadow-2xl border border-slate-200 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">record_voice_over</span>
            </div>
            <h2 className="text-base font-bold text-slate-900">Audio & Voice Guidance</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Volume Profiles */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-slate-500">
            Audio Volume Level
          </span>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'low' as VolumeProfile, label: 'Quiet', desc: 'Indoor / Calm' },
              { id: 'standard' as VolumeProfile, label: 'Standard', desc: 'Urban Walk' },
              { id: 'outdoor_boost' as VolumeProfile, label: 'Boosted', desc: 'Street Traffic' }
            ].map(profile => {
              const active = settings.volumeMode === profile.id;
              return (
                <button
                  key={profile.id}
                  onClick={() => handleSelectMode(profile.id)}
                  className={`p-3 rounded-2xl flex flex-col items-center text-center transition-all select-none cursor-pointer ${
                    active
                      ? 'bg-sky-50 border-sky-200 text-sky-900 ring-1 ring-sky-500/20 font-bold'
                      : 'bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-medium'
                  }`}
                >
                  <span className="text-xs font-bold">{profile.label}</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">{profile.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Test Voice Button */}
        <button
          onClick={handleTestVoice}
          disabled={testingAudio}
          className="w-full h-11 rounded-xl bg-sky-600 hover:bg-sky-700 text-white flex items-center justify-center gap-2 text-xs font-bold shadow-sm active:scale-98 transition-all cursor-pointer"
        >
          <span className={`material-symbols-outlined text-[18px] ${testingAudio ? 'animate-spin' : ''}`}>
            {testingAudio ? 'graphic_eq' : 'play_arrow'}
          </span>
          <span>{testingAudio ? 'Speaking Sample...' : 'Test Voice Synthesis'}</span>
        </button>

        {/* Chimes Toggle */}
        <div 
          onClick={handleToggleChimes}
          className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 cursor-pointer hover:bg-slate-100 transition-colors"
        >
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-800">Turn Chimes</span>
            <span className="text-[11px] text-slate-500">Play an alert chime right before each turn</span>
          </div>
          <div className={`w-10 h-6 rounded-full p-0.5 transition-colors ${settings.chimesEnabled ? 'bg-sky-600' : 'bg-slate-300'}`}>
            <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${settings.chimesEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
          </div>
        </div>

        {/* Language Selection */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-slate-500">
            Guidance Language
          </span>
          <select
            value={settings.language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 outline-none cursor-pointer"
          >
            <option value="en-US">English (United States)</option>
            <option value="en-GB">English (United Kingdom)</option>
            <option value="ja-JP">Japanese (日本語)</option>
          </select>
        </div>

        {/* Regional Packs Link */}
        <button
          onClick={() => {
            onClose();
            onOpenOfflineVault();
          }}
          className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px] text-sky-600">cloud_download</span>
          <span>Download Offline Guides</span>
        </button>
      </div>
    </div>
  );
};
