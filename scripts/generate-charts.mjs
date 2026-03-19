/**
 * Generates SVG chart files for the PA Unplugged Initial Findings report.
 * Output: reports/charts/
 */

import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT = join(ROOT, 'reports/charts');
mkdirSync(OUT, { recursive: true });

const d = JSON.parse(readFileSync(join(ROOT, 'public/data/dashboard.json'), 'utf-8'));
const total = d.totalResponses;

// ─── Font ─────────────────────────────────────────────────────────────────────

const FONT_PATH = `${process.env.HOME}/Downloads/Google_Sans_Flex/GoogleSansFlex-VariableFont_GRAD,ROND,opsz,slnt,wdth,wght.ttf`;
const fontB64 = existsSync(FONT_PATH)
  ? readFileSync(FONT_PATH).toString('base64')
  : null;

const FONT_FAMILY = fontB64 ? 'Google Sans Flex' : 'Arial, Helvetica, sans-serif';
const FONT_FACE = fontB64
  ? `<defs><style>@font-face { font-family: 'Google Sans Flex'; src: url('data:font/truetype;base64,${fontB64}'); }</style></defs>`
  : '';

// ─── Brand colors ─────────────────────────────────────────────────────────────
const BLUE       = '#1B4F8A';
const BLUE_MID   = '#3A6EA8';
const BLUE_LIGHT = '#A8C4E0';
const GREEN      = '#2E7D32';
const AMBER      = '#E65100';
const GRAY_TEXT  = '#333333';
const GRAY_LIGHT = '#F5F7FA';
const GRID_COLOR = '#DDDDDD';

// ─── SVG helpers ──────────────────────────────────────────────────────────────

function svgWrap(width, height, content, title) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" font-family="Arial, Helvetica, sans-serif">
  <title>${title}</title>
  ${FONT_FACE}
  <rect width="${width}" height="${height}" fill="white"/>
  ${content}
</svg>`;
}

function escXml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Wrap long label text into multiple tspan lines
function wrapLabel(text, maxChars = 42) {
  const words = text.split(' ');
  const lines = [];
  let current = '';
  for (const word of words) {
    if ((current + ' ' + word).trim().length > maxChars && current) {
      lines.push(current.trim());
      current = word;
    } else {
      current = (current + ' ' + word).trim();
    }
  }
  if (current) lines.push(current.trim());
  return lines;
}

// ─── Horizontal bar chart ─────────────────────────────────────────────────────
// items: [{ label, pct, color? }]

function horizontalBarChart({ title, items, labelWidth = 340, barMaxWidth = 280, note = null, highlightFirst = false }) {
  const BAR_H = 30;
  const BAR_GAP = 14;
  const TOP_PAD = 56;
  const BOTTOM_PAD = note ? 52 : 32;
  const LEFT_PAD = 20;
  const RIGHT_PAD = 60;
  const svgWidth = LEFT_PAD + labelWidth + barMaxWidth + RIGHT_PAD;

  const rows = items.map(item => {
    const lines = wrapLabel(item.label);
    return { ...item, lines };
  });

  const rowHeights = rows.map(r => Math.max(BAR_H, r.lines.length * 16 + 4));
  const totalHeight = TOP_PAD + rowHeights.reduce((a, b) => a + b + BAR_GAP, 0) - BAR_GAP + BOTTOM_PAD;

  let content = '';

  // Title
  content += `<text x="${(svgWidth / 2).toFixed(1)}" y="32" font-size="15" font-weight="bold" fill="${GRAY_TEXT}" font-family="${FONT_FAMILY}" text-anchor="middle">${escXml(title)}</text>`;

  // Gridlines at 25%, 50%, 75%, 100%
  const barLeft = LEFT_PAD + labelWidth + 8;
  [25, 50, 75, 100].forEach(pct => {
    const x = barLeft + (pct / 100) * barMaxWidth;
    const lineTop = TOP_PAD - 8;
    const lineBottom = TOP_PAD + rowHeights.reduce((a, b) => a + b + BAR_GAP, 0) - BAR_GAP;
    content += `<line x1="${x}" y1="${lineTop}" x2="${x}" y2="${lineBottom}" stroke="${GRID_COLOR}" stroke-width="1"/>`;
    content += `<text x="${x}" y="${lineTop - 2}" font-size="10" fill="#AAAAAA" text-anchor="middle">${pct}%</text>`;
  });

  let y = TOP_PAD;
  rows.forEach((row, i) => {
    const rh = rowHeights[i];
    const barY = y + (rh - BAR_H) / 2;
    const barW = Math.max(2, (row.pct / 100) * barMaxWidth);
    const color = row.color || (highlightFirst && i === 0 ? BLUE : BLUE_MID);

    // Label lines
    const lineCount = row.lines.length;
    const lineH = 15;
    const textBlockH = lineCount * lineH;
    const textStartY = y + (rh - textBlockH) / 2 + lineH - 2;
    row.lines.forEach((line, li) => {
      const fontW = (highlightFirst && i === 0) ? 'bold' : 'normal';
      content += `<text x="${LEFT_PAD + labelWidth - 8}" y="${textStartY + li * lineH}" font-size="12" fill="${GRAY_TEXT}" text-anchor="end" font-weight="${fontW}">${escXml(line)}</text>`;
    });

    // Bar background
    content += `<rect x="${barLeft}" y="${barY}" width="${barMaxWidth}" height="${BAR_H}" fill="${GRAY_LIGHT}" rx="3"/>`;
    // Bar fill
    content += `<rect x="${barLeft}" y="${barY}" width="${barW}" height="${BAR_H}" fill="${color}" rx="3"/>`;
    // Pct label
    const pctX = barLeft + barW + 6;
    content += `<text x="${pctX}" y="${barY + BAR_H / 2 + 4}" font-size="12" fill="${GRAY_TEXT}" font-weight="bold">${row.pct}%</text>`;

    y += rh + BAR_GAP;
  });

  // Note
  if (note) {
    const noteY = TOP_PAD + rowHeights.reduce((a, b) => a + b + BAR_GAP, 0) - BAR_GAP + 20;
    content += `<text x="${LEFT_PAD}" y="${noteY}" font-size="10" fill="#888888" font-style="italic">${escXml(note)}</text>`;
  }

  return svgWrap(svgWidth, totalHeight, content, title);
}

// ─── Grouped bar chart (grade bands) ─────────────────────────────────────────

function gradeBandChart() {
  const bands = ['K–2', '3–5', '6–8', '9–12'];
  const bandData = {
    'K–2':  d.byGradeBand['K-2'],
    '3–5':  d.byGradeBand['3-5'],
    '6–8':  d.byGradeBand['6-8'],
    '9–12': d.byGradeBand['9-12'],
  };

  const categories = [
    { key: 'Too much',    color: AMBER },
    { key: 'Just right',  color: GREEN },
    { key: "I don't know", color: BLUE_LIGHT },
  ];

  const WIDTH = 660;
  const HEIGHT = 320;
  const TOP_PAD = 56;
  const BOTTOM_PAD = 72;
  const LEFT_PAD = 56;
  const RIGHT_PAD = 20;
  const chartW = WIDTH - LEFT_PAD - RIGHT_PAD;
  const chartH = HEIGHT - TOP_PAD - BOTTOM_PAD;

  const nBands = bands.length;
  const groupW = chartW / nBands;
  const barW = groupW * 0.2;
  const barGap = groupW * 0.04;

  let content = '';

  // Title
  content += `<text x="${(WIDTH / 2).toFixed(1)}" y="32" font-size="15" font-weight="bold" fill="${GRAY_TEXT}" font-family="${FONT_FAMILY}" text-anchor="middle">Screen Time Sentiment by Grade Band</text>`;

  // Y-axis gridlines at 0, 25, 50, 75, 100
  [0, 25, 50, 75, 100].forEach(pct => {
    const y = TOP_PAD + chartH - (pct / 100) * chartH;
    content += `<line x1="${LEFT_PAD}" y1="${y}" x2="${LEFT_PAD + chartW}" y2="${y}" stroke="${GRID_COLOR}" stroke-width="1"/>`;
    content += `<text x="${LEFT_PAD - 6}" y="${y + 4}" font-size="10" fill="#AAAAAA" text-anchor="end">${pct}%</text>`;
  });

  // Bars
  bands.forEach((band, bi) => {
    const bandTotal = Object.values(bandData[band]).reduce((a, b) => a + b, 0);
    const groupX = LEFT_PAD + bi * groupW;
    const groupCenter = groupX + groupW / 2;

    categories.forEach((cat, ci) => {
      const pct = Math.round((bandData[band][cat.key] || 0) / bandTotal * 100);
      const barH = (pct / 100) * chartH;
      const barX = groupCenter + (ci - 1) * (barW + barGap) - barW / 2;
      const barY = TOP_PAD + chartH - barH;
      content += `<rect x="${barX}" y="${barY}" width="${barW}" height="${barH}" fill="${cat.color}" rx="2"/>`;
      if (pct >= 8) {
        content += `<text x="${barX + barW / 2}" y="${barY - 4}" font-size="10" fill="${GRAY_TEXT}" text-anchor="middle" font-weight="bold">${pct}%</text>`;
      }
    });

    // Band label
    content += `<text x="${groupCenter}" y="${TOP_PAD + chartH + 18}" font-size="13" font-weight="bold" fill="${GRAY_TEXT}" text-anchor="middle">${band}</text>`;
  });

  // Legend
  const legendY = HEIGHT - 22;
  const legendItems = categories;
  const legendTotalW = legendItems.length * 110;
  const legendStartX = LEFT_PAD + (chartW - legendTotalW) / 2;
  legendItems.forEach((cat, i) => {
    const lx = legendStartX + i * 110;
    content += `<rect x="${lx}" y="${legendY - 10}" width="14" height="14" fill="${cat.color}" rx="2"/>`;
    content += `<text x="${lx + 18}" y="${legendY}" font-size="11" fill="${GRAY_TEXT}">${escXml(cat.key)}</text>`;
  });

  return svgWrap(WIDTH, HEIGHT, content, 'Screen Time Sentiment by Grade Band');
}

// ─── Communication ratings stacked bar ────────────────────────────────────────

function communicationChart() {
  const commsRaw = d.commsRating;
  const commsTotal = Object.values(commsRaw).reduce((a, b) => a + b, 0);
  const cats = [
    { key: 'Very poorly', color: '#B71C1C' },
    { key: 'Poorly',      color: '#EF5350' },
    { key: 'Neutral',     color: '#BDBDBD' },
    { key: 'Well',        color: '#66BB6A' },
    { key: 'Very well',   color: '#2E7D32' },
  ];

  const WIDTH = 660;
  const HEIGHT = 140;
  const LEFT_PAD = 20;
  const RIGHT_PAD = 20;
  const TOP_PAD = 48;
  const BAR_H = 44;
  const chartW = WIDTH - LEFT_PAD - RIGHT_PAD;

  let content = '';
  content += `<text x="${(WIDTH / 2).toFixed(1)}" y="28" font-size="15" font-weight="bold" fill="${GRAY_TEXT}" font-family="${FONT_FAMILY}" text-anchor="middle">How Well Schools Communicated About Screen Time &amp; Tech Use</text>`;

  // Stacked bar
  let cx = LEFT_PAD;
  cats.forEach(cat => {
    const pct = Math.round((commsRaw[cat.key] || 0) / commsTotal * 100);
    const w = Math.round((pct / 100) * chartW);
    content += `<rect x="${cx}" y="${TOP_PAD}" width="${w}" height="${BAR_H}" fill="${cat.color}"/>`;
    if (pct >= 8) {
      content += `<text x="${cx + w / 2}" y="${TOP_PAD + BAR_H / 2 + 5}" font-size="12" fill="white" text-anchor="middle" font-weight="bold">${pct}%</text>`;
    }
    cx += w;
  });

  // Legend below bar
  const legendY = TOP_PAD + BAR_H + 18;
  const itemW = chartW / cats.length;
  cats.forEach((cat, i) => {
    const lx = LEFT_PAD + i * itemW;
    content += `<rect x="${lx}" y="${legendY - 10}" width="12" height="12" fill="${cat.color}" rx="2"/>`;
    content += `<text x="${lx + 16}" y="${legendY}" font-size="10" fill="${GRAY_TEXT}">${escXml(cat.key)}</text>`;
  });

  return svgWrap(WIDTH, HEIGHT + 10, content, 'School Communication Ratings');
}

// ─── Generate all charts ──────────────────────────────────────────────────────

// 1. Screen time sentiment overall — all grade-band responses
const sentTotal = Object.values(d.screenTimeSentiment).reduce((a, b) => a + b, 0);
const sentimentItems = [
  { label: 'Too much',      pct: Math.round(d.screenTimeSentiment['Too much'] / sentTotal * 100),      color: AMBER },
  { label: 'Just right',    pct: Math.round(d.screenTimeSentiment['Just right'] / sentTotal * 100),    color: GREEN },
  { label: "I don't know",  pct: Math.round(d.screenTimeSentiment["I don't know"] / sentTotal * 100),  color: BLUE_LIGHT },
  { label: 'No opinion',    pct: Math.round(d.screenTimeSentiment['No opinion'] / sentTotal * 100),    color: '#BDBDBD' },
  { label: 'Not enough',    pct: Math.round(d.screenTimeSentiment['Not enough'] / sentTotal * 100),    color: '#90CAF9' },
];
writeFileSync(join(OUT, 'chart-screen-time-overall.svg'),
  horizontalBarChart({
    title: 'Screen Time on School-Issued Devices (All Grade Bands)',
    items: sentimentItems,
    labelWidth: 160,
    barMaxWidth: 380,
    highlightFirst: true,
    note: `Based on ${sentTotal.toLocaleString()} grade-band responses from ${total.toLocaleString()} respondents. Each parent answered separately for K\u20132, 3\u20135, 6\u20138, and 9\u201312 as applicable. Note: 78% of respondents said \u201ctoo much\u201d in at least one grade band; this chart reflects sentiment across all individual grade-band responses.`,
  })
);

// 2. Concerns
const concernItems = Object.entries(d.concernsBreakdown).map(([label, count]) => ({
  label, pct: Math.round(count / total * 100),
}));
writeFileSync(join(OUT, 'chart-concerns.svg'),
  horizontalBarChart({
    title: 'Parent Concerns About School-Issued Device Use',
    items: concernItems,
    labelWidth: 370,
    barMaxWidth: 220,
    highlightFirst: true,
    note: `% of all ${total.toLocaleString()} respondents. Respondents could select multiple concerns.`,
  })
);

// 3. Communication
writeFileSync(join(OUT, 'chart-communication.svg'), communicationChart());

// 4. Policies
const policyItems = Object.entries(d.policies).map(([label, count]) => ({
  label, pct: Math.round(count / total * 100),
}));
writeFileSync(join(OUT, 'chart-policies.svg'),
  horizontalBarChart({
    title: 'Policy Changes Parents Would Support',
    items: policyItems,
    labelWidth: 370,
    barMaxWidth: 220,
    highlightFirst: true,
    note: `% of all ${total.toLocaleString()} respondents. Respondents could select multiple options.`,
  })
);

// 5. Grade bands
writeFileSync(join(OUT, 'chart-grade-bands.svg'), gradeBandChart());

// ─── PA County bubble map ─────────────────────────────────────────────────────

const PA_COUNTIES = [
  { name: 'Adams', lng: -77.22, lat: 39.87 }, { name: 'Allegheny', lng: -80.01, lat: 40.47 },
  { name: 'Armstrong', lng: -79.47, lat: 40.81 }, { name: 'Beaver', lng: -80.35, lat: 40.69 },
  { name: 'Bedford', lng: -78.49, lat: 40.01 }, { name: 'Berks', lng: -75.92, lat: 40.42 },
  { name: 'Blair', lng: -78.35, lat: 40.48 }, { name: 'Bradford', lng: -76.53, lat: 41.79 },
  { name: 'Bucks', lng: -75.07, lat: 40.34 }, { name: 'Butler', lng: -79.90, lat: 40.93 },
  { name: 'Cambria', lng: -78.72, lat: 40.50 }, { name: 'Cameron', lng: -78.18, lat: 41.42 },
  { name: 'Carbon', lng: -75.71, lat: 40.92 }, { name: 'Centre', lng: -77.78, lat: 40.92 },
  { name: 'Chester', lng: -75.74, lat: 39.98 }, { name: 'Clarion', lng: -79.44, lat: 41.20 },
  { name: 'Clearfield', lng: -78.48, lat: 41.00 }, { name: 'Clinton', lng: -77.52, lat: 41.22 },
  { name: 'Columbia', lng: -76.43, lat: 41.05 }, { name: 'Crawford', lng: -80.10, lat: 41.68 },
  { name: 'Cumberland', lng: -77.26, lat: 40.17 }, { name: 'Dauphin', lng: -76.79, lat: 40.37 },
  { name: 'Delaware', lng: -75.38, lat: 39.92 }, { name: 'Elk', lng: -78.65, lat: 41.43 },
  { name: 'Erie', lng: -80.08, lat: 42.12 }, { name: 'Fayette', lng: -79.63, lat: 39.92 },
  { name: 'Forest', lng: -79.25, lat: 41.51 }, { name: 'Franklin', lng: -77.74, lat: 40.00 },
  { name: 'Fulton', lng: -78.11, lat: 39.93 }, { name: 'Greene', lng: -80.22, lat: 39.86 },
  { name: 'Huntingdon', lng: -77.98, lat: 40.48 }, { name: 'Indiana', lng: -79.10, lat: 40.62 },
  { name: 'Jefferson', lng: -78.99, lat: 41.13 }, { name: 'Juniata', lng: -77.41, lat: 40.53 },
  { name: 'Lackawanna', lng: -75.60, lat: 41.44 }, { name: 'Lancaster', lng: -76.31, lat: 40.05 },
  { name: 'Lawrence', lng: -80.34, lat: 40.99 }, { name: 'Lebanon', lng: -76.48, lat: 40.38 },
  { name: 'Lehigh', lng: -75.50, lat: 40.61 }, { name: 'Luzerne', lng: -75.90, lat: 41.17 },
  { name: 'Lycoming', lng: -77.10, lat: 41.34 }, { name: 'McKean', lng: -78.55, lat: 41.80 },
  { name: 'Mercer', lng: -80.24, lat: 41.30 }, { name: 'Mifflin', lng: -77.62, lat: 40.61 },
  { name: 'Monroe', lng: -75.34, lat: 41.06 }, { name: 'Montgomery', lng: -75.37, lat: 40.22 },
  { name: 'Montour', lng: -76.64, lat: 41.01 }, { name: 'Northampton', lng: -75.31, lat: 40.75 },
  { name: 'Northumberland', lng: -76.72, lat: 40.87 }, { name: 'Perry', lng: -77.26, lat: 40.40 },
  { name: 'Philadelphia', lng: -75.13, lat: 40.00 }, { name: 'Pike', lng: -74.99, lat: 41.33 },
  { name: 'Potter', lng: -77.89, lat: 41.74 }, { name: 'Schuylkill', lng: -76.19, lat: 40.70 },
  { name: 'Snyder', lng: -77.06, lat: 40.77 }, { name: 'Somerset', lng: -79.04, lat: 40.00 },
  { name: 'Sullivan', lng: -76.50, lat: 41.44 }, { name: 'Susquehanna', lng: -75.80, lat: 41.85 },
  { name: 'Tioga', lng: -77.10, lat: 41.77 }, { name: 'Union', lng: -77.07, lat: 40.97 },
  { name: 'Venango', lng: -79.69, lat: 41.40 }, { name: 'Warren', lng: -79.23, lat: 41.84 },
  { name: 'Washington', lng: -80.24, lat: 40.21 }, { name: 'Wayne', lng: -75.24, lat: 41.66 },
  { name: 'Westmoreland', lng: -79.43, lat: 40.31 }, { name: 'Wyoming', lng: -75.87, lat: 41.55 },
  { name: 'York', lng: -76.73, lat: 40.01 },
];

const PA_BOUNDS = { minLng: -80.52, maxLng: -74.69, minLat: 39.72, maxLat: 42.27 };

function project(lng, lat, w, h) {
  return {
    x: ((lng - PA_BOUNDS.minLng) / (PA_BOUNDS.maxLng - PA_BOUNDS.minLng)) * w,
    y: ((PA_BOUNDS.maxLat - lat) / (PA_BOUNDS.maxLat - PA_BOUNDS.minLat)) * h,
  };
}

function bubbleMap() {
  const MAP_W = 620;
  const MAP_H = 300;
  const TOP_PAD = 44;
  const BOTTOM_PAD = 52;
  const SVG_W = MAP_W;
  const SVG_H = MAP_H + TOP_PAD + BOTTOM_PAD;

  const byCounty = d.byCounty;
  const maxCount = Math.max(...Object.values(byCounty));

  // Bubble radius: scale sqrt of count, max radius 32
  function radius(count) {
    return Math.max(4, Math.sqrt(count / maxCount) * 32);
  }

  // Counties to label (those with enough responses to be notable)
  const LABEL_THRESHOLD = 9;

  let content = '';
  content += `<text x="${(MAP_W / 2).toFixed(1)}" y="28" font-size="15" font-weight="bold" fill="${GRAY_TEXT}" font-family="${FONT_FAMILY}" text-anchor="middle">Survey Responses by County</text>`;

  // Background rect for map area
  content += `<rect x="0" y="${TOP_PAD}" width="${MAP_W}" height="${MAP_H}" fill="#F0F4F8" rx="6"/>`;

  // All counties — gray dot first (so bubbles render on top)
  PA_COUNTIES.forEach(county => {
    if (byCounty[county.name]) return; // skip — will draw as bubble
    const { x, y } = project(county.lng, county.lat, MAP_W, MAP_H);
    content += `<circle cx="${x.toFixed(1)}" cy="${(y + TOP_PAD).toFixed(1)}" r="3" fill="#C8D6E8" opacity="0.7"/>`;
  });

  // Counties with responses — colored bubbles
  PA_COUNTIES.forEach(county => {
    const count = byCounty[county.name];
    if (!count) return;
    const { x, y } = project(county.lng, county.lat, MAP_W, MAP_H);
    const r = radius(count);
    const cx = x.toFixed(1);
    const cy = (y + TOP_PAD).toFixed(1);
    content += `<circle cx="${cx}" cy="${cy}" r="${r.toFixed(1)}" fill="${BLUE}" opacity="0.75"/>`;
    // Label counties above threshold
    if (count >= LABEL_THRESHOLD) {
      const labelY = (parseFloat(cy) - r - 4).toFixed(1);
      content += `<text x="${cx}" y="${labelY}" font-size="9" fill="${GRAY_TEXT}" text-anchor="middle" font-weight="bold">${escXml(county.name)}</text>`;
    }
  });

  // Legend
  const legendY = TOP_PAD + MAP_H + 16;
  const legendSizes = [
    { count: maxCount, label: `${maxCount} responses` },
    { count: Math.round(maxCount * 0.25), label: `~${Math.round(maxCount * 0.25)}` },
    { count: 1, label: '1' },
  ];
  let lx = 16;
  content += `<text x="${lx}" y="${legendY + 4}" font-size="10" fill="${GRAY_TEXT}">Bubble size:</text>`;
  lx += 80;
  legendSizes.forEach(({ count, label }) => {
    const r = radius(count);
    const cy = legendY + 4 - r + r; // center on baseline
    content += `<circle cx="${(lx + r).toFixed(1)}" cy="${legendY}" r="${r.toFixed(1)}" fill="${BLUE}" opacity="0.75"/>`;
    content += `<text x="${(lx + r * 2 + 4).toFixed(1)}" y="${legendY + 4}" font-size="10" fill="${GRAY_TEXT}">${label}</text>`;
    lx += r * 2 + 52;
  });
  content += `<text x="${lx + 20}" y="${legendY + 4}" font-size="10" fill="#AAAAAA">\u25CF No responses</text>`;

  const noteY = legendY + 18;
  content += `<text x="16" y="${noteY}" font-size="9" fill="#AAAAAA" font-style="italic">Gray dots indicate counties with no survey responses in this sample.</text>`;

  return svgWrap(SVG_W, SVG_H, content, 'Survey Responses by County — PA Bubble Map');
}

writeFileSync(join(OUT, 'chart-map-bubbles.svg'), bubbleMap());

// ─── County response table ────────────────────────────────────────────────────

function countyTable() {
  const entries = Object.entries(d.byCounty).sort(([, a], [, b]) => b - a);
  const COL = 3;
  const ROWS = Math.ceil(entries.length / COL);
  const COL_W = 180;
  const ROW_H = 22;
  const TOP_PAD = 44;
  const H_PAD = 16;
  const SVG_W = H_PAD * 2 + COL_W * COL;
  const SVG_H = TOP_PAD + ROWS * ROW_H + 24;

  let content = '';
  content += `<text x="${(SVG_W / 2).toFixed(1)}" y="28" font-size="15" font-weight="bold" fill="${GRAY_TEXT}" font-family="${FONT_FAMILY}" text-anchor="middle">Responses by County</text>`;

  entries.forEach(([county, count], i) => {
    const col = Math.floor(i / ROWS);
    const row = i % ROWS;
    const x = H_PAD + col * COL_W;
    const y = TOP_PAD + row * ROW_H;
    const pct = Math.round(count / total * 100);

    // Alternating row background
    if (row % 2 === 0) {
      content += `<rect x="${x}" y="${y}" width="${COL_W}" height="${ROW_H}" fill="${GRAY_LIGHT}"/>`;
    }
    // Bar fill proportional to count
    const barW = Math.round((count / entries[0][1]) * (COL_W * 0.3));
    content += `<rect x="${x + COL_W * 0.55}" y="${y + 6}" width="${barW}" height="${ROW_H - 12}" fill="${BLUE_LIGHT}" rx="2"/>`;

    content += `<text x="${x + 6}" y="${y + ROW_H - 7}" font-size="11" fill="${GRAY_TEXT}">${escXml(county)}</text>`;
    content += `<text x="${x + COL_W * 0.54 - 4}" y="${y + ROW_H - 7}" font-size="11" fill="${GRAY_TEXT}" text-anchor="end" font-weight="bold">${count}</text>`;
  });

  return svgWrap(SVG_W, SVG_H, content, 'Survey Responses by County — Table');
}

writeFileSync(join(OUT, 'chart-county-table.svg'), countyTable());

// ─── Convert all SVGs to PNG ──────────────────────────────────────────────────

import { Resvg } from '@resvg/resvg-js';
import { readdirSync, unlinkSync } from 'fs';

const svgFiles = readdirSync(OUT).filter(f => f.endsWith('.svg'));
for (const file of svgFiles) {
  const svgPath = join(OUT, file);
  const pngPath = join(OUT, file.replace('.svg', '.png'));
  const svg = readFileSync(svgPath, 'utf-8');
  const resvg = new Resvg(svg, { fitTo: { mode: 'zoom', value: 2 } });
  const pngData = resvg.render();
  writeFileSync(pngPath, pngData.asPng());
  unlinkSync(svgPath); // remove SVG, keep only PNG
}

console.log('Charts written to reports/charts/ (PNG @ 2x)');
console.log(` chart-screen-time-overall.png`);
console.log(` chart-concerns.png`);
console.log(` chart-communication.png`);
console.log(` chart-policies.png`);
console.log(` chart-grade-bands.png`);
console.log(` chart-map-bubbles.png`);
console.log(` chart-county-table.png`);
