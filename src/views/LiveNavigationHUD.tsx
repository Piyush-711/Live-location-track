import React, { useState, useEffect } from 'react';
import { RouteResponse } from '../types';
import { speechEngine } from '../services/speechEngine';

interface LiveNavigationHUDProps {
  route: RouteResponse;
  onEndNavigation: () => void;
  onOpenVoiceSettings: () => void;
  onOpenEmergency: () => void;
}

export const LiveNavigationHUD: React.FC<LiveNavigationHUDProps> = ({
  route,
  onEndNavigation,
  onOpenVoiceSettings,
  onOpenEmergency
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [distanceRemaining, setDistanceRemaining] = useState(route.steps[0]?.distanceMeters || 45);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showStepsDrawer, setShowStepsDrawer] = useState(false);

  const currentStep = route.steps[currentStepIndex] || route.steps[0];
  const nextStep = route.steps[currentStepIndex + 1];

  // Announce the step when step changes
  useEffect(() => {
    if (currentStep) {
      setIsSpeaking(true);
      const instructionText = `In ${distanceRemaining} meters, ${currentStep.instruction}. ${currentStep.landmark ? currentStep.landmark : ''}`;
      speechEngine.speak(instructionText, () => setIsSpeaking(false));
    }
    return () => {
      speechEngine.stop();
    };
  }, [currentStepIndex]);

  // Simulate walking step advancement
  const handleAdvanceStep = () => {
    if (currentStepIndex < route.steps.length - 1) {
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      setDistanceRemaining(route.steps[nextIndex].distanceMeters);
    } else {
      // Arrived!
      speechEngine.playAcousticChime('arrive');
      speechEngine.speak("You have arrived at your destination.");
    }
  };

  const handleReplayVoice = () => {
    if (currentStep) {
      setIsSpeaking(true);
      const instructionText = `In ${distanceRemaining} meters, ${currentStep.instruction}.`;
      speechEngine.speak(instructionText, () => setIsSpeaking(false));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-surface overflow-hidden max-w-md mx-auto">
      {/* Top Status & Metrics Bar */}
      <div className="pt-safe px-4 py-3 bg-surface/95 backdrop-blur-md border-b border-[#eae6df] flex items-center justify-between shadow-tactile-sm">
        <div className="flex items-center gap-2">
          <div className="px-2 py-0.5 rounded-full bg-surface-container shadow-tactile-inset-sm flex items-center gap-1.5 text-[11px] font-bold text-primary">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping"></span>
            <span>GPS ±3m</span>
          </div>
          <div className="px-2 py-0.5 rounded-full bg-surface-container shadow-tactile-inset-sm flex items-center gap-1 text-[11px] font-bold text-on-surface-variant">
            <span className="material-symbols-outlined text-[13px] text-primary">cloud_off</span>
            <span>100% Offline OSRM</span>
          </div>
          <div className="hidden xs:flex items-center gap-0.5 text-[11px] font-mono font-bold text-outline">
            <span className="material-symbols-outlined text-[13px]">explore</span>
            <span>350° N</span>
          </div>
        </div>

        <button
          onClick={onEndNavigation}
          className="w-8 h-8 rounded-full bg-surface-container shadow-tactile active:scale-95 flex items-center justify-center text-outline hover:text-on-surface"
          aria-label="Exit navigation"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>

      {/* Acoustic Guidance Banner */}
      <div className="px-4 py-2 bg-[#E0F2FE]/70 border-b border-[#BAE6FD] flex items-center justify-between text-[11px] font-bold text-primary">
        <span className="flex items-center gap-1.5">
          <span className={`material-symbols-outlined text-[16px] ${isSpeaking ? 'animate-bounce' : ''}`}>
            hearing
          </span>
          <span>Acoustic Signal Active • Voice Engine Live</span>
        </span>
        <button
          onClick={handleReplayVoice}
          className="px-2 py-0.5 rounded-full bg-surface text-primary border border-primary/20 shadow-tactile-sm active:scale-95"
        >
          Repeat Voice
        </button>
      </div>

      {/* Main Maneuver Area */}
      <div className="flex-1 p-4 flex flex-col justify-between overflow-y-auto">
        {/* Giant Active Turn Card */}
        <div className="flex flex-col gap-4">
          <div className="rounded-[24px] bg-surface p-5 shadow-tactile-lg border border-[#eae6df] flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="w-16 h-16 rounded-2xl bg-primary text-white flex items-center justify-center shadow-tactile-primary">
                <span className="material-symbols-outlined text-[38px]">
                  {currentStep.maneuver === 'turn_right' ? 'turn_right' :
                   currentStep.maneuver === 'turn_left' ? 'turn_left' :
                   currentStep.maneuver === 'arrive' ? 'pin_drop' : 'straight'}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[12px] font-extrabold uppercase tracking-wide text-primary block">
                  Next Turn In
                </span>
                <span className="text-[32px] font-black text-on-surface leading-none">
                  {distanceRemaining}m
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-[#eae6df]/70">
              <h2 className="text-[19px] font-extrabold text-on-surface leading-snug">
                {currentStep.instruction}
              </h2>
              {currentStep.instructionLocal && (
                <p className="text-[13px] font-medium text-on-surface-variant mt-0.5">
                  {currentStep.instructionLocal}
                </p>
              )}
            </div>

            {currentStep.landmark && (
              <div className="rounded-xl bg-surface-container p-2.5 shadow-tactile-inset-sm flex items-center gap-2 text-[11px] font-medium text-on-surface-variant border border-[#eae6df]/60">
                <span className="material-symbols-outlined text-primary text-[16px] flex-shrink-0">
                  storefront
                </span>
                <span>{currentStep.landmark}</span>
              </div>
            )}
          </div>

          {/* Next Turn Preview */}
          {nextStep ? (
            <div className="rounded-2xl bg-surface-container-low p-3.5 shadow-tactile-sm border border-[#eae6df] flex items-center gap-3 text-on-surface-variant">
              <div className="w-9 h-9 rounded-xl bg-surface flex items-center justify-center text-primary shadow-tactile-inset-sm flex-shrink-0">
                <span className="material-symbols-outlined text-[20px]">
                  {nextStep.maneuver === 'turn_right' ? 'turn_right' :
                   nextStep.maneuver === 'turn_left' ? 'turn_left' :
                   nextStep.maneuver === 'arrive' ? 'pin_drop' : 'straight'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-outline block">
                  Then in {nextStep.distanceMeters}m
                </span>
                <span className="text-[12px] font-extrabold text-on-surface truncate block">
                  {nextStep.instruction}
                </span>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl bg-emerald-50 p-3 border border-emerald-200 text-emerald-800 text-[12px] font-bold text-center">
              Final Destination Ahead
            </div>
          )}

          {/* Simulation Helper */}
          <button
            onClick={handleAdvanceStep}
            className="w-full py-2.5 rounded-xl bg-surface border border-primary/30 shadow-tactile text-primary text-[12px] font-bold flex items-center justify-center gap-1.5 active:scale-98 transition-transform"
          >
            <span className="material-symbols-outlined text-[16px]">fast_forward</span>
            <span>Simulate Walking ({currentStepIndex + 1} of {route.steps.length} Steps)</span>
          </button>
        </div>

        {/* Bottom Navigation Control Bar */}
        <div className="pt-4 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={onOpenVoiceSettings}
              className="h-11 px-3.5 rounded-full bg-surface text-on-surface shadow-tactile active:shadow-tactile-inset flex items-center gap-1.5 text-[12px] font-bold"
              title="Voice Settings"
            >
              <span className="material-symbols-outlined text-[18px] text-primary">volume_up</span>
              <span>Audio</span>
            </button>

            <button
              onClick={() => setShowStepsDrawer(!showStepsDrawer)}
              className="h-11 px-3.5 rounded-full bg-surface text-on-surface shadow-tactile active:shadow-tactile-inset flex items-center gap-1.5 text-[12px] font-bold"
            >
              <span className="material-symbols-outlined text-[18px] text-primary">format_list_bulleted</span>
              <span>Steps ({route.steps.length})</span>
            </button>

            <button
              onClick={onOpenEmergency}
              className="h-11 px-3.5 rounded-full bg-red-50 text-red-600 border border-red-200 shadow-tactile-sm active:scale-95 flex items-center gap-1 text-[12px] font-bold"
            >
              <span className="material-symbols-outlined text-[18px]">emergency</span>
              <span>SOS</span>
            </button>
          </div>

          <button
            onClick={onEndNavigation}
            className="w-full h-12 rounded-full bg-surface-container text-red-600 font-extrabold text-[14px] shadow-tactile active:shadow-tactile-inset border border-red-200 flex items-center justify-center gap-2 select-none"
          >
            <span className="material-symbols-outlined text-[20px]">stop_circle</span>
            <span>End Navigation</span>
          </button>
        </div>
      </div>

      {/* Steps Drawer Sheet (if opened) */}
      {showStepsDrawer && (
        <div className="absolute inset-x-0 bottom-0 top-20 bg-surface/98 backdrop-blur-xl z-30 p-4 border-t border-[#eae6df] flex flex-col gap-3 overflow-y-auto shadow-2xl">
          <div className="flex items-center justify-between pb-2 border-b border-[#eae6df]">
            <span className="text-[15px] font-extrabold text-on-surface">Route Steps</span>
            <button 
              onClick={() => setShowStepsDrawer(false)}
              className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-outline"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
          <div className="flex flex-col gap-2.5">
            {route.steps.map((st, idx) => (
              <div 
                key={st.id} 
                onClick={() => { setCurrentStepIndex(idx); setShowStepsDrawer(false); }}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer ${
                  idx === currentStepIndex 
                    ? 'bg-[#E0F2FE] border-[#BAE6FD] text-primary font-bold' 
                    : 'bg-surface border-[#eae6df] text-on-surface'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-[12px] font-mono font-bold">{idx + 1}.</span>
                  <span className="text-[12px]">{st.instruction}</span>
                </div>
                <span className="text-[11px] opacity-75">{st.distanceMeters}m</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
