import type { Draft, Errors } from '../draft';

export interface StepProps {
  draft: Draft;
  errors: Errors;
  update: (patch: Partial<Draft>) => void;
}
