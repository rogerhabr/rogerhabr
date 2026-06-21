import { useState, useEffect } from 'react';

export interface StockInfo {
  price: number | null;
  prevClose: number | null;
  changePct: number | null;
  marketCap: number | null;
}

export interface CapExInfo {
  value: number | null;    // $B, annual from most recent 10-K
  period: string | null;   // YYYY-MM-DD end date
  source: string | null;
}

export interface LiveData {
  lastUpdated: string | null;
  sources: Record<string, string>;
  stocks: Record<string, StockInfo | null>;
  gpuCloud: {
    azureH100PerHour: number | null;
    lambdaH100PerHour: number | null;
  };
  capex: Record<string, CapExInfo | null>;
  modelPricing: Record<string, { inputPerM: number; outputPerM: number }>;
}

const EMPTY: LiveData = {
  lastUpdated: null,
  sources: {},
  stocks: {},
  gpuCloud: { azureH100PerHour: null, lambdaH100PerHour: null },
  capex: {},
  modelPricing: {},
};

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
