import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const server = await createServer({
  configFile: false,
  cacheDir: '.astro/live-meeting-tests',
  resolve: { alias: { '~': fileURLToPath(new URL('../src', import.meta.url)) } },
  server: { middlewareMode: true, hmr: false, ws: false, watch: null },
});

try {
  const { chooseLiveMeeting } = await server.ssrLoadModule('/src/lib/live-meeting-index.ts');
  const now = new Date('2026-09-21T12:30:00Z');
  const na = {
    provider: 'NA', id: 'na-live', name: 'NA meeting', joinUrl: 'https://example.com/na',
    platform: 'Zoom', day: 1, hour: 12, minute: 0, timezone: 'UTC',
  };
  const featuredNa = { ...na, id: 'na-24-7', alwaysAvailable: true };
  const index = {
    generatedAt: now.toISOString(), featuredNa, na: [na],
    // An older cached index and session preference must not revive SMART listings.
    smart: [{
      provider: 'SMART', id: 'smart-live', name: 'Old SMART meeting',
      joinUrl: 'https://example.com/smart', platform: 'SMART Online',
      utcStart: '2026-09-21T12:00:00Z',
    }],
  };

  assert.equal(chooseLiveMeeting(index, now, 'SMART:smart-live')?.meeting.id, na.id);
  assert.equal(chooseLiveMeeting(index, now, 'NA:na-live')?.meeting.id, na.id);
  const fallback = chooseLiveMeeting({ ...index, na: [] }, now, 'SMART:smart-live');
  assert.equal(fallback?.meeting.id, featuredNa.id);
  assert.equal(fallback?.fallback, true);
  assert.equal(chooseLiveMeeting({ ...index, na: [], featuredNa: null }, now), null);
  assert.equal(chooseLiveMeeting(index, new Date('2026-09-21T13:00:00Z'))?.fallback, true);

  const { GET } = await server.ssrLoadModule('/src/pages/live-meeting-index.json.ts');
  const response = GET();
  const published = await response.json();
  assert.deepEqual(published.smart, [], 'Cached older clients still need an empty SMART array');
  assert.ok(published.na.length > 0, 'NA meetings must remain available');
  assert.ok(published.na.every((meeting: { provider: string }) => meeting.provider === 'NA'));
  console.log('Live meeting regressions passed: stale SMART data ignored, NA selection and published index intact.');
} finally {
  await server.close();
}
