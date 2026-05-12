import { useOfficialRates } from './useOfficialRates';
import CurrencyConverter from './CurrencyConverter';

export default function ExchangeTable({ selectedId, onSelect }) {
  const { rates, loading, error } = useOfficialRates();

  return (
    <section className="table-section">
      <div className="table-layout">
        <div className="table-container">

          <div className="table-header-row">
            <div className="table-header-cell col-country">البلد</div>
            <div className="table-header-cell col-code">كود</div>
            <div className="table-header-cell col-num">شراء</div>
            <div className="table-header-cell col-num">بيع</div>
            <div className="table-header-cell col-num">السعر الوسطي</div>
            <div className="table-header-cell col-num">الهامش</div>
          </div>

          <div className="table-body">
            {loading && <div className="forex-state-msg">جاري تحميل البيانات…</div>}
            {error   && <div className="forex-state-msg forex-state-msg--error">{error}</div>}
            {!loading && !error && rates.map((currency, index) => {
              const isSelected = currency.id === selectedId;
              return (
                <div
                  key={currency.id}
                  onClick={() => onSelect(currency.id)}
                  className={`table-data-row ${index % 2 === 0 ? 'table-row-even' : 'table-row-odd'} ${isSelected ? 'table-row-selected' : ''}`}
                >
                  <div className="table-country-cell col-country">
                    <div className="table-country-content">
                      <img src={currency.flag} alt={currency.country} className="table-flag-image" loading="lazy" />
                      <span className="table-country-name">{currency.country}</span>
                    </div>
                  </div>
                  <div className="table-data-cell col-code desktop-cell">
                    <span className="table-currency-code table-numeric">{currency.code}</span>
                  </div>
                  <div className="table-data-cell col-num desktop-cell">
                    <span className="table-numeric">{Number(currency.buy).toLocaleString()}</span>
                  </div>
                  <div className="table-data-cell col-num desktop-cell">
                    <span className="table-numeric">{Number(currency.sell).toLocaleString()}</span>
                  </div>
                  <div className="table-data-cell col-num desktop-cell">
                    <span className="table-numeric">{Number(currency.average).toLocaleString()}</span>
                  </div>
                  <div className="table-data-cell col-num desktop-cell">
                    <span className="table-numeric">{Number(currency.margin).toLocaleString()}</span>
                  </div>
                  <div className="card-chips">
                    <div className="chip"><span className="chip__label">كود</span><span className="chip__value chip__value--code">{currency.code}</span></div>
                    <div className="chip"><span className="chip__label">شراء</span><span className="chip__value">{Number(currency.buy).toLocaleString()}</span></div>
                    <div className="chip"><span className="chip__label">بيع</span><span className="chip__value">{Number(currency.sell).toLocaleString()}</span></div>
                    <div className="chip"><span className="chip__label">السعر الوسطي</span><span className="chip__value">{Number(currency.average).toLocaleString()}</span></div>
                    <div className="chip"><span className="chip__label">الهامش</span><span className="chip__value">{Number(currency.margin).toLocaleString()}</span></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <CurrencyConverter />
      </div>
    </section>
  );
}
