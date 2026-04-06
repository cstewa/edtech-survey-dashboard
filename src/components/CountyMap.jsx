import { useState } from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';

const GEO_URL = '/data/ca-counties.json';

function getColor(count, maxCount) {
  if (!count || count === 0) return '#e8f5e9';
  const t = Math.min(count / maxCount, 1);
  const r = Math.round(200 - t * 173);
  const g = Math.round(230 - t * 136);
  const b = Math.round(201 - t * 169);
  return `rgb(${r},${g},${b})`;
}

export default function CountyMap({ byCounty }) {
  const [tooltip, setTooltip] = useState(null);
  const maxCount = Math.max(1, ...Object.values(byCounty));

  return (
    <div className="county-map-wrap">
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ scale: 2500, center: [-119.27, 37.27] }}
        width={800}
        height={860}
        style={{ width: '100%', height: 'auto', maxHeight: '600px' }}
      >
        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies.map(geo => {
              const county = geo.properties.name;
              const count = byCounty[county] || 0;
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={getColor(count, maxCount)}
                  stroke="#fff"
                  strokeWidth={0.6}
                  style={{
                    default: { outline: 'none' },
                    hover: { outline: 'none', opacity: 0.85, cursor: count > 0 ? 'pointer' : 'default' },
                    pressed: { outline: 'none' },
                  }}
                  onMouseEnter={e => setTooltip({ county, count, x: e.clientX, y: e.clientY })}
                  onMouseMove={e => setTooltip(t => t ? { ...t, x: e.clientX, y: e.clientY } : t)}
                  onMouseLeave={() => setTooltip(null)}
                />
              );
            })
          }
        </Geographies>
      </ComposableMap>

      {tooltip && (
        <div className="map-tooltip" style={{ left: tooltip.x + 12, top: tooltip.y - 44 }}>
          <strong>{tooltip.county} County</strong><br />
          {tooltip.count} {tooltip.count === 1 ? 'response' : 'responses'}
        </div>
      )}

    </div>
  );
}
