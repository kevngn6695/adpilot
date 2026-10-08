import type { Objective } from '@shared/types';
import { TextField } from '@/components/Field';
import ChoiceCards from '@/components/ChoiceCards';
import type { StepProps } from './types';

const OBJECTIVES = [
  { value: 'awareness', title: 'Awareness', description: 'Get your business in front of as many nearby people as possible.' },
  { value: 'traffic', title: 'Traffic', description: 'Send people to your website, menu, or booking page.' },
  { value: 'conversions', title: 'Conversions', description: 'Drive a specific action, like a sign-up, order, or booking.' },
] as const satisfies readonly { value: Objective; title: string; description: string }[];

export default function BasicsStep({ draft, errors, update }: StepProps) {
  return (
    <>
      <TextField
        label="Campaign name"
        hint="Only you see this. Name it so you’ll recognize it in reports."
        placeholder="Fall menu launch"
        value={draft.name}
        error={errors.name}
        maxChars={80}
        onChange={(e) => update({ name: e.target.value })}
      />
      <ChoiceCards
        legend="What should this campaign achieve?"
        choices={OBJECTIVES}
        value={draft.objective}
        error={errors.objective}
        onChange={(objective) => update({ objective })}
      />
      <TextField
        label="Start date"
        type="date"
        value={draft.startDate}
        error={errors.startDate}
        onChange={(e) => update({ startDate: e.target.value })}
      />
    </>
  );
}
