import { NavLink, Outlet } from 'react-router-dom';
import './AppLayout.scss';

export default function AppLayout() {
  return (
    <div className="app-layout">
      <a className="app-layout__skip" href="#main">
        Skip to content
      </a>

      <header className="app-layout__header">
        <NavLink to="/" className="app-layout__brand" aria-label="AdPilot home">
          <svg className="app-layout__mark" viewBox="0 0 32 32" aria-hidden="true">
            <rect width="32" height="32" rx="7" />
            <path d="M7 22 L14 15 L18 19 L25 10" />
          </svg>
          <span className="app-layout__wordmark">AdPilot</span>
        </NavLink>

        <nav className="app-layout__nav" aria-label="Main">
          <NavLink to="/" end className="app-layout__link">
            Dashboard
          </NavLink>
          <NavLink to="/campaigns/new" className="app-layout__link">
            New campaign
          </NavLink>
        </nav>
      </header>

      <main id="main" className="app-layout__main">
        <Outlet />
      </main>

      <footer className="app-layout__footer">
        Portfolio project by Hiep Nguyen. All campaign data is simulated.
      </footer>
    </div>
  );
}
