import React, { useState } from 'react';
import { Place } from '../types';
import { getCategoryVisualMeta, getDynamicPlaceImage } from '../utils/placeVisuals';

interface PlaceThumbnailProps {
  place: Place;
  className?: string;
  iconSize?: number;
  showBadgeLabel?: boolean;
}

export const PlaceThumbnail: React.FC<PlaceThumbnailProps> = ({
  place,
  className = "w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-slate-100 flex-shrink-0 relative shadow-inner",
  iconSize = 32,
  showBadgeLabel = true
}) => {
  const [imageError, setImageError] = useState(false);
  const visualMeta = getCategoryVisualMeta(place.category, place.name);
  const resolvedImg = getDynamicPlaceImage(place);

  const hasValidImage = !imageError && Boolean(resolvedImg);

  return (
    <div className={className}>
      {hasValidImage ? (
        <img
          src={resolvedImg}
          alt={place.name}
          onError={() => setImageError(true)}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      ) : (
        <div 
          className={`w-full h-full flex flex-col items-center justify-center p-2 text-center select-none ${visualMeta.bgClass} ${visualMeta.textClass} border ${visualMeta.borderClass}`}
          title={`${visualMeta.label}: ${place.name}`}
        >
          <span 
            className="material-symbols-outlined transition-transform group-hover:scale-110" 
            style={{ fontSize: `${iconSize}px` }}
          >
            {visualMeta.icon}
          </span>
          {showBadgeLabel && (
            <span className="text-[10px] font-extrabold uppercase tracking-wider mt-1 opacity-90 truncate max-w-full px-1">
              {visualMeta.label}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
