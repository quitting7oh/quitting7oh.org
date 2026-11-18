import { buildLlmsIndex, getLlmsSections, textResponse } from '~/lib/llms';

export const prerender = true;

export async function GET() {
  return textResponse(buildLlmsIndex(await getLlmsSections()));
}
