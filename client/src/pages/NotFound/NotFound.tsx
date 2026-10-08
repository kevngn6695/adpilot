import { ButtonLink } from '@/components/Button';
import './NotFound.scss';

export default function NotFoundPage() {
  return (
    <section className="not-found">
      <h1 className="not-found__title">Page not found</h1>
      <p className="not-found__text">This address doesn’t match any page in AdPilot.</p>
      <ButtonLink to="/">Go to dashboard</ButtonLink>
    </section>
  );
}
