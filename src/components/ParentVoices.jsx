export default function ParentVoices({ quotes, scoped }) {
  if (!quotes || quotes.length === 0) return null;

  return (
    <div className="quotes-grid">
      {quotes.map((q, i) => (
        <blockquote key={i} className="quote-card">
          <p className="quote-text">{'\u201c'}{q.text}{'\u201d'}</p>
          {q.county && !scoped && <footer className="quote-attr">{q.county} County</footer>}
        </blockquote>
      ))}
    </div>
  );
}
