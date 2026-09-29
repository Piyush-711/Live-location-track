import { useEffect, useState } from 'react';

export function useDesktopMap() {
  const [desktop, setDesktop] = useState(() => window.matchMedia('(min-width: 768px)').matches);
  useEffect(() => {
    const query = window.matchMedia('(min-width: 768px)');
    const update = () => setDesktop(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return desktop;
}
