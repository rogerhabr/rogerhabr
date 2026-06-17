import { useState, useEffect } from 'react';

export interface StockInfo {
  price: number | null;
  prevClose: number | null;
  changePct: number | null;
  marketCap: number | null;
}

export interface LiveData {
  lastUpdated: string | null;
  stocks: Record<string, StockInfo | null>;
  gpuCloud: { azureH100PerHour: number | null };
  modelPricing: Record<string, { inputPerM: number; outputPerM: number }>;
}

const EMPTY: LiveData = { lastUpdated: null, stocks: {}, gpuCloud: { azureH100PerHour: null }, modelPricing: {} };

export function useLiveData() {
  const [data, setData] = useState<LiveData>(EMPTY);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const base = process.env.NODE_ENV === 'production' ? '/rogerhabr' : '';
    fetch(`${base}/live-data.json`)
      .then(r => r.json())
      .then((d: LiveData) => { setData(d); setLoaded(true); })
      .catch(() => setLoaded(true));
  }, []);

  return { liveData: data, liveLoaded: loaded };
}
