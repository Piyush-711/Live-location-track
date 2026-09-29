import { VolumeProfile } from '../types';
import { storage } from './storage';

class SpeechEngineService {
  private audioCtx: AudioContext | null = null;
  private volumeMultiplier: number = 0.8;
  private scheduledSpeech: ReturnType<typeof setTimeout> | undefined;
  private generation = 0;

  constructor() {
    const settings = storage.getVoiceSettings();
    this.updateVolume(settings.volumeMode);
  }

  private initAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      void this.audioCtx.resume().catch(() => undefined);
    }
    return this.audioCtx;
  }

  public updateVolume(profile: VolumeProfile): void {
    switch (profile) {
      case 'low':
        this.volumeMultiplier = 0.45;
        break;
      case 'standard':
        this.volumeMultiplier = 0.80;
        break;
      case 'outdoor_boost':
        this.volumeMultiplier = 1.0;
        break;
    }
  }

  // Play high-clarity acoustic wayfinding chime (Web Audio API synthetic tone)
  public playAcousticChime(type: 'turn' | 'arrive' | 'tap' = 'turn'): void {
    try {
      const ctx = this.initAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.onended = () => { osc.disconnect(); gain.disconnect(); };

      const now = ctx.currentTime;

      if (type === 'turn') {
        // Double pleasant rising chime (e.g. 587Hz -> 880Hz, D5 to A5)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, now);
        osc.frequency.exponentialRampToValueAtTime(880.00, now + 0.12);
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.25 * this.volumeMultiplier, now + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
        osc.start(now);
        osc.stop(now + 0.3);
      } else if (type === 'arrive') {
        // Tri-tone harmonious fanfare
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.1);
        osc.frequency.setValueAtTime(783.99, now + 0.2);
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.3 * this.volumeMultiplier, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.52);
      } else {
        // Soft tactile click
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, now);
        gain.gain.setValueAtTime(0.1 * this.volumeMultiplier, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        osc.start(now);
        osc.stop(now + 0.05);
      }
    } catch (e) {
      console.warn('AudioContext chime error:', e);
    }
  }

  // Voice speech synthesis
  public speak(text: string, onEnd?: () => void): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      if (onEnd) onEnd();
      return;
    }

    try {
      this.stop();
      const generation = this.generation;

      const utterance = new SpeechSynthesisUtterance(text);
      const settings = storage.getVoiceSettings();

      utterance.rate = Number.isFinite(settings.speechRate) ? Math.min(2, Math.max(0.5, settings.speechRate)) : 1;
      this.updateVolume(settings.volumeMode);
      utterance.volume = this.volumeMultiplier;
      utterance.lang = settings.language || 'en-US';

      // Pick high quality voice if available
      const voices = window.speechSynthesis.getVoices();
      const language = utterance.lang.toLowerCase().split('-')[0];
      const matchingVoices = voices.filter(v => v.lang.toLowerCase().split('-')[0] === language);
      const preferred = matchingVoices.find(v => /Natural|Neural|Google|Enhanced/.test(v.name)) || matchingVoices[0];
      if (preferred) {
        utterance.voice = preferred;
      }

      let ended = false;
      const finish = () => {
        if (!ended && generation === this.generation) { ended = true; onEnd?.(); }
      };
      utterance.onend = finish;
      utterance.onerror = finish;

      // Play subtle pre-speech notification chime
      if (settings.chimesEnabled) {
        this.playAcousticChime('turn');
        this.scheduledSpeech = setTimeout(() => {
          this.scheduledSpeech = undefined;
          if (generation === this.generation) window.speechSynthesis.speak(utterance);
        }, 150);
      } else {
        window.speechSynthesis.speak(utterance);
      }
    } catch (err) {
      console.warn('SpeechSynthesis error:', err);
      if (onEnd) onEnd();
    }
  }

  public stop(): void {
    this.generation++;
    if (this.scheduledSpeech !== undefined) clearTimeout(this.scheduledSpeech);
    this.scheduledSpeech = undefined;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
}

export const speechEngine = new SpeechEngineService();
