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
      "In 45 meters, turn right onto Shijo-dori covered arcade toward Gion crossing.",
      () => setTestingAudio(false)
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm rounded-[24px] bg-surface p-5 shadow-tactile-xl border border-[#eae6df] flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-[#eae6df]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[22px] text-primary">record_voice_over</span>
            <span className="text-[15px] font-extrabold text-on-surface">Audio & Voice Engine</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-outline hover:text-on-surface active:scale-95 shadow-tactile-inset-sm"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Volume Profiles */}
        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-on-surface-variant">
            Acoustic Volume Level
          </span>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'low' as VolumeProfile, label: 'Low', desc: 'Indoor / Quiet' },
              { id: 'standard' as VolumeProfile, label: 'Standard', desc: 'Urban Walk' },
              { id: 'outdoor_boost' as VolumeProfile, label: 'Outdoor Boost', desc: 'Traffic / Transit' }
            ].map(profile => {
              const active = settings.volumeMode === profile.id;
              return (
                <button
                  key={profile.id}
                  onClick={() => handleSelectMode(profile.id)}
                  className={`p-2.5 rounded-xl flex flex-col items-center text-center transition-all select-none ${
                    active
                      ? 'bg-[#E0F2FE] border border-[#BAE6FD] text-primary shadow-tactile-inset-sm font-extrabold'
                      : 'bg-surface border border-[#eae6df] text-on-surface shadow-tactile active:scale-95 font-semibold'
                  }`}
                >
                  <span className="text-[12px]">{profile.label}</span>
                  <span className="text-[9px] text-on-surface-variant mt-0.5">{profile.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Test Voice Button */}
        <button
          onClick={handleTestVoice}
          disabled={testingAudio}
          className="w-full h-11 rounded-full tactile-btn-primary flex items-center justify-center gap-2 text-[13px] font-bold shadow-tactile-primary active:scale-98"
        >
          <span className={`material-symbols-outlined text-[18px] ${testingAudio ? 'animate-spin' : ''}`}>
            {testingAudio ? 'graphic_eq' : 'play_arrow'}
          </span>
          <span>{testingAudio ? 'Playing Guidance Sample...' : 'Test Voice Synthesis'}</span>
        </button>

        {/* Chimes Toggle */}
        <div 
          onClick={handleToggleChimes}
          className="flex items-center justify-between p-3 rounded-xl bg-surface shadow-tactile border border-[#eae6df] cursor-pointer"
        >
          <div className="flex flex-col">
            <span className="text-[12px] font-extrabold text-on-surface">Acoustic Signal Chimes</span>
            <span className="text-[10px] text-on-surface-variant">Play gentle tone before speaking turns</span>
          </div>
          <div className={`w-10 h-6 rounded-full p-0.5 transition-colors ${settings.chimesEnabled ? 'bg-primary' : 'bg-surface-variant'}`}>
            <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${settings.chimesEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
          </div>
        </div>

        {/* Language Selection */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-on-surface-variant">
            Guidance Language
          </span>
          <select
            value={settings.language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="w-full h-10 px-3 rounded-xl bg-surface-container shadow-tactile-inset-sm border border-[#eae6df] text-[12px] font-bold text-on-surface outline-none"
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
          className="w-full py-2.5 rounded-xl bg-surface-container-low text-primary text-[11px] font-bold flex items-center justify-center gap-1.5 border border-[#eae6df] shadow-tactile active:scale-98"
        >
          <span className="material-symbols-outlined text-[16px]">add_circle</span>
          <span>Manage & Download More Regional Packs</span>
        </button>
      </div>
    </div>
  );
};
