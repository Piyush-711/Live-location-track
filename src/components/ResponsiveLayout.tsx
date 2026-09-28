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
    <div className="min-h-screen w-full bg-slate-50 flex flex-col justify-start text-slate-900 antialiased">
      {/* Main Container Shell - Edge-to-edge full width across desktop and mobile */}
      <div className="w-full flex-1 flex flex-col bg-white min-h-screen">
        {children}
      </div>
    </div>
  );
};
