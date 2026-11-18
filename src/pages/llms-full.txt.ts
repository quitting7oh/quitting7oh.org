import { buildLlmsFull, getLlmsSections, textResponse } from '~/lib/llms';

export const prerender = true;

export async function GET() {
  return textResponse(buildLlmsFull(await getLlmsSections()));
}
