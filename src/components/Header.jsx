export default function Header() {
  return (
    <header className="site-header">
      <div className="header-inner">
        <div className="header-main">
          <h1 className="header-title">
            <span className="header-title-line1">Screen Time &amp; Technology&nbsp;Use</span>
            <span className="header-title-line2">in California TK-12 Schools</span>
          </h1>
          <p className="header-subtitle">Parent/Caregiver Survey Results</p>
        </div>
        <div className="header-right">
          <a href="https://www.distractionfreeschoolsca.org" target="_blank" rel="noopener noreferrer">
            <img src="/logo.png" alt="Distraction Free Schools California" className="header-logo" />
          </a>
          <a
            className="header-cta"
            href="https://survey.distractionfreeschoolsca.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Take the Survey
          </a>
        </div>
      </div>
    </header>
  );
}
