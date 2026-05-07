import { useState } from 'react';
import { useOfficialRates } from './useOfficialRates';

const BASE = { id: 0, code: 'SYP', country: 'الليرة السورية', flag: 'https://flagcdn.com/w40/sy.png', buy: 1, sell: 1 };

export default function CurrencyConverter() {
  const { rates, loading } = useOfficialRates();

  const [mode,   setMode]   = useState('buy');
  const [fromId, setFromId] = useState('SYP');
  const [toId,   setToId]   = useState('USD');
  const [amount, setAmount] = useState('');

  const allOptions = [BASE, ...rates];

  const getRate = (code) => {
    if (code === 'SYP') return 1;
    const c = rates.find(x => x.code === code);
    if (!c) return 1;
    return mode === 'buy' ? Number(c.buy) : Number(c.sell);
  };

  const calculate = () => {
    const val = parseFloat(amount);
    if (!val || isNaN(val) || val <= 0) return '';
    return ((val * getRate(fromId)) / getRate(toId))
      .toLocaleString('en-US', { maximumFractionDigits: 2 });
  };

  const result = calculate();

  return (
    <div className="conv-card">
      <div className="conv-title">تحويل العملات</div>
      <div className="conv-tabs">
        <button className={`conv-tab ${mode === 'buy'  ? 'conv-tab--active' : ''}`} onClick={() => setMode('buy')}>شراء</button>
        <button className={`conv-tab ${mode === 'sell' ? 'conv-tab--active' : ''}`} onClick={() => setMode('sell')}>بيع</button>
      </div>
      <div className="conv-field">
        <label className="conv-label">من</label>
        <select className="conv-select" value={fromId} onChange={e => setFromId(e.target.value)} disabled={loading}>
          {allOptions.map(c => <option key={c.code} value={c.code}>{c.code} — {c.country}</option>)}
        </select>
        <input
          className="conv-input"
          type="number"
          min="0"
          placeholder="أدخل الكمية"
          value={amount}
          onChange={e => setAmount(e.target.value)}
        />
      </div>
      <div className="conv-arrow">⇅</div>
      <div className="conv-field">
        <label className="conv-label">إلى</label>
        <select className="conv-select" value={toId} onChange={e => setToId(e.target.value)} disabled={loading}>
          {allOptions.map(c => <option key={c.code} value={c.code}>{c.code} — {c.country}</option>)}
        </select>
      </div>
      <div className="conv-result">
        {loading
          ? <span className="conv-result__placeholder">جاري التحميل…</span>
          : result
            ? <><span className="conv-result__val">{result}</span><span className="conv-result__code">{toId}</span></>
            : <span className="conv-result__placeholder">أدخل الكمية لعرض النتيجة</span>
        }
      </div>
    </div>
  );
}
