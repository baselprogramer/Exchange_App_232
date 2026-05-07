import { useState, useMemo, useEffect } from 'react';
import { useOfficialRates } from './useOfficialRates';

function getSafeMargin(raw) {
  const n = Number(raw);
  if (!n || n <= 0 || n >= 9999) return 12;
  return n;
}

// onMarginChange — اختياري، بيرفع الهامش الفعلي لـ CompanyPage
export default function Table({ onMarginChange }) {
  const { rates, loading, priceMargin } = useOfficialRates();

  const [direction, setDirection] = useState('نحو الأعلى');
  const [absValue,  setAbsValue]  = useState('');
  const [marginErr, setMarginErr] = useState('');

  const isUp      = direction === 'نحو الأعلى';
  const maxMargin = getSafeMargin(priceMargin);

  const effectiveMargin = useMemo(() => {
    const n = parseFloat(absValue);
    if (absValue === '' || isNaN(n) || n < 0 || n > maxMargin) return 0;
    return isUp ? n : -n;
  }, [absValue, maxMargin, isUp]);

  // ✅ أبلّغ CompanyPage بالهامش كل ما تغير
  useEffect(() => {
    onMarginChange?.(effectiveMargin);
  }, [effectiveMargin, onMarginChange]);

  if (loading || !rates.length) return null;

  const currency = rates[0];
  const buy      = Number(currency.buy);
  const sell     = Number(currency.sell);
  const average  = Number(currency.average);

  const directionClass = isUp ? 'st-direction--up' : 'st-direction--down';

  const mul        = 1 + effectiveMargin / 100;
  const clientBuy  = parseFloat((buy  * mul).toFixed(3));
  const clientSell = parseFloat((sell * mul).toFixed(3));
  const clientAvg  = parseFloat(((clientBuy + clientSell) / 2).toFixed(3));

  const displayValue = absValue === '' ? '' : (isUp ? absValue : `-${absValue}`);
  const hasValue     = absValue !== '' && parseFloat(absValue) > 0;

  function handleMargin(val) {
    const abs = String(Math.abs(parseFloat(val) || 0));
    const n   = parseFloat(abs);
    setAbsValue(val === '' ? '' : abs);
    if (val === '' || isNaN(n)) setMarginErr('');
    else if (n > maxMargin)     setMarginErr(`الحد الأقصى: ±${maxMargin}%`);
    else                        setMarginErr('');
  }

  return (
    <section className="st-wrapper">
      <div className="st-header-row">
        <div className="st-header-cell">العملة</div>
        <div className="st-header-cell">الحد الأدنى الوسطي</div>
        <div className="st-header-cell">الحد الأعلى الوسطي</div>
        <div className="st-header-cell">السعر الوسطي حسب المركزي</div>
        <div className="st-header-cell">هامش الحركة السعري المركزي</div>
        <div className="st-header-cell">اختيار الاتجاه</div>
        <div className="st-header-cell">هامش الحركة السعري للشركة</div>
      </div>

      <div className="st-data-row">
        <div className="st-cell st-cell--name">{currency.country}</div>
        <div className="st-cell">
          <span className="st-num">{(average * (1 - maxMargin / 100)).toFixed(2)}</span>
        </div>
        <div className="st-cell">
          <span className="st-num">{(average * (1 + maxMargin / 100)).toFixed(3)}</span>
        </div>
        <div className="st-cell st-cell--highlight">
          <span className="st-num">{average.toFixed(2)}</span>
        </div>
        <div className="st-cell st-cell--highlight">
          <span className="st-num" style={{display:'inline-flex',alignItems:'center',gap:'4px',fontSize:'13px'}}>
            <span style={{color:'var(--red)',fontWeight:700}}>-{maxMargin}%</span>
            <span style={{color:'var(--text-secondary)'}}>↔</span>
            <span style={{color:'var(--green)',fontWeight:700}}>+{maxMargin}%</span>
          </span>
        </div>
        <div className={`st-cell ${directionClass}`}>
          <span className="st-direction-badge" onClick={() => setDirection(d => d === 'نحو الأعلى' ? 'نحو الأسفل' : 'نحو الأعلى')}>
            {direction}
            <span className="direction-arrow">{isUp ? '↑' : '↓'}</span>
          </span>
        </div>
        <div className="st-cell st-cell--company" style={{flexDirection:'column',gap:'3px'}}>
          <div style={{display:'flex',alignItems:'center',gap:'4px'}}>
            <input
              className="st-num"
              type="number"
              step="0.001"
              value={displayValue}
              onChange={e => handleMargin(e.target.value)}
              placeholder="0"
              min={-maxMargin}
              max={maxMargin}
              style={{
                width:'72px', padding:'4px 6px',
                background: !hasValue ? 'var(--accent-gold-rgba-06)' : isUp ? 'var(--green-bg)' : 'var(--red-bg)',
                border:`1px solid ${marginErr ? 'var(--red-border)' : !hasValue ? 'var(--border-heavy)' : isUp ? 'var(--green-border)' : 'var(--red-border)'}`,
                borderRadius:'6px',
                color: !hasValue ? 'var(--text-primary)' : isUp ? 'var(--green)' : 'var(--red)',
                fontFamily:'Cairo,sans-serif', fontWeight:700,
                textAlign:'center', outline:'none', direction:'ltr',
              }}
            />
            <span style={{color:'var(--text-secondary)',fontWeight:600,fontSize:'12px'}}>%</span>
          </div>
          {marginErr && <span style={{fontSize:'10px',color:'var(--red)',fontFamily:'Tajawal,sans-serif'}}>{marginErr}</span>}
        </div>
      </div>

      {/* صف شراء */}
      <div className="st-sub-row">
        <div className="st-cell st-cell--empty"></div>
        <div className="st-cell"><span className="st-num">{(buy * (1 - maxMargin/100)).toFixed(2)}</span></div>
        <div className="st-cell"><span className="st-num">{(buy * (1 + maxMargin/100)).toFixed(2)}</span></div>
        <div className="st-cell st-cell--sub-label">شراء</div>
        <div className="st-cell"></div><div className="st-cell"></div><div className="st-cell"></div>
      </div>

      {/* صف بيع */}
      <div className="st-sub-row">
        <div className="st-cell st-cell--empty"></div>
        <div className="st-cell"><span className="st-num">{(sell * (1 - maxMargin/100)).toFixed(2)}</span></div>
        <div className="st-cell"><span className="st-num">{(sell * (1 + maxMargin/100)).toFixed(2)}</span></div>
        <div className="st-cell st-cell--sub-label">بيع</div>
        <div className="st-cell"></div><div className="st-cell"></div><div className="st-cell"></div>
      </div>

      {/* صف أسعار العميل */}
      <div className="st-sub-row" style={{borderTop:'1px solid var(--border-color)',background:'var(--accent-gold-rgba-06)'}}>
        <div className="st-cell st-cell--empty"></div>
          <div className="st-cell st-cell--sub-label">سعر العميل</div>
          <div className="st-cell">
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'2px'}}>
            <span style={{fontSize:'9px',color:'var(--text-secondary)',fontFamily:'Tajawal,sans-serif',textTransform:'uppercase'}}>شراء العميل</span>
            <span className="st-num" style={{color:'var(--green)',fontWeight:700,fontSize:'15px'}}>{clientBuy.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>
        <div className="st-cell">
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'2px'}}>
            <span style={{fontSize:'9px',color:'var(--text-secondary)',fontFamily:'Tajawal,sans-serif',textTransform:'uppercase'}}>بيع العميل</span>
            <span className="st-num" style={{color:'var(--red)',fontWeight:700,fontSize:'15px'}}>{clientSell.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>


        <div className="st-cell">
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'2px'}}>
            <span style={{fontSize:'9px',color:'var(--text-secondary)',fontFamily:'Tajawal,sans-serif',textTransform:'uppercase'}}>الوسطي</span>
            <span className="st-num" style={{color:'var(--accent-gold)',fontWeight:700,fontSize:'14px'}}>{clientAvg.toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3})}</span>
          </div>
        </div>
        <div className="st-cell"></div>
        <div className="st-cell"></div>
      </div>
    </section>
  );
}