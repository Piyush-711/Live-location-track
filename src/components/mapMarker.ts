import { Place } from '../types';
import { getCategoryVisualMeta, getDynamicPlaceImage } from '../utils/placeVisuals';

// Leaflet accepts an HTMLElement. Never interpolate remote place data into HTML.
export function createPlaceMarker(place: Place, selected: boolean): HTMLElement {
  const visual = getCategoryVisualMeta(place.category, place.name);
  const root = document.createElement('div');
  root.style.cssText = 'color:white;font-size:11px;font-weight:800;padding:2px 8px 2px 3px;border-radius:9999px;box-shadow:0 3px 8px #0004;border:2px solid white;display:flex;align-items:center;gap:5px;white-space:nowrap;transform:translate(-50%,-50%);cursor:pointer';
  root.style.backgroundColor = selected ? '#0284c7' : place.emergencyCapable ? '#ba1a1a' : visual.hex;
  let imageUrl: URL | undefined;
  try {
    const url = new URL(getDynamicPlaceImage(place) || '');
    if (url.protocol === 'https:' || url.protocol === 'http:') imageUrl = url;
  } catch {}
  if (imageUrl) {
    const image = document.createElement('img');
    image.src = imageUrl.href;
    image.alt = '';
    image.referrerPolicy = 'no-referrer';
    image.style.cssText = 'width:20px;height:20px;border-radius:50%;object-fit:cover;border:1.5px solid white;flex-shrink:0';
    root.append(image);
  } else {
    const icon = document.createElement('span');
    icon.textContent = visual.emoji;
    root.append(icon);
  }
  const label = document.createElement('span');
  label.textContent = place.name || 'Place';
  label.style.cssText = 'max-width:90px;overflow:hidden;text-overflow:ellipsis;font-weight:700';
  root.append(label);
  if (Number.isFinite(place.distanceMeters)) {
    const distance = document.createElement('span');
    distance.textContent = `${Math.round(place.distanceMeters)}m`;
    distance.style.cssText = 'opacity:.85;font-size:10px;font-weight:600';
    root.append(distance);
  }
  return root;
}
