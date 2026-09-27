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
        <div className="pointer-events-auto h-16 rounded-full bg-white/90 backdrop-blur-2xl shadow-[0_10px_35px_rgba(0,0,0,0.08)] border border-slate-200/80 flex items-center justify-around px-2">
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onChangeTab(tab.id)}
                className={`min-w-[68px] h-12 px-3 py-1 rounded-full flex flex-col items-center justify-center transition-all select-none cursor-pointer ${
                  isActive
                    ? 'bg-sky-50 text-sky-600 font-bold shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 active:scale-95'
                }`}
              >
                <span 
                  className={`material-symbols-outlined text-[22px] transition-transform ${isActive ? 'scale-110' : ''}`}
                  style={isActive && tab.id === 'emergency' ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  {tab.icon}
                </span>
                <span className="text-[10px] tracking-wide mt-0.5 font-medium">
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
