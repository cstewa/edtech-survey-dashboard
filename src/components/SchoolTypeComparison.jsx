function pct(n, d) { return d > 0 ? Math.round(n / d * 100) : 0; }

function pctColor(percentage) {
  const hue = Math.round(120 - (percentage / 100) * 120);
  const accentL = Math.round(46 - (percentage / 100) * 8);
  return `hsl(${hue}, 58%, ${accentL}%)`;
}

const displayNames = {
  'Private/Independent school': 'Private school',
};

export default function SchoolTypeComparison({ bySchoolType }) {
  const types = Object.entries(bySchoolType)
    .filter(([, d]) => d.totalResponses >= 10)
    .sort(([, a], [, b]) => b.totalResponses - a.totalResponses);

  if (types.length < 2) return null;

  return (
    <div className="school-type-grid">
      {types.map(([type, d]) => {
        const commsTotal = Object.values(d.commsRating).reduce((a, b) => a + b, 0);
        const commsPoor = (d.commsRating['Very poorly'] || 0) + (d.commsRating['Poorly'] || 0);
        const concernsTotal = (d.concernsTopLine.Yes || 0) + (d.concernsTopLine.No || 0);

        return (
          <div key={type} className="school-type-card">
            <div className="school-type-header">
              <h3 className="school-type-name">{displayNames[type] || type}</h3>
              <span className="school-type-n">n = {d.totalResponses}</span>
            </div>
            <div className="school-type-stats">
              {[
                { value: pct(d.anyTooMuch, d.totalResponses), label: 'say too much screen time' },
                { value: pct(d.concernsTopLine.Yes, concernsTotal), label: 'report concerns about device use' },
                { value: pct(commsPoor, commsTotal), label: 'rate school communication as poor' },
              ].map(({ value, label }) => (
                <div key={label} className="st-stat">
                  <span className="st-pct" style={{ color: pctColor(value) }}>{value}%</span>
                  <span className="st-label">{label}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
