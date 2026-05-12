import { useOfficialRates } from './useOfficialRates';

const FEATURED_CODES = ['USD', 'EUR', 'TRY', 'SAR'];

export default function CurrencyHero({ selectedId, onSelect }) {
  const { rates, loading, error } = useOfficialRates();

  if (loading) return <div className="hero-wrapper hero-state">جاري تحميل البيانات…</div>;
  if (error)   return <div className="hero-wrapper hero-state hero-state--error">{error}</div>;
  if (!rates.length) return null;

  const selected = rates.find(c => c.id === selectedId) || rates[0];

  return (
    <div className="hero-wrapper">
      <div className="hero-main">
        <div className="hero-main__flag-row">
          <img src={selected.flag} alt={selected.country} className="hero-main__flag" />
          <div className="hero-main__names">
            <span className="hero-main__name-ar">{selected.country}</span>
            <span className="hero-main__code">{selected.code}</span>
          </div>
        </div>
        <div className="hero-main__prices">
          <div className="hero-main__price-item">
            <span className="hero-main__price-label">شراء</span>
            <span className="hero-main__price-value">{Number(selected.buy).toLocaleString()}</span>
          </div>
          <div className="hero-main__divider" />
          <div className="hero-main__price-item">
            <span className="hero-main__price-label">بيع</span>
            <span className="hero-main__price-value">{Number(selected.sell).toLocaleString()}</span>
          </div>
        </div>
      </div>
      <div className="hero-mini-grid">
        {FEATURED_CODES.map(code => {
          const currency = rates.find(c => c.code === code);
          if (!currency) return null;
          const isActive = currency.id === selectedId;
          return (
            <button
              key={currency.id}
              className={`hero-mini ${isActive ? 'hero-mini--active' : ''}`}
              onClick={() => onSelect(currency.id)}
            >
              <div className="hero-mini__top">
                <span className="hero-mini__code">{currency.code}</span>
                <img src={currency.flag} alt={currency.country} className="hero-mini__flag" />
              </div>
              <span className="hero-mini__buy">{Number(currency.buy).toLocaleString()}</span>
              <span className="hero-mini__label">شراء</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
