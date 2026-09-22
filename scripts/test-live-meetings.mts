import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { after, test } from 'node:test';
import { createServer } from 'vite';
import bundle from '../src/data/na-meetings.generated.json' with { type: 'json' };
import { hasGeneralNaAudience } from '../src/lib/na-meeting-eligibility.ts';
import type { LiveMeetingIndex, LiveNaMeeting } from '../src/lib/live-meeting-index.ts';

const server = await createServer({
  configFile: false,
  cacheDir: '.astro/live-meeting-tests',
  resolve: { alias: { '~': fileURLToPath(new URL('../src', import.meta.url)) } },
  server: { middlewareMode: true, hmr: false, ws: false, watch: null },
});
after(() => server.close());

const { GET } = await server.ssrLoadModule('/src/pages/live-meeting-index.json.ts') as typeof import('../src/pages/live-meeting-index.json.ts');
const { chooseLiveMeeting } = await server.ssrLoadModule('/src/lib/live-meeting-index.ts') as typeof import('../src/lib/live-meeting-index.ts');
const index: LiveMeetingIndex = await GET().json();

// NA reuses IDs across days whose audience tags can differ.
function occurrenceKey(meeting: Pick<LiveNaMeeting, 'id' | 'day' | 'hour' | 'minute'>): string {
  return `${meeting.id}:${meeting.day}:${meeting.hour}:${meeting.minute}`;
}

test('Tacoma Women\'s Group stays in the schedule but cannot be suggested', () => {
  const meeting = bundle.meetings.find((meeting) => meeting.name === "Tacoma Women's Group");
  assert.ok(meeting, 'The full schedule retains the reported meeting');
  assert.equal(index.na.some((entry) => entry.id === meeting.id), false);
});

test('audience tags exclude special-interest meetings from suggestions', () => {
  const audienceTags = new Set(['Women', 'Men', 'LGBTQ+', 'Young People', 'Restricted Access']);
  const specializedSlots = new Set(bundle.meetings
    .filter((meeting) => meeting.formatTags.some((tag) => audienceTags.has(tag)))
    .map(occurrenceKey));
  assert.deepEqual(index.na.filter((meeting) => specializedSlots.has(occurrenceKey(meeting))).map((meeting) => meeting.name), []);
});

test('missing audience tags do not admit known special-interest meetings', () => {
  for (const name of ['Women in Recovery: Walking the Talk Group', 'Sisters N2 The Solution', "Saturday Men's Stag Virtual Group", 'Transworld: Global Recovery Group']) {
    assert.ok(bundle.meetings.some((meeting) => meeting.name === name));
    assert.equal(index.na.some((meeting) => meeting.name === name), false, name);
  }
});

test('the shared suggestion selector discards a saved audience-specific choice', () => {
  const meeting = bundle.meetings.find((meeting) => meeting.name === "Tacoma Women's Group");
  assert.ok(meeting);
  const now = new Date('2026-09-22T01:30:00Z'); // Monday, 6:30 PM Pacific.
  const preferredKey = `NA:${meeting.id}`;
  const choice = chooseLiveMeeting(index, now, preferredKey);
  assert.ok(choice);
  assert.notEqual(choice.meeting.id, meeting.id);
  assert.equal(choice.fallback, false, 'Other scheduled live rooms remain available');
});

test('audience wording covers punctuation and missing tags without matching partial words', () => {
  const base = { formatTags: [] };
  for (const name of ["Women's Meeting", 'WOMEN’S RECOVERY', 'Womens Group', 'Mens Group', 'Ladies Living Clean', 'Sisters N2 The Solution', 'Brothers in Recovery', 'LGBTQ+ Recovery', 'Gay and Lesbian Group', 'Trans Recovery', 'Non-binary Recovery', 'Young People of NA', 'Youth Recovery', 'Veterans Group', 'Never Alone Deaf Online Group']) {
    assert.equal(hasGeneralNaAudience({ ...base, name }), false, name);
  }
  for (const name of ['Welcome Home', 'New Beginnings', 'Empowerment', 'Mental Health in Recovery', 'A New Day', 'Step Study']) {
    assert.equal(hasGeneralNaAudience({ ...base, name }), true, name);
  }
  assert.equal(hasGeneralNaAudience({ ...base, name: 'Open Discussion', formatTags: ['  WOMEN  '] }), false);
});

test('general meeting formats and accessibility features remain eligible', () => {
  for (const tag of ['Newcomer', 'Literature Study', 'Discussion', 'Meditation', 'Secular', 'Children Welcome', 'Hybrid Meeting']) {
    assert.equal(hasGeneralNaAudience({ name: 'Welcome Home', formatTags: [tag] }), true, tag);
  }
  const openSlots = new Set(bundle.meetings.filter((meeting) => meeting.closed === 'Open').map(occurrenceKey));
  assert.ok(index.na.every((meeting) => openSlots.has(occurrenceKey(meeting))));
  assert.ok(index.na.length > 100, 'Keep a broad pool of scheduled rooms');
  assert.ok(index.na.every((meeting) => /^https?:\/\//.test(meeting.joinUrl)));
});

test('the shared selector randomly chooses scheduled rooms before the 24/7 fallback', (context) => {
  const now = new Date('2026-09-22T01:30:00Z');
  const meetings = ['First room', 'Second room'].map((name, i) => ({
    provider: 'NA' as const, id: `room-${i}`, name, joinUrl: 'https://example.com/meeting',
    platform: 'Zoom', day: 1, hour: 18, minute: 0, timezone: 'US/Pacific',
  }));
  const fixture: LiveMeetingIndex = { ...index, na: meetings };
  const random = context.mock.method(Math, 'random');
  random.mock.mockImplementation(() => 0);
  assert.equal(chooseLiveMeeting(fixture, now)?.meeting.id, 'room-0');
  random.mock.mockImplementation(() => 0.999);
  assert.equal(chooseLiveMeeting(fixture, now)?.meeting.id, 'room-1');
  assert.equal(chooseLiveMeeting(fixture, now, 'NA:room-0')?.meeting.id, 'room-0');
  const fallback = chooseLiveMeeting({ ...fixture, na: [] }, now);
  assert.ok(fallback);
  assert.equal(fallback.meeting.id, index.featuredNa?.id);
  assert.equal(fallback.fallback, true);
  assert.equal(chooseLiveMeeting({ ...fixture, na: [], featuredNa: null }, now), null);
});

test('stale SMART data stays excluded after the retirement', () => {
  const now = new Date('2026-09-21T12:30:00Z');
  const na: LiveNaMeeting = {
    provider: 'NA', id: 'na-live', name: 'NA meeting', joinUrl: 'https://example.com/na',
    platform: 'Zoom', day: 1, hour: 12, minute: 0, timezone: 'UTC',
  };
  const featuredNa = { ...na, id: 'na-24-7', alwaysAvailable: true };
  const cachedIndex = {
    generatedAt: now.toISOString(), featuredNa, na: [na],
    // An older cached index and session preference must not revive SMART listings.
    smart: [{
      provider: 'SMART', id: 'smart-live', name: 'Old SMART meeting',
      joinUrl: 'https://example.com/smart', platform: 'SMART Online',
      utcStart: '2026-09-21T12:00:00Z',
    }],
  } as unknown as LiveMeetingIndex;

  assert.equal(chooseLiveMeeting(cachedIndex, now, 'SMART:smart-live')?.meeting.id, na.id);
  assert.equal(chooseLiveMeeting(cachedIndex, now, 'NA:na-live')?.meeting.id, na.id);
  const fallback = chooseLiveMeeting({ ...cachedIndex, na: [] }, now, 'SMART:smart-live');
  assert.equal(fallback?.meeting.id, featuredNa.id);
  assert.equal(fallback?.fallback, true);
  assert.equal(chooseLiveMeeting({ ...cachedIndex, na: [], featuredNa: null }, now), null);
  assert.equal(chooseLiveMeeting(cachedIndex, new Date('2026-09-21T13:00:00Z'))?.fallback, true);

  assert.deepEqual(index.smart, [], 'Cached older clients still need an empty SMART array');
  assert.ok(index.na.every((meeting) => meeting.provider === 'NA'));
});
