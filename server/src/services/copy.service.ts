import env from '../config/env.js';
import logger from '../utils/logger.js';
import type { AdCreative, CopyRequest, CopyResponse } from '../../../shared/types.js';

/**
 * Ad copy generation.
 *
 * With ANTHROPIC_API_KEY set, three variants come from Claude. Without a key,
 * or if the call fails or times out, built-in templates answer instead, so the
 * wizard never dead-ends on a missing key or a flaky network.
 */

const LLM_TIMEOUT_MS = 15_000;
export const LIMITS = { headline: 40, body: 125, cta: 20 } as const;

const CTA_BY_OBJECTIVE: Record<CopyRequest['objective'], string[]> = {
  awareness: ['Learn more', 'See what’s new', 'Discover it'],
  traffic: ['Visit us', 'Shop now', 'See the menu'],
  conversions: ['Book now', 'Order today', 'Get yours'],
};

const OPENERS: Record<CopyRequest['tone'], string[]> = {
  friendly: ['Say hello to', 'Meet', 'Treat yourself to'],
  bold: ['Your new favorite:', 'Don’t miss', 'Stop scrolling for'],
  premium: ['Crafted for you:', 'Introducing', 'Discover the refined'],
  playful: ['Psst — it’s', 'Guess who’s here:', 'Your weekend just met'],
};

function clip(text: string, max: number): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trimEnd()}…`;
}

function sanitize(variant: AdCreative): AdCreative {
  return {
    headline: clip(variant.headline, LIMITS.headline),
    body: clip(variant.body, LIMITS.body),
    cta: clip(variant.cta, LIMITS.cta),
  };
}

export function templateCopy(request: CopyRequest): AdCreative[] {
  const { product, audience, objective, tone } = request;
  const openers = OPENERS[tone];
  const ctas = CTA_BY_OBJECTIVE[objective];
  const bodies = [
    `Made for ${audience}. ${product} is ready when you are — come see why locals keep coming back.`,
    `${product}, built around what ${audience} actually want. Limited time, so don’t wait.`,
    `Looking for something new? ${product} brings it, made for ${audience}.`,
  ];

  // "Late-night hours" reads as "Say hello to late-night hours" mid-sentence; acronyms like "NYC" stay as is.
  const inSentence = /^[A-Z][a-z]/.test(product) ? product.charAt(0).toLowerCase() + product.slice(1) : product;

  return bodies.map((body, i) =>
    sanitize({
      headline: `${openers[i % openers.length]} ${inSentence}`,
      body,
      cta: ctas[i % ctas.length] ?? 'Learn more',
    })
  );
}

function buildPrompt(request: CopyRequest): string {
  return [
    'You write short social media ad copy for small businesses.',
    `Product or offer: ${request.product}`,
    `Target audience: ${request.audience}`,
    `Campaign objective: ${request.objective}`,
    `Tone: ${request.tone}`,
    '',
    'Write 3 distinct ad variants. Limits: headline ≤ 40 characters, body ≤ 125 characters,',
    'call-to-action ≤ 20 characters. No hashtags, no emoji, no made-up prices or claims.',
    'Reply with JSON only, in this exact shape:',
    '{"variants":[{"headline":"","body":"","cta":""}]}',
  ].join('\n');
}

/** Pulls the first JSON object out of the model's reply and checks its shape. */
export function parseVariants(text: string): AdCreative[] | null {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end <= start) return null;

  try {
    const parsed = JSON.parse(text.slice(start, end + 1)) as { variants?: unknown };
    if (!Array.isArray(parsed.variants)) return null;

    const variants = parsed.variants
      .filter(
        (v): v is AdCreative =>
          typeof v === 'object' &&
          v !== null &&
          typeof (v as AdCreative).headline === 'string' &&
          typeof (v as AdCreative).body === 'string' &&
          typeof (v as AdCreative).cta === 'string'
      )
      .slice(0, 3)
      .map(sanitize);

    return variants.length > 0 ? variants : null;
  } catch {
    return null;
  }
}

async function llmCopy(request: CopyRequest): Promise<AdCreative[] | null> {
  if (!env.ANTHROPIC_API_KEY) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), LLM_TIMEOUT_MS);

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'content-type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: env.ANTHROPIC_MODEL,
        max_tokens: 600,
        messages: [{ role: 'user', content: buildPrompt(request) }],
      }),
    });

    if (!response.ok) {
      logger.warn({ status: response.status }, 'Ad copy LLM call failed; using templates');
      return null;
    }

    const body = (await response.json()) as { content?: { type: string; text?: string }[] };
    const text = body.content?.find((block) => block.type === 'text')?.text ?? '';
    const variants = parseVariants(text);
    if (!variants) logger.warn('Ad copy LLM reply was not valid JSON; using templates');
    return variants;
  } catch (err) {
    logger.warn({ err }, 'Ad copy LLM call errored; using templates');
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function generateCopy(request: CopyRequest): Promise<CopyResponse> {
  const variants = await llmCopy(request);
  if (variants) return { variants, source: 'llm' };
  return { variants: templateCopy(request), source: 'template' };
}
