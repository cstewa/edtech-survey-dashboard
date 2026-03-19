/**
 * Generates the PA Unplugged EdTech Survey Initial Findings report as a .docx file.
 * Output: reports/PA-Unplugged-Initial-Findings.docx
 */

import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  BorderStyle, ShadingType, convertInchesToTwip, PageOrientation,
  ThematicBreak, PageBreak,
} from 'docx';
import { writeFileSync, mkdirSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// ─── Data ────────────────────────────────────────────────────────────────────

const d = JSON.parse(readFileSync(join(ROOT, 'public/data/dashboard.json'), 'utf-8'));

const total = d.totalResponses;
const tooMuchPct = Math.round(d.anyTooMuch / total * 100);
const concernYes = d.concernsTopLine.Yes;
const concernNo = d.concernsTopLine.No;
const concernPct = Math.round(concernYes / (concernYes + concernNo) * 100);
const commsPoor = (d.commsRating['Very poorly'] || 0) + (d.commsRating['Poorly'] || 0);
const commsTotal = Object.values(d.commsRating).reduce((a, b) => a + b, 0);
const commsPct = Math.round(commsPoor / commsTotal * 100);
const sentTotal = Object.values(d.screenTimeSentiment).reduce((a, b) => a + b, 0);
const dontKnow = d.screenTimeSentiment["I don't know"];
const dontKnowPct = Math.round(dontKnow / sentTotal * 100);
const commsWell = (d.commsRating['Well'] || 0) + (d.commsRating['Very well'] || 0);
const commsWellPct = Math.round(commsWell / commsTotal * 100);

const concerns = Object.entries(d.concernsBreakdown).map(([label, count]) => ({
  label, pct: Math.round(count / total * 100),
}));

const policies = Object.entries(d.policies).map(([label, count]) => ({
  label, pct: Math.round(count / total * 100),
}));

const featuredQuotes = d.featuredQuotes;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const GRAY = '595959';
const ACCENT = '1B4F8A';
const PLACEHOLDER_BG = 'EFF3FB';
const PLACEHOLDER_BORDER = '5B8DD9';
const QUOTE_BORDER = '2E7D32';

function sp(before = 0, after = 160) {
  return { before, after };
}

function h1(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 36, color: ACCENT })],
    spacing: sp(480, 120),
  });
}

function h2(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 28, color: ACCENT })],
    spacing: sp(360, 120),
  });
}

function h3(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 24 })],
    spacing: sp(240, 80),
  });
}

function body(runs, spacingAfter = 160) {
  const children = typeof runs === 'string'
    ? [new TextRun({ text: runs, size: 22 })]
    : runs;
  return new Paragraph({ children, spacing: sp(0, spacingAfter) });
}

function bold(text, size = 22) {
  return new TextRun({ text, bold: true, size });
}

function run(text, size = 22) {
  return new TextRun({ text, size });
}

function bullet(text, level = 0) {
  return new Paragraph({
    children: [new TextRun({ text, size: 22 })],
    bullet: { level },
    spacing: sp(0, 80),
  });
}

function statLine(pct, label) {
  return new Paragraph({
    children: [
      new TextRun({ text: `${pct}%`, bold: true, size: 32, color: ACCENT }),
      new TextRun({ text: `  ${label}`, size: 22 }),
    ],
    spacing: sp(80, 80),
  });
}

function chartPlaceholder(chartType, description) {
  return new Paragraph({
    children: [
      new TextRun({ text: '[VISUALIZATION] ', bold: true, size: 20, color: PLACEHOLDER_BORDER }),
      new TextRun({ text: `${chartType}`, bold: true, size: 20, color: '1A237E' }),
      new TextRun({ text: `\n${description}`, size: 20, color: GRAY }),
      new TextRun({ text: '\nReplace this placeholder with the finished chart image.', size: 18, color: GRAY, italics: true }),
    ],
    shading: { type: ShadingType.CLEAR, fill: PLACEHOLDER_BG },
    border: {
      top: { style: BorderStyle.SINGLE, size: 4, color: PLACEHOLDER_BORDER },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: PLACEHOLDER_BORDER },
      left: { style: BorderStyle.THICK, size: 12, color: PLACEHOLDER_BORDER },
      right: { style: BorderStyle.SINGLE, size: 4, color: PLACEHOLDER_BORDER },
    },
    indent: { left: convertInchesToTwip(0.1) },
    spacing: sp(160, 240),
  });
}

function quoteBlock(text, attribution) {
  return [
    new Paragraph({
      children: [new TextRun({ text: `\u201c${text}\u201d`, italics: true, size: 22 })],
      border: {
        left: { style: BorderStyle.THICK, size: 16, color: QUOTE_BORDER, space: 12 },
      },
      indent: { left: convertInchesToTwip(0.4), right: convertInchesToTwip(0.4) },
      spacing: sp(200, 80),
    }),
    new Paragraph({
      children: [new TextRun({ text: `\u2014 ${attribution}`, bold: true, size: 20, color: GRAY })],
      indent: { left: convertInchesToTwip(0.4) },
      spacing: sp(0, 200),
    }),
  ];
}

function divider() {
  return new Paragraph({
    children: [new ThematicBreak()],
    spacing: sp(240, 240),
  });
}

function pageBreak() {
  return new Paragraph({
    children: [new PageBreak()],
  });
}

function empty(n = 1) {
  return Array.from({ length: n }, () => new Paragraph({ children: [new TextRun('')], spacing: sp(0, 80) }));
}

// ─── Document sections ───────────────────────────────────────────────────────

const titleSection = [
  ...empty(3),
  new Paragraph({
    children: [new TextRun({ text: 'Pennsylvania Parents Speak Out', bold: true, size: 56, color: ACCENT })],
    alignment: AlignmentType.CENTER,
    spacing: sp(0, 120),
  }),
  new Paragraph({
    children: [new TextRun({ text: 'Initial Findings from the PA Unplugged School EdTech Survey', size: 32, color: GRAY })],
    alignment: AlignmentType.CENTER,
    spacing: sp(0, 480),
  }),
  new Paragraph({
    children: [new TextRun({ text: 'PA Unplugged', bold: true, size: 24 })],
    alignment: AlignmentType.CENTER,
    spacing: sp(0, 80),
  }),
  new Paragraph({
    children: [new TextRun({ text: 'Alex Bird Becker, MPA, MSEd', size: 24 })],
    alignment: AlignmentType.CENTER,
    spacing: sp(0, 80),
  }),
  new Paragraph({
    children: [new TextRun({ text: 'March 2026', size: 22, color: GRAY })],
    alignment: AlignmentType.CENTER,
    spacing: sp(0, 80),
  }),
  new Paragraph({
    children: [new TextRun({ text: `Survey open since February 17, 2026  |  N = ${total.toLocaleString()} responses as of March 2026`, size: 20, color: GRAY, italics: true })],
    alignment: AlignmentType.CENTER,
    spacing: sp(0, 0),
  }),
  pageBreak(),
];

const executiveSummary = [
  h1('Executive Summary'),
  body('A statewide survey of Pennsylvania parents found widespread concern about how school-issued devices are used in classrooms. These are initial findings from an ongoing survey that opened February 17, 2026. Among the first 1,001 respondents across 37 Pennsylvania counties and 117 school districts:'),
  statLine(tooMuchPct, 'said there was too much screen time on school-issued devices in at least one grade band'),
  statLine(concernPct, 'reported concerns about how school-issued devices are used'),
  statLine(commsPct, 'said their child\u2019s school communicated poorly about screen time and technology use'),
  statLine(dontKnowPct, 'of screen time assessments were \u201cI don\u2019t know\u201d \u2014 parents who lacked basic visibility into their child\u2019s daily tech use at school'),
  ...empty(),
  body('These were not the concerns of a fringe minority. Across grade levels, school types, and regions of Pennsylvania, parents raised consistent, urgent questions about transparency, appropriateness, and oversight of educational technology.'),
  body([
    run('This survey is '),
    bold('still open'),
    run('. These initial findings were published one month after the survey launched, in the hope that sharing early results will encourage more Pennsylvania parents to participate. Future reports will reflect an expanded sample.'),
  ]),
  pageBreak(),
];

const aboutSection = [
  h1('About PA Unplugged & Why This Survey'),
  h2('About PA Unplugged'),
  body('PA Unplugged is a statewide parent-led organization working toward cultural change in how screens are approached with children in homes, schools, and communities.'),
  h2('Why This Survey'),
  body('Despite significant public investment in educational technology \u2014 and growing research on the risks of excessive screen exposure for children \u2014 parents have had little formal voice in shaping how these tools are used in schools. This survey was designed to change that: to put documented parent perspectives in front of policymakers, administrators, and the public.'),
  body('The survey asked Pennsylvania parents about:'),
  bullet('How much screen time they believed their child received on school-issued devices, and whether that amount was appropriate'),
  bullet('Whether they had specific concerns about device use, and what those concerns were'),
  bullet('How well their child\u2019s school communicated about technology use'),
  bullet('What policy changes they would support'),
  pageBreak(),
];

const methodologySection = [
  h1('Methodology'),
  h2('Survey Design'),
  body('The PA Unplugged School EdTech Survey was developed by Alex Bird Becker, MPA, MSEd, with graduate training in survey methodology. The instrument was designed to capture parent perspectives across multiple dimensions: screen time volume, specific concerns, school communication, and policy preferences. The survey includes both structured questions (multiple choice, rating scales) and an open-ended response field for parents to share additional concerns in their own words.'),
  h2('Distribution'),
  body('The survey was distributed through PA Unplugged\u2019s network of local leads, who shared it with parent communities in their regions \u2014 both families connected to PA Unplugged\u2019s work and parents with no prior affiliation. The survey was also shared in Pennsylvania parenting groups on Facebook and relevant subreddits. Distribution was designed to be as broad as organizational capacity allowed, but was not systematic or randomized.'),
  h2('Fielding Period'),
  body('The survey opened on February 17, 2026 and remains open. These initial findings reflect 1,001 responses collected during the first month of fielding.'),
  h2('Sample'),
  body(`Respondents represented 37 Pennsylvania counties and 117 school districts. Responses came from parents across urban, suburban, and rural communities. The sample included parents from public schools (90%), private and independent schools (8%), and charter schools (2%).`),
  chartPlaceholder(
    'County map',
    'Choropleth map of Pennsylvania counties shaded by number of survey responses. Source: dashboard Geographic Breakdown map.'
  ),
  h2('Limitations'),
  body('This is an opt-in, non-random sample distributed through an advocacy organization\u2019s network. Results are not statistically representative of Pennsylvania parents as a whole and cannot be generalized to the broader population.'),
  body('However, the volume of responses (N=1,001), geographic breadth (37 counties, 117 districts), and consistency of findings across different regions and school types suggest these results are directionally significant and warrant serious attention from policymakers, administrators, and researchers.'),
  body('The survey remains open. Future reporting will reflect an expanded and more geographically diverse sample.'),
  pageBreak(),
];

const findingsSection = [
  h1('Findings'),

  // --- Section 1 ---
  h2('1. Screen Time Concerns'),
  body([
    run('The most fundamental question the survey asked was whether parents believed their child received too much screen time on school-issued devices. '),
    bold(`${tooMuchPct}% of respondents \u2014 more than three in four parents \u2014 said yes in at least one grade band.`),
    run(' This was the most important single finding from this survey. It cut across grade levels, school types, and regions of the state.'),
  ]),
  body([
    run('The chart below shows sentiment broken down by category across all individual grade-band responses. Because parents answered separately for each grade band applicable to their children (K\u20132, 3\u20135, 6\u20138, 9\u201312), the per-band \u201ctoo much\u201d rate (72%) is lower than the per-respondent figure above \u2014 parents who said \u201cjust right\u201d in one band but \u201ctoo much\u201d in another are counted once in the 78% but contribute responses to both categories in the chart.'),
  ]),
  chartPlaceholder(
    'Horizontal bar chart',
    'Screen time sentiment across all grade-band responses: % selecting "Too much," "Just right," "Not enough," "No opinion," and "I don\u2019t know." Source: chart-screen-time-overall.png'
  ),

  // --- Section 2 ---
  h2('2. What Parents Are Concerned About'),
  body([
    bold(`${concernPct}% of respondents`),
    run(' reported concerns about how school-issued devices were used. Among those with concerns, the most commonly cited were:'),
  ]),
  chartPlaceholder(
    'Horizontal bar chart',
    'Concern categories sorted by frequency, showing % of all respondents who selected each concern. Source: dashboard Concerns section.'
  ),
  ...concerns.map(({ label, pct }) => bullet(`${pct}% \u2014 ${label}`)),
  ...empty(),
  body('The top concerns \u2014 replacing hands-on learning, attention and focus, social development \u2014 aligned closely with concerns that developmental researchers and pediatric health professionals have raised. Pennsylvania parents arrived at these conclusions through direct, daily observation of their children.'),

  // --- Section 3 ---
  h2('3. Parental Visibility: What Parents Don\u2019t Know'),
  body([
    bold(`${dontKnowPct}% of screen time assessments in this survey were \u201cI don\u2019t know.\u201d`),
    run(' These were parents who could not evaluate whether their child\u2019s screen time was appropriate \u2014 because they had no information about how much was occurring. This was not a minor finding; it reflected a fundamental transparency gap between schools and families.'),
  ]),
  body('Open-ended responses echoed this theme repeatedly:'),
  ...quoteBlock(
    'I genuinely have no idea how much time my daughter is in her iPad every day. The school doesn\u2019t communicate it well. We used to do screens on a regular basis at home but we have stopped because of how much ambiguity there is with her school usage.',
    'Parent, Cumberland County'
  ),

  // --- Section 4 ---
  h2('4. School Communication'),
  body([
    bold(`${commsPct}% of parents`),
    run(` said their child\u2019s school communicated \u201cpoorly\u201d or \u201cvery poorly\u201d about screen time and technology use. Only ${commsWellPct}% said communication was \u201cwell\u201d or \u201cvery well.\u201d`),
  ]),
  chartPlaceholder(
    'Bar chart or donut chart',
    'Distribution of school communication ratings: Very poorly / Poorly / Neutral / Well / Very well. Source: dashboard hero stat.'
  ),
  body('This finding connected directly to the parental visibility problem above. When schools did not communicate about technology use \u2014 what tools were being used, for how long, and for what purposes \u2014 parents could not make informed decisions at home or meaningfully advocate for their children.'),

  // --- Section 5 ---
  h2('5. Policy Preferences'),
  body('Parents were asked which policy changes they would support. The results were striking in both their breadth and consistency:'),
  chartPlaceholder(
    'Horizontal bar chart',
    'Policy preference options sorted by % support. Source: dashboard Policy Preferences section.'
  ),
  ...policies.map(({ label, pct }) => bullet(`${pct}% \u2014 ${label}`)),
  ...empty(),
  body([
    run('The top-ranked item \u2014 '),
    bold('prohibiting recreational screen use during the school day'),
    run(` \u2014 commanded support from ${policies[0]?.pct ?? 82}% of respondents. This reflected a clear, consistent signal: parents drew a sharp distinction between purposeful educational use of technology and recreational or passive use during school hours, and wanted schools to do the same.`),
  ]),
  pageBreak(),
];

const parentVoicesSection = [
  h1('Parent Voices'),
  body('Numbers tell part of the story. These are the words of Pennsylvania parents, in their own voices. Responses were drawn from across the state and represented a range of concerns, experiences, and school contexts.'),
  ...empty(),
  ...featuredQuotes.flatMap(q =>
    quoteBlock(q.text, `Parent, ${q.county} County`)
  ),
  pageBreak(),
];

const implicationsSection = [
  h1('Implications'),
  body('These findings present clear, actionable questions for those responsible for educational policy and school administration in Pennsylvania.'),

  h2('For Policymakers'),
  body('This survey should prompt serious attention to three questions:'),
  new Paragraph({
    children: [
      new TextRun({ text: 'Transparency:  ', bold: true, size: 22 }),
      new TextRun({ text: 'Do Pennsylvania parents have a meaningful right to know how school-issued devices are used during the school day \u2014 what applications are running, for how long, and for what purpose? What legislative or regulatory mechanisms could establish this right?', size: 22 }),
    ],
    bullet: { level: 0 },
    spacing: sp(0, 80),
  }),
  new Paragraph({
    children: [
      new TextRun({ text: 'Responsiveness:  ', bold: true, size: 22 }),
      new TextRun({ text: 'What mechanisms exist for parents to raise concerns about edtech use with their child\u2019s school or district, and are those mechanisms effective?', size: 22 }),
    ],
    bullet: { level: 0 },
    spacing: sp(0, 80),
  }),
  new Paragraph({
    children: [
      new TextRun({ text: 'Recreational use:  ', bold: true, size: 22 }),
      new TextRun({ text: 'Should Pennsylvania establish clearer guidelines \u2014 or explicit parental rights \u2014 around non-academic device use during the school day? 82% of respondents say they would support prohibiting recreational screen use during school hours.', size: 22 }),
    ],
    bullet: { level: 0 },
    spacing: sp(0, 80),
  }),

  h2('For School Administrators'),
  new Paragraph({
    children: [
      new TextRun({ text: 'Communication:  ', bold: true, size: 22 }),
      new TextRun({ text: 'Do families in your district know how much time students spend on devices, and for what purposes? If not, what would it take to tell them?', size: 22 }),
    ],
    bullet: { level: 0 },
    spacing: sp(0, 80),
  }),
  new Paragraph({
    children: [
      new TextRun({ text: 'Parental concerns:  ', bold: true, size: 22 }),
      new TextRun({ text: 'The concerns raised in this survey \u2014 particularly around hands-on learning, attention, and social development \u2014 are specific and actionable. Are they reflected in your district\u2019s technology review processes?', size: 22 }),
    ],
    bullet: { level: 0 },
    spacing: sp(0, 80),
  }),
  new Paragraph({
    children: [
      new TextRun({ text: 'Recreational use:  ', bold: true, size: 22 }),
      new TextRun({ text: 'Does your district have a clear, communicated policy on recreational screen use during school hours? Do parents know what it is, and do they have a meaningful way to weigh in?', size: 22 }),
    ],
    bullet: { level: 0 },
    spacing: sp(0, 80),
  }),
  pageBreak(),
];

const callToAction = [
  h1('Take the Survey'),
  body('This survey is ongoing. If you are a Pennsylvania parent and have not yet shared your experience, we want to hear from you.'),
  body([bold('[SURVEY LINK PLACEHOLDER]')]),
  ...empty(),
  body('Every response strengthens the evidence base for parents across the state. Share this survey with other Pennsylvania parents in your district and community.'),
  divider(),
  h2('About PA Unplugged'),
  body('PA Unplugged is a statewide parent-led organization working toward cultural change in how we approach screens with children in homes, schools, and communities. We welcome engagement from parents, policymakers, administrators, journalists, and researchers.'),
  body([bold('[PA UNPLUGGED WEBSITE PLACEHOLDER]')]),
  ...empty(),
  body([
    run('For questions about this report or the underlying data, contact '),
    bold('Alex Bird Becker, MPA, MSEd'),
    run(' at PA Unplugged.'),
  ]),
];

// ─── Assemble & write ─────────────────────────────────────────────────────────

const doc = new Document({
  sections: [{
    properties: {
      page: {
        margin: {
          top: convertInchesToTwip(1),
          bottom: convertInchesToTwip(1),
          left: convertInchesToTwip(1.25),
          right: convertInchesToTwip(1.25),
        },
      },
    },
    children: [
      ...titleSection,
      ...executiveSummary,
      ...aboutSection,
      ...methodologySection,
      ...findingsSection,
      ...parentVoicesSection,
      ...implicationsSection,
      ...callToAction,
    ],
  }],
});

mkdirSync(join(ROOT, 'reports'), { recursive: true });
const outPath = join(ROOT, 'reports/PA-Unplugged-Initial-Findings.docx');
const buffer = await Packer.toBuffer(doc);
writeFileSync(outPath, buffer);
console.log(`Written to ${outPath}`);
