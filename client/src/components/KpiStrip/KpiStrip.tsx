import './KpiStrip.scss';

export interface Kpi {
  label: string;
  value: string;
  detail?: string;
}

interface KpiStripProps {
  items: Kpi[];
  isDimmed?: boolean;
}

/** Headline totals in one ruled row — a strip of instruments, not a grid of cards. */
export default function KpiStrip({ items, isDimmed = false }: KpiStripProps) {
  return (
    <dl className={`kpi-strip${isDimmed ? ' kpi-strip--dimmed' : ''}`}>
      {items.map((item) => (
        <div key={item.label} className="kpi-strip__item">
          <dt className="kpi-strip__label">{item.label}</dt>
          <dd className="kpi-strip__value">{item.value}</dd>
          {item.detail && <dd className="kpi-strip__detail">{item.detail}</dd>}
        </div>
      ))}
    </dl>
  );
}
