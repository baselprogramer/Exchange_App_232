import Logo from '../assets/logo.svg';

export default function Header({ theme, onToggleTheme }) {
  return (
    <header className="header-container">
      <div className="header-left">
        <h1 className="header-title">نشرات أسعار الصرف الرسمية</h1>
        <p className="header-subtitle">نشرة الأسعار الحية للشركات المعتمدة</p>
      </div>
      <div className="header-right">
        <div className="header-sync-info">
          <span className="header-sync-label">Last Sync</span>
          <span className="header-sync-time table-numeric">{new Date().toLocaleString('en-US', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
          })}</span>
        </div>
        <button
          className="theme-toggle"
          onClick={onToggleTheme}
          aria-label={theme === 'dark' ? 'تفعيل الوضع الفاتح' : 'تفعيل الوضع الداكن'}
          title={theme === 'dark' ? 'الوضع الفاتح' : 'الوضع الداكن'}
        >
          {theme === 'dark' ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="4"/>
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
            </svg>
          )}
        </button>
        <img alt="logo" className="header-emblem" src={Logo} />
      </div>
    </header>
  );
}
