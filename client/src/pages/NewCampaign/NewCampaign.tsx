import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { campaignsApi } from '@/api/campaigns';
import { ApiError } from '@/api/client';
import Button, { ButtonLink } from '@/components/Button';
import Stepper from '@/components/Stepper';
import { emptyDraft, STEPS, stepForField, toNewCampaign, validateStep } from './draft';
import type { Draft, Errors } from './draft';
import BasicsStep from './steps/BasicsStep';
import AudienceStep from './steps/AudienceStep';
import CreativeStep from './steps/CreativeStep';
import BudgetStep from './steps/BudgetStep';
import './NewCampaign.scss';

const STEP_INTROS = [
  'Name the campaign and pick what it should achieve.',
  'Choose who should see your ad.',
  'Write the ad. Let AI draft three versions, then make it yours.',
  'Set a daily budget, check everything, and launch.',
];

// Which error messages each draft field owns (error keys match the API's field paths).
const ERROR_KEYS: Partial<Record<keyof Draft, string[]>> = {
  name: ['name'],
  objective: ['objective'],
  startDate: ['startDate'],
  locations: ['audience.locations'],
  ageMin: ['audience.ageMin', 'audience.ageMax'],
  ageMax: ['audience.ageMin', 'audience.ageMax'],
  interests: ['audience.interests'],
  creative: ['creative.headline', 'creative.body', 'creative.cta'],
  dailyBudget: ['dailyBudgetCents'],
};

export default function NewCampaignPage() {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);
  const navigate = useNavigate();

  // Move focus to the step heading when the step changes, so screen readers announce it.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [step]);

  const update = (patch: Partial<Draft>) => {
    setDraft((current) => ({ ...current, ...patch }));
    // Clear errors for fields being edited so messages don't linger after a fix.
    setErrors((current) => {
      const next = { ...current };
      for (const field of Object.keys(patch) as (keyof Draft)[]) {
        for (const key of ERROR_KEYS[field] ?? []) delete next[key];
      }
      return next;
    });
  };

  const goTo = (target: number) => {
    setErrors({});
    setFormError(null);
    setStep(target);
  };

  const launch = async () => {
    // Re-check every step: an earlier step may have been edited since.
    for (let i = 0; i < STEPS.length; i += 1) {
      const stepErrors = validateStep(i, draft);
      if (Object.keys(stepErrors).length) {
        setErrors(stepErrors);
        setStep(i);
        return;
      }
    }

    setIsSaving(true);
    setFormError(null);
    try {
      const campaign = await campaignsApi.create(toNewCampaign(draft));
      navigate('/', { state: { created: campaign.name } });
    } catch (err) {
      if (err instanceof ApiError && Object.keys(err.issues).length) {
        const firstField = Object.keys(err.issues)[0] ?? '';
        setErrors(err.issues);
        setStep(stepForField(firstField));
        setFormError(err.message);
      } else {
        setFormError(err instanceof Error ? err.message : 'Couldn’t launch the campaign.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const stepErrors = validateStep(step, draft);
    setErrors(stepErrors);
    if (Object.keys(stepErrors).length) return;
    if (step < STEPS.length - 1) goTo(step + 1);
    else void launch();
  };

  const isLast = step === STEPS.length - 1;
  const errorCount = Object.keys(errors).length;

  return (
    <div className="new-campaign">
      <header className="new-campaign__head">
        <h1 className="new-campaign__title">New campaign</h1>
        <ButtonLink to="/" variant="ghost">
          Cancel
        </ButtonLink>
      </header>

      <div className="new-campaign__layout">
        <aside className="new-campaign__steps">
          <Stepper steps={STEPS} current={step} onSelect={goTo} />
        </aside>

        <form className="new-campaign__form" onSubmit={handleSubmit} noValidate>
          <div className="new-campaign__step-head">
            <h2 ref={headingRef} tabIndex={-1} className="new-campaign__step-title">
              {STEPS[step]}
            </h2>
            <p className="new-campaign__step-intro">{STEP_INTROS[step]}</p>
          </div>

          {(formError || errorCount > 0) && (
            <p className="new-campaign__summary" role="alert">
              {formError ?? `Fix ${errorCount === 1 ? 'the highlighted field' : `the ${errorCount} highlighted fields`} to continue.`}
            </p>
          )}

          <div className="new-campaign__body">
            {step === 0 && <BasicsStep draft={draft} errors={errors} update={update} />}
            {step === 1 && <AudienceStep draft={draft} errors={errors} update={update} />}
            {step === 2 && <CreativeStep draft={draft} errors={errors} update={update} />}
            {step === 3 && <BudgetStep draft={draft} errors={errors} update={update} onEdit={goTo} />}
          </div>

          <div className="new-campaign__nav">
            {step > 0 ? (
              <Button variant="secondary" onClick={() => goTo(step - 1)}>
                Back
              </Button>
            ) : (
              <span />
            )}
            <Button type="submit" isBusy={isSaving}>
              {isLast ? 'Launch campaign' : `Continue to ${STEPS[step + 1]?.toLowerCase()}`}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
