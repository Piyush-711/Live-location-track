import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { storage } from './storage';
import { speechEngine } from './speechEngine';

class FakeUtterance {
  lang = '';
  voice: unknown;
  onend?: () => void;
  onerror?: () => void;
  constructor(public text: string) {}
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance);
  vi.stubGlobal('speechSynthesis', { cancel: vi.fn(), speak: vi.fn(), getVoices: vi.fn(() => []) });
  vi.spyOn(speechEngine, 'playAcousticChime').mockImplementation(() => {});
  vi.spyOn(storage, 'getVoiceSettings').mockReturnValue({ volumeMode: 'standard', speechRate: 1, language: 'en-US', chimesEnabled: true, ttsEngineReady: true });
});
afterEach(() => { speechEngine.stop(); vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('speech lifecycle', () => {
  it('cancels delayed speech on stop and replaces older scheduled utterances', () => {
    speechEngine.speak('Old instruction');
    speechEngine.stop();
    vi.advanceTimersByTime(200);
    expect(window.speechSynthesis.speak).not.toHaveBeenCalled();
    speechEngine.speak('Replaced instruction');
    speechEngine.speak('Current instruction');
    vi.advanceTimersByTime(200);
    expect(window.speechSynthesis.speak).toHaveBeenCalledTimes(1);
    expect(vi.mocked(window.speechSynthesis.speak).mock.calls[0][0]).toMatchObject({ text: 'Current instruction' });
  });

  it('does not let completion of a cancelled utterance finish the current one', () => {
    const oldFinished = vi.fn();
    const newFinished = vi.fn();
    speechEngine.speak('Old', oldFinished);
    vi.advanceTimersByTime(200);
    const old = vi.mocked(window.speechSynthesis.speak).mock.calls[0][0] as unknown as FakeUtterance;
    speechEngine.speak('New', newFinished);
    old.onend?.();
    expect(oldFinished).not.toHaveBeenCalled();
    expect(newFinished).not.toHaveBeenCalled();
    vi.advanceTimersByTime(200);
    const current = vi.mocked(window.speechSynthesis.speak).mock.calls[1][0] as unknown as FakeUtterance;
    current.onend?.();
    current.onerror?.();
    expect(newFinished).toHaveBeenCalledTimes(1);
  });
});
