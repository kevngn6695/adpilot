import { TextField } from '@/components/Field';
import TagInput from '@/components/TagInput';
import type { StepProps } from './types';

export default function AudienceStep({ draft, errors, update }: StepProps) {
  return (
    <>
      <TagInput
        label="Locations"
        hint="Cities or regions. Press Enter after each one."
        placeholder="San Jose, CA"
        tags={draft.locations}
        max={10}
        error={errors['audience.locations']}
        onChange={(locations) => update({ locations })}
      />
      <div className="new-campaign__row">
        <TextField
          label="Minimum age"
          type="number"
          inputMode="numeric"
          min={13}
          max={65}
          value={draft.ageMin}
          error={errors['audience.ageMin']}
          onChange={(e) => update({ ageMin: e.target.value })}
        />
        <TextField
          label="Maximum age"
          type="number"
          inputMode="numeric"
          min={13}
          max={65}
          value={draft.ageMax}
          error={errors['audience.ageMax']}
          onChange={(e) => update({ ageMax: e.target.value })}
        />
      </div>
      <TagInput
        label="Interests (optional)"
        hint="Topics your customers care about. Up to 15."
        placeholder="Coffee"
        tags={draft.interests}
        max={15}
        error={errors['audience.interests']}
        onChange={(interests) => update({ interests })}
      />
    </>
  );
}
