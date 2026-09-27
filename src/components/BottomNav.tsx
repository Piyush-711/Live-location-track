import React from 'react';

export type TabType = 'explore' | 'emergency' | 'offline' | 'toolkit';

interface BottomNavProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onChangeTab }) => {
  const tabs = [
    { id: 'explore' as TabType, label: 'Explore', icon: 'explore' },
    { id: 'emergency' as TabType, label: 'Emergency', icon: 'health_and_safety' },
    { id: 'offline' as TabType, label: 'Offline', icon: 'download_for_offline' },
    { id: 'toolkit' as TabType, label: 'Toolkit', icon: 'home_repair_service' }
  ];

  return (
    <nav className="fixed bottom-0 w-full z-40 pb-safe pointer-events-none">
      <div className="px-4 pb-3 pt-1 max-w-md mx-auto">
        <div className="pointer-events-auto h-16 rounded-full bg-surface/95 backdrop-blur-xl shadow-[-6px_-6px_14px_rgba(255,255,255,0.95),6px_8px_18px_rgba(180,172,158,0.45)] border border-[#eae6df]/80 flex items-center justify-around px-2">
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onChangeTab(tab.id)}
                className={`min-w-[68px] h-12 px-3 py-1 rounded-full flex flex-col items-center justify-center transition-all select-none ${
                  isActive
                    ? 'shadow-tactile-inset text-primary font-bold bg-surface-container'
                    : 'text-on-surface-variant hover:text-primary active:scale-95'
                }`}
              >
                <span 
                  className={`material-symbols-outlined text-[22px] transition-transform ${isActive ? 'scale-110' : ''}`}
                  style={isActive && tab.id === 'emergency' ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  {tab.icon}
                </span>
                <span className="text-[10px] tracking-wide mt-0.5 font-semibold">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
