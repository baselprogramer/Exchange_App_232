import { Link } from 'react-router-dom';

export default function Error404() {
  return (
    <section className="e404-container">
      <div className="e404-glow-orb" />

      <div className="e404-content">
        <div className="e404-code-wrap">
          <span className="e404-digit">4</span>
          <div className="e404-coin">
            <span className="e404-coin-symbol">$</span>
          </div>
          <span className="e404-digit">4</span>
        </div>

        <div className="e404-divider" />

        <h2 className="e404-title">الصفحة غير موجودة</h2>
        <p className="e404-subtitle">
          يبدو أن هذه الصفحة غير متاحة أو تم نقلها.<br />
          تحقق من الرابط أو عد إلى الصفحة الرئيسية.
        </p>

        <Link to="/" className="e404-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12L12 3l9 9" /><path d="M9 21V12h6v9" />
          </svg>
          العودة إلى الرئيسية
        </Link>
      </div>
    </section>
  );
}
