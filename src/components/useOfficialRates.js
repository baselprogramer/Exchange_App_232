import { useState, useEffect } from 'react';

const OFFICIAL_URL = 'https://skydeliverydash.tuqaatech.info/api/currency/official';

let cachedRates = null;
let cachedMargin = null;
let cacheTime   = 0;
const CACHE_TTL = 60_000; // 1 minute

export function useOfficialRates() {
  const [rates,   setRates]   = useState(cachedRates || []);
  const [priceMargin, setPriceMargin] = useState(null);
  const [loading, setLoading] = useState(!cachedRates);
  const [error,   setError]   = useState('');

  useEffect(() => {
    const now = Date.now();
    if (cachedRates && now - cacheTime < CACHE_TTL) {
      setRates(cachedRates);
      setPriceMargin(cachedMargin);
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch(OFFICIAL_URL)
      .then(res => {
        if (!res.ok) throw new Error('Network error');
        return res.json();
      })

      .then(data => {
        const rows = data.rows || [];
        cachedRates = rows;
        cachedMargin = data.priceMargin || null;
        cacheTime = Date.now();
        setRates(rows);
        setPriceMargin(data.priceMargin || null);
        setLoading(false);
      })
      .catch(() => {
        setError('تعذّر تحميل البيانات، تحقق من الاتصال وأعد المحاولة.');
        setLoading(false);
      });
  }, []);

  return { rates, loading, error , priceMargin};
}
