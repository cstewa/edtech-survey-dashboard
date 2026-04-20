import { useState } from 'react';
import SentimentBar from './SentimentBar.jsx';

const BANDS = ['TK-2', '3-5', '6-8', '9-12'];
const BAND_LABELS = {
  'TK-2': 'Grades TK–2',
  '3-5': 'Grades 3–5',
  '6-8': 'Grades 6–8',
  '9-12': 'Grades 9–12',
};

function tooMuchPct(sentiment) {
  const total = Object.values(sentiment).reduce((a, b) => a + b, 0);
  return total ? Math.round((sentiment['Too much'] || 0) / total * 100) : 0;
}

export default function GradeBandSentiment({ byGradeBand, screenTimeSentiment }) {
  const [selectedBand, setSelectedBand] = useState(null);

  const activeSentiment = selectedBand ? byGradeBand[selectedBand] : screenTimeSentiment;
  const maxPct = Math.max(1, ...BANDS.map(b => tooMuchPct(byGradeBand[b])));

  return (
    <div className="grade-band-wrap">
      <div className="band-tabs">
        <button
          className={`band-tab${!selectedBand ? ' band-tab--active' : ''}`}
          onClick={() => setSelectedBand(null)}
        >
          All grades
        </button>
        {BANDS.map(band => (
          <button
            key={band}
            className={`band-tab${selectedBand === band ? ' band-tab--active' : ''}`}
            onClick={() => setSelectedBand(selectedBand === band ? null : band)}
          >
            {band}
          </button>
        ))}
      </div>

      {!selectedBand && (
        <div className="band-comparison">
          <p className="band-comparison-hint">Select a grade band to see full breakdown</p>
          {BANDS.map(band => {
            const pct = tooMuchPct(byGradeBand[band]);
            const total = Object.values(byGradeBand[band]).reduce((a, b) => a + b, 0);
            return (
              <div
                key={band}
                className="hbar-row band-comparison-row"
                onClick={() => setSelectedBand(band)}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && setSelectedBand(band)}
              >
                <div className="hbar-label">{BAND_LABELS[band]}</div>
                <div className="hbar-track">
                  <div
                    className="hbar-fill hbar-fill--concern"
                    style={{ width: `${(pct / maxPct) * 100}%` }}
                  />
                </div>
                <div className="hbar-stat">
                  <span className="hbar-count">{pct}%</span>
                  <span className="hbar-pct">too much ({total} resp.)</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedBand && (
        <p className="band-selected-note">
          Showing full sentiment for <strong>{BAND_LABELS[selectedBand]}</strong>
        </p>
      )}

      <SentimentBar screenTimeSentiment={activeSentiment} />
    </div>
  );
}
