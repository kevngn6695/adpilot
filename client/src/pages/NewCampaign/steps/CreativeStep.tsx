import { useState } from 'react';
import type { AdCreative, CopyResponse, Tone } from '@shared/types';
import { copyApi } from '@/api/campaigns';
import { ApiError } from '@/api/client';
import Button from '@/components/Button';
import { TextAreaField, TextField } from '@/components/Field';
import SegmentedControl from '@/components/SegmentedControl';
import AdPreview from '@/components/AdPreview';
import { LIMITS } from '../draft';
import type { StepProps } from './types';

const TONE_OPTIONS = [
  { value: 'friendly', label: 'Friendly' },
  { value: 'bold', label: 'Bold' },
  { value: 'premium', label: 'Premium' },
  { value: 'playful', label: 'Playful' },
] as const satisfies readonly { value: Tone; label: string }[];

export default function CreativeStep({ draft, errors, update }: StepProps) {
  const [result, setResult] = useState<CopyResponse | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genError, setGenError] = useState<Record<string, string>>({});
  const [chosen, setChosen] = useState<number | null>(null);

  const setCreative = (patch: Partial<AdCreative>) => update({ creative: { ...draft.creative, ...patch } });

  const audienceGuess = draft.audienceDescription || draft.interests.slice(0, 2).join(' and ') || '';

  const generate = async () => {
    setGenError({});
    setIsGenerating(true);
    try {
      const response = await copyApi.generate({
        product: draft.product,
        audience: audienceGuess || draft.locations.join(', ') || 'local customers',
        objective: draft.objective || 'awareness',
        tone: draft.tone,
      });
      setResult(response);
      setChosen(null);
    } catch (err) {
      if (err instanceof ApiError && Object.keys(err.issues).length) setGenError(err.issues);
      else setGenError({ form: err instanceof Error ? err.message : 'Couldn’t generate copy.' });
    } finally {
      setIsGenerating(false);
    }
  };

  const applyVariant = (i: number) => {
    const variant = result?.variants[i];
    if (!variant) return;
    setChosen(i);
    update({ creative: { ...variant } });
  };

  return (
    <div className="new-campaign__split">
      <div className="new-campaign__fields">
        <section className="new-campaign__generator" aria-labelledby="generator-heading">
          <h3 id="generator-heading" className="new-campaign__subhead">
            Write it with AI
          </h3>
          <TextField
            label="What are you promoting?"
            placeholder="Pumpkin cold brew"
            value={draft.product}
            error={genError.product}
            maxChars={80}
            onChange={(e) => update({ product: e.target.value })}
          />
          <TextField
            label="Who is it for?"
            hint="Leave blank to use the interests from the previous step."
            placeholder={audienceGuess || 'College students who love coffee'}
            value={draft.audienceDescription}
            error={genError.audience}
            maxChars={80}
            onChange={(e) => update({ audienceDescription: e.target.value })}
          />
          <SegmentedControl label="Tone" options={TONE_OPTIONS} value={draft.tone} onChange={(tone) => update({ tone })} />
          <div>
            <Button variant="secondary" onClick={generate} isBusy={isGenerating}>
              {result ? 'Write new versions' : 'Write 3 versions'}
            </Button>
          </div>
          {genError.form && (
            <p className="new-campaign__inline-error" role="alert">
              {genError.form}
            </p>
          )}

          {result && (
            <div className="new-campaign__variants" aria-live="polite">
              <p className="new-campaign__source">
                {result.source === 'llm'
                  ? 'Written by Claude. Pick one, then edit it below.'
                  : 'Written from built-in templates because no AI key is set on the server. Pick one, then edit it below.'}
              </p>
              <ul className="new-campaign__variant-list">
                {result.variants.map((v, i) => (
                  <li key={`${v.headline}-${i}`} className={`variant${chosen === i ? ' variant--chosen' : ''}`}>
                    <p className="variant__headline">{v.headline}</p>
                    <p className="variant__body">{v.body}</p>
                    <div className="variant__foot">
                      <span className="variant__cta">Button: {v.cta}</span>
                      <Button size="sm" variant={chosen === i ? 'primary' : 'secondary'} onClick={() => applyVariant(i)}>
                        {chosen === i ? 'In use' : 'Use this version'}
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <section className="new-campaign__copy" aria-labelledby="copy-heading">
          <h3 id="copy-heading" className="new-campaign__subhead">
            Your ad
          </h3>
          <TextField
            label="Headline"
            value={draft.creative.headline}
            maxChars={LIMITS.headline}
            error={errors['creative.headline']}
            onChange={(e) => setCreative({ headline: e.target.value })}
          />
          <TextAreaField
            label="Ad text"
            value={draft.creative.body}
            maxChars={LIMITS.body}
            error={errors['creative.body']}
            onChange={(e) => setCreative({ body: e.target.value })}
          />
          <TextField
            label="Button text"
            value={draft.creative.cta}
            maxChars={LIMITS.cta}
            error={errors['creative.cta']}
            onChange={(e) => setCreative({ cta: e.target.value })}
          />
        </section>
      </div>

      <div className="new-campaign__preview">
        <AdPreview businessName={draft.name} product={draft.product} creative={draft.creative} />
      </div>
    </div>
  );
}
