export default function Footer({ generated }) {
  const date = generated
    ? new Date(generated).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
    })
    : null;

  return (
    <footer className="site-footer">
      <div className="footer-inner">
        {date && <p className="footer-updated">Data last updated: {date}</p>}
        <p className="footer-links">
          <a href="https://www.distractionfreeschoolsca.org" target="_blank" rel="noopener noreferrer">
            Distraction Free Schools California
          </a>
          {' · '}
          <a href="https://survey.distractionfreeschoolsca.org" target="_blank" rel="noopener noreferrer">
            Take the Survey
          </a>
        </p>
      </div>
    </footer>
  );
}
