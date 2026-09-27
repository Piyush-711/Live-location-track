import React from 'react';
import { LiveLocationState } from '../hooks/useLiveLocation';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  location?: LiveLocationState;
  onRequestGPS?: () => void;
}

export const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  children
}) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-start text-slate-900 antialiased">
      {/* Main Container Shell */}
      <div className="w-full max-w-6xl mx-auto flex-1 flex flex-col bg-white min-h-screen sm:border-x sm:border-slate-200/70 shadow-sm">
        {children}
      </div>
    </div>
  );
};
