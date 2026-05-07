import { useState, useEffect } from 'react';

const FOREX_URL   = 'https://skydeliverydash.tuqaatech.info/api/currency/Forex';
const REUTERS_KEY = '4a6d0ef868b7cb56ef97f962';

const FLAGS = {
  USD:'https://flagcdn.com/w40/us.png', EUR:'https://flagcdn.com/w40/eu.png',
  GBP:'https://flagcdn.com/w40/gb.png', JPY:'https://flagcdn.com/w40/jp.png',
  CNY:'https://flagcdn.com/w40/cn.png', TRY:'https://flagcdn.com/w40/tr.png',
  SAR:'https://flagcdn.com/w40/sa.png', QAR:'https://flagcdn.com/w40/qa.png',
  AED:'https://flagcdn.com/w40/ae.png', KWD:'https://flagcdn.com/w40/kw.png',
  BHD:'https://flagcdn.com/w40/bh.png', OMR:'https://flagcdn.com/w40/om.png',
  JOD:'https://flagcdn.com/w40/jo.png', EGP:'https://flagcdn.com/w40/eg.png',
  CHF:'https://flagcdn.com/w40/ch.png', CAD:'https://flagcdn.com/w40/ca.png',
  DKK:'https://flagcdn.com/w40/dk.png', SEK:'https://flagcdn.com/w40/se.png',
  NOK:'https://flagcdn.com/w40/no.png', AUD:'https://flagcdn.com/w40/au.png',
  RUB:'https://flagcdn.com/w40/ru.png',
};

const NAMES = {
  USD:'الدولار الأمريكي',   EUR:'اليورو',
  GBP:'الجنيه الاسترليني',  JPY:'الين الياباني',
  CNY:'اليوان الصيني',       TRY:'الليرة التركية',
  SAR:'الريال السعودي',      QAR:'الريال القطري',
  AED:'الدرهم الإماراتي',   KWD:'الدينار الكويتي',
  BHD:'الدينار البحريني',   OMR:'الريال العماني',
  JOD:'الدينار الاردني'  ,    EGP:'الجنبة المصري',
  CHF:'الفرنك السويسري' ,    CAD:'الدولار الكندي',
  DKK:'الكرون الدنماركي',   SEK:'الكرون السويدي',
  NOK:'الكرون النرويجي',    AUD:'الدولار الأسترالي',
  RUB:'الروبل الروسي'
};

const CURRENCY_IDS = Object.keys(FLAGS).filter(id => id !== 'USD');

function buildRows(rates) {
  return CURRENCY_IDS.map(id => {
    const mid = rates[id];
    if (!mid) return null;
    const buy  = parseFloat((mid * 0.995).toFixed(4));
    const sell = parseFloat((mid * 1.005).toFixed(4));
    const avg  = parseFloat(mid.toFixed(4));
    return { id, code: id, country: NAMES[id] || id, flag: FLAGS[id] || '', buy, sell, average: avg };
  }).filter(Boolean);
}

async function fetchCentral() {
  const res = await fetch(FOREX_URL);
  if (!res.ok) throw new Error('Network error');
  const data = await res.json();
  
  const allRows = data.rows || [];

  return allRows
    .filter(row => CURRENCY_IDS.includes(row.code))
    .map(r => ({
      ...r,
      country: NAMES[r.code] || r.country,
      flag: FLAGS[r.code] || r.flag,    
      average: parseFloat(((Number(r.buy) + Number(r.sell)) / 2).toFixed(3)),
    }));
}

async function fetchReuters() {
  const res  = await fetch(`https://v6.exchangerate-api.com/v6/${REUTERS_KEY}/latest/USD`);
  const data = await res.json();
  if(data.conversion_rates.EUR ) { data.conversion_rates.EUR = parseFloat((1/data.conversion_rates.EUR).toFixed(4)); }
  if(data.conversion_rates.GBP ) { data.conversion_rates.GBP = parseFloat((1/data.conversion_rates.GBP).toFixed(4)); }
  if(data.conversion_rates.AUD ) { data.conversion_rates.AUD = parseFloat((1/data.conversion_rates.AUD).toFixed(4)); }
  return buildRows(data.conversion_rates);
}

async function fetchCoinbase() {
  const res  = await fetch('https://api.coinbase.com/v2/exchange-rates?currency=USD');
  const data = await res.json();
  const raw  = data.data.rates;
  if(data.data.rates.EUR ) { data.data.rates.EUR = parseFloat((1/data.data.rates.EUR).toFixed(4)); }
  if(data.data.rates.GBP ) { data.data.rates.GBP = parseFloat((1/data.data.rates.GBP).toFixed(4)); }
  if(data.data.rates.AUD ) { data.data.rates.AUD = parseFloat((1/data.data.rates.AUD).toFixed(4)); }
  const rates = {};
  for (const [key, val] of Object.entries(raw)) rates[key] = parseFloat(val);
  return buildRows(rates);
}

const FETCHERS = {
  central:   fetchCentral,
  reuters:   fetchReuters,
  investing: fetchCoinbase,
};

export const FOREX_SOURCE_LABELS = {
  central:   'المركزي (فوركس)',
  reuters:   'Reuters',
  investing: 'Investing',
};

export function useForexRates(source) {
  const [rows,    setRows]    = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  useEffect(() => {
    if (!source) { setRows([]); return; }
    setLoading(true);
    setError('');
    setRows([]);
    FETCHERS[source]()
      .then(data => { setRows(data); setLoading(false); })
      .catch(() => { setError('تعذّر تحميل بيانات الفوركس'); setLoading(false); });
    }, [source]);

  return { rows, loading, error };
}