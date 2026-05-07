import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import CurrencyHero from '../components/CurrencyHero';
import Table from '../components/Table';
import TableNavBar from '../components/TableNavBar';
import { useOfficialRates } from '../components/useOfficialRates';
import { useForexRates, FOREX_SOURCE_LABELS } from '../components/useForexRates';
import * as XLSX from 'xlsx';

function getSafeMargin(raw) {
  const n = Number(raw);
  if (!n || n <= 0 || n >= 9999) return 12;
  return n;
}

// Always truncate down at 3 decimal places, never round up
const floor3 = (n) => Math.floor(n * 1000) / 1000;

function applyMargin(rate, margin) {
  const mul  = 1 + (Number(margin) || 0) / 100;
  const avg  = Number(rate.average ?? rate.avg) * mul;
  const buy  = Number(rate.buy)  * mul;
  const sell = Number(rate.sell) * mul;
  return { ...rate, clientBuy: buy, clientSell: sell, clientAvg: avg };
}


function exportToExcel(displayRows, margin, maxMargin, source, usdRates) {
  const today    = new Date().toLocaleDateString('ar-SY');
  const srcLabel = source ? FOREX_SOURCE_LABELS[source] : 'النشرة الرسمية';

  const usdRow = [
    'الدولار الأمريكي', 'USD',
    usdRates.clientBuy, usdRates.clientSell, usdRates.clientAvg,
    '', '', '',
  ];

  const ws1 = XLSX.utils.aoa_to_sheet([
    ['نشرات البنك المركزي السوري — جدول أسعار الشركة'],
    [`تاريخ: ${today}   |   المصدر: ${srcLabel}   |   هامش البنك المركزي: ${maxMargin}%   |   هامش الشركة: ${margin}%`],
    [],
    ['البلد', 'الكود', 'شراء الشركة', 'بيع الشركة', 'وسطي الشركة', `شراء ${srcLabel}`, `بيع ${srcLabel}`, `وسطي ${srcLabel}`],
    usdRow,
    ...displayRows
      .filter(r => r.code !== 'USD')
      .map(r => {
        const buy  = r.finalBuy  ?? r.clientBuy;
        const sell = r.finalSell ?? r.clientSell;
        const avg  = r.finalAvg  ?? r.clientAvg;
        return [r.country, r.code, buy, sell, avg, Number(r.buy), Number(r.sell), Number(r.mid ?? r.average ?? r.avg)];
      }),
  ]);
  ws1['!cols']   = [{ wch: 22 }, { wch: 8 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 16 }];
  ws1['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 7 } }, { s: { r: 1, c: 0 }, e: { r: 1, c: 7 } }];

  const ws2 = XLSX.utils.aoa_to_sheet([
    ['كود العملة', 'سعر الشراء', 'سعر البيع', 'السعر الوسطي'],
    ['USD', usdRates.clientBuy, usdRates.clientSell, usdRates.clientAvg],
    ...displayRows
      .filter(r => r.code !== 'USD')
      .map(r => {
        const buy  = r.finalBuy  ?? r.clientBuy;
        const sell = r.finalSell ?? r.clientSell;
        const avg  = r.finalAvg  ?? r.clientAvg;
        return [r.code, buy, sell, avg];
      }),
  ]);
  ws2['!cols'] = [{ wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 16 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws1, 'نشرة الأسعار');
  XLSX.utils.book_append_sheet(wb, ws2, 'برنامج الحوالات');
  XLSX.writeFile(wb, `نشرة_الشركة_${today.replace(/\//g, '-')}.xlsx`);
}

const FOREX_SOURCES = [
  { id: 'central',   label: 'المركزي (فوركس)' },
  { id: 'reuters',   label: 'Reuters'           },
  { id: 'investing', label: 'Investing'         },
];

const MULTIPLY_CURRENCIES = ['EUR', 'GBP', 'AUD'];

export default function CompanyPage() {
  const [selectedId,      setSelectedId]      = useState('USD');
  const [effectiveMargin, setEffectiveMargin] = useState(0);
  const [forexSource,     setForexSource]     = useState(null);
  const [dropOpen,        setDropOpen]        = useState(false);
  const dropRef = useRef(null);

  const { rates: officialRates, loading: offLoading, error: offError, priceMargin } = useOfficialRates();
  const { rows: forexRows,      loading: fxLoading,  error: fxError  }              = useForexRates(forexSource);

  const maxMargin = getSafeMargin(priceMargin);

  useEffect(() => {
    function handle(e) {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const handleMarginChange = useCallback((m) => setEffectiveMargin(m), []);

  const baseRates = useMemo(() => {
    if (!forexSource || !forexRows.length) return officialRates;
    const usdOfficial = officialRates.find(r => r.code === 'USD');
    const merged = forexRows.map(r => ({ ...r, average: r.average ?? r.avg }));
    if (usdOfficial) {
      const idx = merged.findIndex(r => r.code === 'USD');
      if (idx >= 0) merged[idx] = usdOfficial;
      else merged.unshift(usdOfficial);
    }
    return merged;
  }, [forexSource, forexRows, officialRates]);

  const rows = useMemo(
    () => baseRates.map(r => applyMargin(r, effectiveMargin)),
    [baseRates, effectiveMargin],
  );

  const usdRates = useMemo(() => rows.find(r => r.code === 'USD') || null, [rows]);

  const finalRates = useMemo(() => {
    if (!forexRows.length) return [];
    const usdAvg = usdRates?.clientAvg;
    if (!usdAvg) return [];
    return forexRows.map(r => {
      const forexAvg = r.mid ?? r.avg ?? r.average;
      const finalAvg = floor3(
        MULTIPLY_CURRENCIES.includes(r.code)
          ? usdAvg * forexAvg
          : usdAvg / forexAvg
      );
      const finalBuy  = floor3(finalAvg * 0.995495495495496);
      const finalSell = floor3(finalAvg * 1.00454545454545);
      return { ...r, finalAvg, finalBuy, finalSell };
    });
  }, [usdRates, forexRows]);


  const displayRows  = finalRates.length > 0 ? finalRates : rows;
  const canExport    = rows.length > 0;
  const isLoading    = offLoading || fxLoading;
  const error        = offError || fxError;
  const marginColor  = effectiveMargin > 0 ? 'var(--green)' : effectiveMargin < 0 ? 'var(--red)' : 'var(--text-secondary)';

  return (
    <>
      <CurrencyHero selectedId={selectedId} onSelect={setSelectedId} />
      <Table onMarginChange={handleMarginChange} />
      <TableNavBar />

      <section className="table-section">
        <div className="table-layout">
          <div className="company-table-wrap">

            {/* ── شريط المعلومات ── */}
            <div className="company-margin-bar">

              {/* Forex dropdown */}
              <div className="cmb-forex-wrap" ref={dropRef}>
                <button
                  className={`cmb-forex-btn ${forexSource ? 'cmb-forex-btn--active' : ''}`}
                  onClick={() => setDropOpen(o => !o)}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="1" y1="6"  x2="23" y2="6"  />
                    <line x1="1" y1="12" x2="23" y2="12" />
                    <line x1="1" y1="18" x2="23" y2="18" />
                  </svg>
                  {forexSource ? FOREX_SOURCE_LABELS[forexSource] : 'مصدر الفوركس'}
                  <span style={{ fontSize: '10px', opacity: 0.7 }}>{dropOpen ? '▲' : '▾'}</span>
                </button>

                {dropOpen && (
                  <div className="cmb-forex-dropdown">
                    {FOREX_SOURCES.map(s => (
                      <button
                        key={s.id}
                        className={`cmb-forex-item ${forexSource === s.id ? 'cmb-forex-item--active' : ''}`}
                        onClick={() => { setForexSource(s.id); setDropOpen(false); }}
                      >
                        {s.label}
                      </button>
                    ))}
                    {forexSource && (
                      <button
                        className="cmb-forex-item"
                        style={{ color: 'var(--red)', borderTop: '1px solid var(--border-color)' }}
                        onClick={() => { setForexSource(null); setDropOpen(false); }}
                      >
                        ✕ العودة للنشرة الرسمية
                      </button>
                    )}
                  </div>
                )}
              </div>

              {forexSource && (
                <span className="cmb-forex-source-badge">
                  📡 {FOREX_SOURCE_LABELS[forexSource]}
                </span>
              )}

              {usdRates && (
                <div className="cmb-inline-row">
                  <span className="cmb-badge cmb-badge--buy">
                    <span className="cmb-badge-label">شراء</span>
                    {usdRates.clientBuy.toLocaleString()}
                  </span>
                  <span
                    className="cmb-margin-pill"
                    style={{
                      color:        marginColor,
                      borderColor:  effectiveMargin > 0 ? 'var(--green-border)' : effectiveMargin < 0 ? 'var(--red-border)' : 'var(--border-heavy)',
                      background:   effectiveMargin > 0 ? 'var(--green-bg)'     : effectiveMargin < 0 ? 'var(--red-bg)'     : 'var(--accent-gold-rgba-06)',
                    }}
                  >
                    {effectiveMargin > 0 ? '+' : ''}{effectiveMargin}%
                  </span>
                  <span className="cmb-badge cmb-badge--sell">
                    <span className="cmb-badge-label">بيع</span>
                    {usdRates.clientSell.toLocaleString()}
                  </span>
                  <span className="cmb-badge cmb-badge--avg">
                    <span className="cmb-badge-label">وسطي</span>
                    {usdRates.clientAvg.toLocaleString()}
                  </span>
                </div>
              )}

              <button
                className="cmb-export"
                disabled={!canExport}
                onClick={() => exportToExcel(displayRows, effectiveMargin, maxMargin, forexSource, usdRates)}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                تصدير Excel
              </button>
            </div>

            {/* ── الجدول ── */}
            {isLoading && <div className="forex-state-msg">جاري تحميل البيانات…</div>}
            {error     && <div className="forex-state-msg forex-state-msg--error">{error}</div>}

            {!isLoading && !error && rows.length > 0 && (
              <>
                <div className="company-header-row">
                  <div className="table-header-cell col-country">البلد</div>
                  <div className="table-header-cell col-code">كود</div>
                  <div className="table-header-cell col-num">شراء الشركة</div>
                  <div className="table-header-cell col-num">بيع الشركة</div>
                  <div className="table-header-cell col-num col-sep-after">وسطي الشركة</div>
                  <div className="table-header-cell col-num mgt-official">شراء النشرة المعتمدة</div>
                  <div className="table-header-cell col-num mgt-official">بيع النشرة المعتمدة</div>
                  <div className="table-header-cell col-num mgt-official">وسطي النشرة المعتمدة</div>
                </div>
                <div className="table-body">
                  {displayRows.map((row, i) => {
                    const isSelected = row.id === selectedId || row.code === selectedId;
                    const buy      = row.finalBuy  ?? row.clientBuy;
                    const sell     = row.finalSell ?? row.clientSell;
                    const avg      = row.finalAvg  ?? row.clientAvg;
                    const forexBuy  = Number(row.buy);
                    const forexSell = Number(row.sell);
                    const forexAvg  = Number(row.mid ?? row.average ?? row.avg);

                    return (
                      <div
                        key={row.code}
                        onClick={() => setSelectedId(row.code)}
                        className={`company-data-row ${i % 2 === 0 ? 'table-row-even' : 'table-row-odd'}${isSelected ? ' table-row-selected' : ''}`}
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
                          <span className="table-numeric mgt-buy">{buy.toLocaleString()}</span>
                        </div>
                        <div className="table-data-cell col-num desktop-cell">
                          <span className="table-numeric mgt-sell">{sell.toLocaleString()}</span>
                        </div>
                        <div className="table-data-cell col-num desktop-cell col-sep-after">
                          <span className="table-numeric mgt-avg">{avg.toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}</span>
                        </div>
                        <div className="table-data-cell col-num desktop-cell mgt-official">
                          <span className="table-numeric">{forexBuy.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</span>
                        </div>
                        <div className="table-data-cell col-num desktop-cell mgt-official">
                          <span className="table-numeric">{forexSell.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</span>
                        </div>
                        <div className="table-data-cell col-num desktop-cell mgt-official">
                          <span className="table-numeric">{forexAvg.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</span>
                        </div>
                        <div className="card-chips">
                          <div className="chip"><span className="chip__label">كود</span><span className="chip__value chip__value--code">{row.code}</span></div>
                          <div className="chip"><span className="chip__label">شراء الشركة</span><span className="chip__value mgt-buy">{buy.toLocaleString()}</span></div>
                          <div className="chip"><span className="chip__label">بيع الشركة</span><span className="chip__value mgt-sell">{sell.toLocaleString()}</span></div>
                          <div className="chip"><span className="chip__label">وسطي الشركة</span><span className="chip__value mgt-avg">{avg.toLocaleString()}</span></div>
                          <div className="chip"><span className="chip__label">شراء النشرة المعتمدة</span><span className="chip__value">{forexBuy.toLocaleString()}</span></div>
                          <div className="chip"><span className="chip__label">بيع النشرة المعتمدة</span><span className="chip__value">{forexSell.toLocaleString()}</span></div>
                          <div className="chip"><span className="chip__label">وسطي النشرة المعتمدة</span><span className="chip__value">{forexAvg.toLocaleString()}</span></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
