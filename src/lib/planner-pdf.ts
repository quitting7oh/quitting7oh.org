import { PdfDoc, PAGE_H, PAGE_W, type RGB } from './simple-pdf.ts';
import { SUBSTANCES, formatWeekdayDate } from './taper-schedule.ts';
import {
  activeAmount,
  formatAmount,
  lastDoseDay,
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
  { key: 'date', x: MARGIN + 34, label: 'Date' },
  { key: 'dose', x: MARGIN + 124, label: 'Dose' },
  { key: 'how', x: MARGIN + 224, label: 'How to take it' },
  { key: 'total', x: MARGIN + 376, label: 'Day total' },
  { key: 'log', x: MARGIN + 440, label: 'Taken' },
] as const;
type ColKey = (typeof COLS)[number]['key'];

function changeLine(c: PlanChange): string {
  const date = formatWeekdayDate(c.from, 0);
  const n = Math.abs(c.deltaDays);
  if (c.kind === 'hold') return `Stayed on the previous dose on ${date} (1 day added).`;
  if (c.kind === 'extend') return `One more day at the same dose on ${date} (1 day added).`;
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
    doc.text(PAGE_W - MARGIN - 42, PAGE_H - 40, `Page ${doc.page} of {pages}`, { size: 7.5, color: MUTED });
  };

  // Header
  let y = MARGIN + 10;
  doc.text(MARGIN, y, `Taper schedule: ${cfg.label}`, { size: 18, bold: true });
  y += 22;
  const measured =
    plan.measure.kind === 'tablet'
      ? `Measured with ${plan.measure.size} ${unit} tablets, cut into 4 pieces where needed. About ${tabletsNeeded(plan.days, plan.measure.size)} tablets in all.`
      : `Measured by weighing powder on a scale. Amounts are what the scale reads${plan.measure.strengthPct ? `, at ${plan.measure.strengthPct}% strength` : ''}.`;
  for (const line of [
    `Starts ${formatWeekdayDate(plan.days[0].date, 0)}. ${plan.days.length} days. Last dose ${formatWeekdayDate(last.date, 0)}, ${formatAmount(last.totalDaily)} ${unit} for the day.`,
    measured,
    `From the quitting7oh.org taper planner (preview), ${generatedOn}.`,
  ]) {
    doc.text(MARGIN, y, line, { size: 9.5, color: MUTED });
    y += 13;
  }
  y += 10;

  const powder = plan.measure.kind === 'powder';
  const strength = plan.measure.kind === 'powder' ? plan.measure.strengthPct : undefined;
  const labels: Partial<Record<ColKey, string>> = powder
    ? { dose: 'Powder weight', how: strength ? 'Active amount' : 'How to take it', total: 'Day total' }
    : {};
  const tableHeader = () => {
    doc.line(MARGIN, y + 4, PAGE_W - MARGIN, y + 4, INK, 1);
    COLS.forEach((c) => doc.text(c.x, y, (labels[c.key] ?? c.label).toUpperCase(), { size: 7.5, bold: true, color: MUTED }));
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
      doc.text(MARGIN, y, `Taper schedule: ${cfg.label}, continued`, { size: 9.5, bold: true, color: MUTED });
      y += 20;
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
          : strength
            ? `about ${formatAmount(activeAmount(d.perDose, strength))} ${unit} active each`
            : 'Weigh each dose';
    const cells: Record<ColKey, string> = {
      day: String(i + 1),
      date: formatWeekdayDate(d.date, 0),
      dose: d.totalDaily === 0 ? 'Stop day' : `${formatAmount(d.perDose)} ${unit} \u00d7 ${d.dosesPerDay}`,
      how,
      total: d.totalDaily === 0 ? '0' : `${formatAmount(d.totalDaily)} ${unit}`,
      log: '',
    };
    COLS.forEach((c) => doc.text(c.x, y, cells[c.key], { size: 9, bold: c.key === 'dose', color: INK }));
    // One tick box per dose, filled for doses already logged.
    if (d.totalDaily > 0) {
      const box = 8;
      const gap = 3;
      const perRow = Math.floor((PAGE_W - MARGIN - COLS[5].x) / (box + gap));
      for (let k = 0; k < Math.min(d.dosesPerDay, perRow); k++) {
        const bx = COLS[5].x + k * (box + gap);
        const by = y - 8;
        if (k < logged) doc.rect(bx, by, box, box, PRIMARY);
        doc.line(bx, by, bx + box, by, INK, 0.6);
        doc.line(bx + box, by, bx + box, by + box, INK, 0.6);
        doc.line(bx + box, by + box, bx, by + box, INK, 0.6);
        doc.line(bx, by + box, bx, by, INK, 0.6);
      }
      if (d.dosesPerDay > perRow) doc.text(COLS[5].x + perRow * (box + gap), y, `+${d.dosesPerDay - perRow}`, { size: 7, color: MUTED });
    }
    y += ROW;
  });
  footer();
  return doc.toBytes();
}
