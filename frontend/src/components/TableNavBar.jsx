import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';

const FOREX_SOURCES = [
  { id: 'central',   label: 'المركزي'   },
  { id: 'reuters',   label: 'Reuters'   },
  { id: 'investing', label: 'Investing' },
];

export default function TableNavBar() {
  const location       = useLocation();
  const [searchParams] = useSearchParams();

  const isHome    = location.pathname === '/';
  const isForex   = location.pathname === '/forex';
  const isCompany = location.pathname === '/company';

  const activeSource = searchParams.get('source') || 'central';

  const [dropOpen, setDropOpen] = useState(false);
  const dropRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeForexLabel = FOREX_SOURCES.find(s => s.id === activeSource)?.label || 'فوركس';

  return (
    <nav className="table-navbar">

      {/* ── رسمي ── */}
      <Link
        to="/"
        className={`table-navbar__btn ${isHome ? 'table-navbar__btn--active' : ''}`}
      >
        رسمي
      </Link>

      {/* ── فوركس ── */}
      <div className="table-navbar__dropdown-wrap" ref={dropRef}>
        <button
          className={`table-navbar__btn ${isForex ? 'table-navbar__btn--active' : ''}`}
          onClick={() => setDropOpen(prev => !prev)}
        >
          {isForex ? activeForexLabel : 'فوركس'}
          <span className={`table-navbar__arrow ${dropOpen ? 'table-navbar__arrow--open' : ''}`}>▾</span>
        </button>
        {dropOpen && (
          <div className="table-navbar__dropdown">
            {FOREX_SOURCES.map(source => (
              <Link
                key={source.id}
                to={`/forex?source=${source.id}`}
                className={`table-navbar__drop-item ${isForex && activeSource === source.id ? 'table-navbar__drop-item--active' : ''}`}
                onClick={() => setDropOpen(false)}
              >
                {source.label}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* ── هامش الشركة ── */}
      <Link
        to="/company"
        className={`table-navbar__btn table-navbar__btn--margin ${isCompany ? 'table-navbar__btn--active' : ''}`}
      >
       
        هامش الشركة
      </Link>

    </nav>
  );
}