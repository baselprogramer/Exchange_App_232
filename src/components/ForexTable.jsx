import { useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';

const FOREX_URL    = 'https://skydeliverydash.tuqaatech.info/api/currency/Forex';
const REUTERS_KEY  = '4a6d0ef868b7cb56ef97f962';

// ── Fetchers ─────────────────────────────────────────────────────────────────

async function fetchCentral() {
  const res  = await fetch(FOREX_URL);
  if (!res.ok) throw new Error('Network error');
  const data = await res.json();
  return (data.rows || []).map(r => ({
    ...r,
    buy: parseFloat(r.buy).toFixed(4),
    sell: parseFloat(r.sell).toFixed(4),
    avg: parseFloat(((Number(r.buy) + Number(r.sell)) / 2).toFixed(4)),
  }));
}

async function fetchExchangeRate() {
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

// ── Helpers ───────────────────────────────────────────────────────────────────

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
  RUB:'https://flagcdn.com/w40/ru.png'
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
    const buy = parseFloat((mid * 0.995).toFixed(4));
    const sell= parseFloat((mid * 1.005).toFixed(4));
    const avg = parseFloat(mid.toFixed(4));
    return { id, code: id, country: NAMES[id] || id, flag: FLAGS[id] || '', buy, sell, avg };
  }).filter(Boolean);
}

const SOURCE_LABELS = {
  central:   'البنك المركزي السوري',
  reuters:   'Reuters — European Central Bank (ECB) via ExchangeRate API',
  investing: 'Investing — Coinbase Exchange Rates API',
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function ForexTable() {
  const [searchParams] = useSearchParams();
  const source = searchParams.get('source') || 'central';

  const [rows,       setRows]       = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const [lastUpdate, setLastUpdate] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    setRows([]);

    const fetcher =
      source === 'central'   ? fetchCentral      :
      source === 'reuters'   ? fetchExchangeRate :
                               fetchCoinbase;

    fetcher()
      .then(data => {
        setRows(data);
        if (source === 'central') {
          // Use date from API if available, otherwise today
          setLastUpdate(new Date().toLocaleDateString('en-US', {
            year: 'numeric', month: '2-digit', day: '2-digit',
          }));
        } else {
          setLastUpdate(new Date().toLocaleString('en-US', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit',
          }));
        }
        setLoading(false);
      })
      .catch(() => {
        setError('تعذّر تحميل البيانات، تحقق من الاتصال وأعد المحاولة.');
        setLoading(false);
      });
  }, [source]);

  return (
    <div className="forex-table-wrap">

      <div className="forex-meta-bar">
        <span className="forex-meta-source">{SOURCE_LABELS[source]}</span>
        {lastUpdate && (
          <span className="forex-meta-update table-numeric">
            {source === 'central' ? `تاريخ النشرة: ${lastUpdate}` : `آخر تحديث: ${lastUpdate}`}
          </span>
        )}
      </div>

      <div className="forex-base-note">
        <img src={FLAGS.USD} alt="USD" className="base-flag" loading="lazy" />
        <span>عملة الأساس: {NAMES.USD}</span>
      </div>

      {loading && <div className="forex-state-msg">جاري تحميل البيانات…</div>}
      {error   && <div className="forex-state-msg forex-state-msg--error">{error}</div>}

      {!loading && !error && rows.length > 0 && (
        <div className="table-container">
          <div className="table-header-row forex-header-row">
            <div className="table-header-cell col-country">البلد</div>
            <div className="table-header-cell col-code">كود</div>
            <div className="table-header-cell col-num">شراء</div>
            <div className="table-header-cell col-num">بيع</div>
            <div className="table-header-cell col-num">السعر الوسطي</div>
          </div>
          <div className="table-body">
            {rows.map((row, index) => (
              <div
                key={row.id}
                className={`table-data-row-forex ${index % 2 === 0 ? 'table-row-even' : 'table-row-odd'}`}
              >
                <div className="table-country-cell col-country">
                  <div className="table-country-content">
                    <img src={row.flag} alt={row.country} className="table-flag-image" loading="lazy" />
                    <span className="table-country-name">{row.country}</span>
                  </div>
                </div>
                <div className="table-data-cell col-code desktop-cell">
                  <span className="table-currency-code table-numeric">{row.code}</span>
                </div>
                <div className="table-data-cell col-num desktop-cell">
                  <span className="table-numeric">{Number(row.buy).toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</span>
                </div>
                <div className="table-data-cell col-num desktop-cell">
                  <span className="table-numeric">{Number(row.sell).toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</span>
                </div>
                <div className="table-data-cell col-num desktop-cell">
                  <span className="table-numeric">{Number(row.avg).toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</span>
                </div>
                <div className="card-chips">
                  <div className="chip"><span className="chip__label">كود</span><span className="chip__value chip__value--code">{row.code}</span></div>
                  <div className="chip"><span className="chip__label">شراء</span><span className="chip__value">{Number(row.buy).toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</span></div>
                  <div className="chip"><span className="chip__label">بيع</span><span className="chip__value">{Number(row.sell).toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</span></div>
                  <div className="chip"><span className="chip__label">وسطي</span><span className="chip__value">{Number(row.avg).toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
