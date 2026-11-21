import { PdfDoc, PAGE_H, PAGE_W, type RGB } from './simple-pdf.ts';
import { SUBSTANCES, formatWeekdayDate } from './taper-schedule.ts';
import {
  formatAmount,
  lastDoseDay,
  measureHint,
  shortTablets,
  tabletsNeeded,
  type DoseLog,
  type PlanChange,
  type SavedPlan,
} from './taper-plan.ts';

const MARGIN = 48;
const INK: RGB = [0.15, 0.13, 0.12];
const MUTED: RGB = [0.38, 0.34, 0.31];
const PRIMARY: RGB = [0.54, 0.29, 0.22];
const ZEBRA: RGB = [0.97, 0.95, 0.92];
const BAND: RGB = [0.94, 0.89, 0.86];

const COLS = [
  { key: 'day', x: MARGIN, label: 'Day' },
  { key: 'date', x: MARGIN + 44, label: 'Date' },
  { key: 'dose', x: MARGIN + 140, label: 'Dose' },
  { key: 'how', x: MARGIN + 240, label: 'How to take it' },
  { key: 'total', x: MARGIN + 400, label: 'Day total' },
  { key: 'log', x: MARGIN + 470, label: 'Logged' },
] as const;

function changeLine(c: PlanChange): string {
  const date = formatWeekdayDate(c.from, 0);
  const n = Math.abs(c.deltaDays);
  if (c.kind === 'hold') return `Held the dose on ${date} (1 day added).`;
  if (c.kind === 'slower') return `Slowed down from ${date} (${n} ${n === 1 ? 'day' : 'days'} added).`;
  if (c.kind === 'faster') return `Sped up from ${date} (${n} ${n === 1 ? 'day' : 'days'} taken off).`;
  if (c.kind === 'restart') return `Restarted from ${date} at a new dose.`;
  return '';
}

/** Build the schedule PDF. `generatedOn` is a display date. */
export function plannerPdf(plan: SavedPlan, log: DoseLog, generatedOn: string): Uint8Array<ArrayBuffer> {
  const doc = new PdfDoc();
  const unit = 'mg';
  const cfg = SUBSTANCES[plan.compound];
  const last = lastDoseDay(plan.days);

  const footer = () => {
    const lines = PdfDoc.wrap(
      'Reference, not a prescription. If you also use alcohol, benzodiazepines, gabapentinoids, or other sedatives, taper with medical supervision. SAMHSA National Helpline: 1-800-662-4357. findtreatment.gov',
      7.5,
      PAGE_W - MARGIN * 2 - 50,
    );
    lines.forEach((l, i) => doc.text(MARGIN, PAGE_H - 40 + i * 10, l, { size: 7.5, color: MUTED }));
    doc.text(PAGE_W - MARGIN - 34, PAGE_H - 40, `Page ${doc.page}`, { size: 7.5, color: MUTED });
  };

  // Header
  let y = MARGIN + 10;
  doc.text(MARGIN, y, `Taper schedule: ${cfg.label}`, { size: 18, bold: true });
  y += 22;
  const measured =
    plan.measure.kind === 'tablet'
      ? `Measured with ${plan.measure.size} ${unit} tablets, cut into 4 pieces where needed. About ${tabletsNeeded(plan.days, plan.measure.size)} tablets in all.`
      : `Measured by weighing powder${plan.measure.strengthPct ? ` (${plan.measure.strengthPct}% strength)` : ''}.`;
  for (const line of [
    `Starts ${formatWeekdayDate(plan.days[0].date, 0)}. ${plan.days.length} days. Last dose ${formatWeekdayDate(last.date, 0)}, ${formatAmount(last.totalDaily)} ${unit} for the day.`,
    measured,
    `From the quitting7oh.org taper planner (preview), ${generatedOn}.`,
  ]) {
    doc.text(MARGIN, y, line, { size: 9.5, color: MUTED });
    y += 13;
  }
  y += 10;

  const tableHeader = () => {
    doc.line(MARGIN, y + 4, PAGE_W - MARGIN, y + 4, INK, 1);
    COLS.forEach((c) => doc.text(c.x, y, c.label.toUpperCase(), { size: 7.5, bold: true, color: MUTED }));
    y += 16;
  };
  tableHeader();

  const ROW = 16;
  const bottom = PAGE_H - 64;
  plan.days.forEach((d, i) => {
    const changes = plan.changes.filter((c) => c.kind !== 'start' && c.from === d.date);
    const needed = ROW * (1 + changes.length);
    if (y + needed > bottom) {
      footer();
      doc.addPage();
      y = MARGIN + 10;
      tableHeader();
    }
    for (const c of changes) {
      doc.rect(MARGIN - 4, y - 11, PAGE_W - MARGIN * 2 + 8, ROW, BAND);
      doc.text(MARGIN, y, changeLine(c), { size: 8.5, bold: true, color: PRIMARY });
      y += ROW;
    }
    if (i % 2 === 1) doc.rect(MARGIN - 4, y - 11, PAGE_W - MARGIN * 2 + 8, ROW, ZEBRA);
    const logged = log[d.date]?.length ?? 0;
    const how =
      d.totalDaily === 0
        ? 'No dose'
        : plan.measure.kind === 'tablet'
          ? shortTablets(d.perDose, plan.measure.size) + ' each'
          : measureHint(d.perDose, plan.measure, unit).main.replace(' of powder', '');
    const cells: Record<(typeof COLS)[number]['key'], string> = {
      day: String(i + 1),
      date: formatWeekdayDate(d.date, 0),
      dose: d.totalDaily === 0 ? 'Stop day' : `${formatAmount(d.perDose)} ${unit} x ${d.dosesPerDay}`,
      how,
      total: d.totalDaily === 0 ? '0' : `${formatAmount(d.totalDaily)} ${unit}`,
      log: d.totalDaily === 0 ? '' : logged > 0 ? `${logged} of ${d.dosesPerDay}` : '[   ]',
    };
    COLS.forEach((c) => doc.text(c.x, y, cells[c.key], { size: 9, bold: c.key === 'dose', color: INK }));
    y += ROW;
  });
  footer();
  return doc.toBytes();
}
