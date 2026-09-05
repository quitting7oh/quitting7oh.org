import naBundle from '~/data/na-meetings.generated.json';
import smartBundle from '~/data/smart-meetings.generated.json';
import type {
  LiveMeetingIndex,
  LiveNaMeeting,
  LiveSmartMeeting,
} from '~/lib/live-meeting-index';

export const prerender = true;

function isWebJoin(url: string): boolean {
  return /^https?:\/\//.test(url);
}
export function GET(): Response {
  const na = naBundle.meetings
    .filter((meeting) => meeting.closed === 'Open' && isWebJoin(meeting.joinUrl))
    .map<LiveNaMeeting>((meeting) => ({
      provider: 'NA',
      id: meeting.id,
      name: meeting.name,
      joinUrl: meeting.joinUrl,
      platform: meeting.platform,
      day: meeting.day,
      hour: meeting.hour,
      minute: meeting.minute,
      timezone: meeting.timezone,
    }));

  const smart = smartBundle.meetings
    .filter(
      (meeting) =>
        meeting.program === '4-Point Recovery' &&
        meeting.audiences.length === 1 &&
        meeting.audiences[0] === 'Adults' &&
        isWebJoin(meeting.pathminderUrl),
    )
    .map<LiveSmartMeeting>((meeting) => ({
      provider: 'SMART',
      id: meeting.id,
      name: meeting.name,
      joinUrl: meeting.pathminderUrl,
      platform: 'SMART Online',
      utcStart: meeting.utcStart,
    }));

  const featuredNa: LiveNaMeeting | null = naBundle.featured && isWebJoin(naBundle.featured.joinUrl)
    ? {
        provider: 'NA',
        id: naBundle.featured.id,
        name: naBundle.featured.name,
        joinUrl: naBundle.featured.joinUrl,
        platform: naBundle.featured.platform,
        day: naBundle.featured.day,
        hour: naBundle.featured.hour,
        minute: naBundle.featured.minute,
        timezone: naBundle.featured.timezone,
        alwaysAvailable: true,
      }
    : null;

  const body: LiveMeetingIndex = {
    generatedAt: new Date().toISOString(),
    featuredNa,
    na,
    smart,
  };

  return new Response(JSON.stringify(body), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
