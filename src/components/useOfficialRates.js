import { useState, useEffect } from 'react';

const OFFICIAL_URL = 'https://api.lira-guide.com/api/currency/official';

let cachedRates = null;
let cachedMargin = null;
let cachedBulletinNumber = null;
let cachedPublishDate = null;
let cacheTime   = 0;
const CACHE_TTL = 60_000; // 1 minute

export function useOfficialRates() {
  const [rates,   setRates]   = useState(cachedRates || []);
  const [priceMargin, setPriceMargin] = useState(cachedMargin || null);
  const [bulletinNumber, setBulletinNumber] = useState(cachedBulletinNumber || null);
  const [publishDate, setPublishDate] = useState(cachedPublishDate || null);
  const [loading, setLoading] = useState(!cachedRates);
  const [error,   setError]   = useState('');

  useEffect(() => {
    const now = Date.now();
    if (cachedRates && now - cacheTime < CACHE_TTL) {
      setRates(cachedRates);
      setPriceMargin(cachedMargin);
      setBulletinNumber(cachedBulletinNumber);
      setPublishDate(cachedPublishDate);
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch(OFFICIAL_URL,{credentials: 'include'})
      .then(res => {
        if (!res.ok) throw new Error('Network error');
        return res.json();
      })

      .then(data => {
        const rows = data.rows || [];

        console.log("الـ Object كامل:", data);
    console.log("Keys الموجودة:", Object.keys(data));
    console.log("قيمة النشرة:", data.bulletinNumber);




        cachedRates = rows;
        cachedMargin = data.priceMargin || null;
        cachedBulletinNumber = data.bulletinNumber || null;
        cachedPublishDate = data.publishDate || null;
        cacheTime = Date.now();
        setRates(rows);
        setPriceMargin(data.priceMargin || null);
        setBulletinNumber(data.bulletinNumber || null);
        setPublishDate(data.publishDate || null);
        
        setLoading(false);

        console.log(data.bulletinNumber, data.publishDate , data.priceMargin);
      })
      .catch(() => {
        setError('تعذّر تحميل البيانات، تحقق من الاتصال وأعد المحاولة.');
        setLoading(false);
      });
  }, []);


  return { rates, loading, error , priceMargin , bulletinNumber , publishDate };
}
