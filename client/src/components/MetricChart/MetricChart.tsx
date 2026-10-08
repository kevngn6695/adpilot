import { memo, useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent, PointerEvent } from 'react';
import type { Metric, MetricSeries } from '@shared/types';
import { formatDay, formatMetric, METRIC_LABELS } from '@/lib/format';
import { linear, niceMax, spreadLabels } from './scale';
import './MetricChart.scss';

interface MetricChartProps {
  series: MetricSeries[]; // At most 4: the palette is validated for four series.
  metric: Metric;
  isDimmed?: boolean;
}

const HEIGHT = 300;
const TICKS = 4;
const TOOLTIP_W = 240;
const ROW_H = 20;

/** Tracks an element's width so the SVG redraws at real pixel size (crisp 2px lines). */
function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setWidth(Math.round(entry.contentRect.width));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return [ref, width] as const;
}

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function MetricChart({ series, metric, isDimmed = false }: MetricChartProps) {
  const [wrapRef, width] = useWidth<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);
  const [tableOpen, setTableOpen] = useState(false);

  const days = series[0]?.points.map((p) => p.day) ?? [];
  const wide = width >= 620;
  const margin = { top: 16, right: wide ? 176 : 12, bottom: 30, left: 56 };
  const innerW = Math.max(width - margin.left - margin.right, 10);
  const innerH = HEIGHT - margin.top - margin.bottom;

  const yMax = useMemo(
    () => niceMax(Math.max(0, ...series.flatMap((s) => s.points.map((p) => p.value))), TICKS),
    [series]
  );

  const x = linear([0, Math.max(days.length - 1, 1)], [0, innerW]);
  const y = linear([0, yMax], [innerH, 0]);
  const ticks = Array.from({ length: TICKS + 1 }, (_, i) => (yMax / TICKS) * i);

  const paths = series.map((s) =>
    s.points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join('')
  );

  // Direct labels at each line's right end, nudged apart so they never collide.
  const labelYs = spreadLabels(
    series.map((s) => y(s.points.at(-1)?.value ?? 0)),
    18,
    6,
    innerH
  );

  // X labels: first, middle, last day.
  const xLabelIdx = days.length > 2 ? [0, Math.floor((days.length - 1) / 2), days.length - 1] : days.map((_, i) => i);

  const handlePointer = (event: PointerEvent<SVGRectElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - box.left) / box.width;
    setActive(Math.round(Math.min(Math.max(ratio, 0), 1) * (days.length - 1)));
  };

  const handleKey = (event: KeyboardEvent<SVGSVGElement>) => {
    if (!days.length) return;
    const last = days.length - 1;
    const step: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1 };
    if (event.key in step) {
      event.preventDefault();
      setActive((current) => Math.min(Math.max((current ?? last) + (step[event.key] ?? 0), 0), last));
    } else if (event.key === 'Home') {
      setActive(0);
    } else if (event.key === 'End') {
      setActive(last);
    } else if (event.key === 'Escape') {
      setActive(null);
    }
  };

  // Tooltip rows: every series at the hovered day, highest value first.
  const tooltipRows =
    active === null
      ? []
      : series
          .map((s, i) => ({ name: s.name, value: s.points[active]?.value ?? 0, slot: i + 1 }))
          .sort((a, b) => b.value - a.value);
  const tooltipH = 30 + tooltipRows.length * ROW_H + 6;
  const crossX = active === null ? 0 : x(active);
  const tooltipX = crossX + 12 + TOOLTIP_W > innerW + margin.right ? crossX - 12 - TOOLTIP_W : crossX + 12;

  const label = METRIC_LABELS[metric];
  const summary = `${label} per day for ${series.map((s) => s.name).join(', ')}. Use left and right arrow keys to read each day.`;

  return (
    <figure className={`metric-chart${isDimmed ? ' metric-chart--dimmed' : ''}`}>
      <ul className="metric-chart__legend" aria-label="Campaigns in chart">
        {series.map((s, i) => (
          <li key={s.campaignId ?? s.name} className="metric-chart__legend-item">
            <span className={`metric-chart__key metric-chart__key--s${i + 1}`} aria-hidden="true" />
            {s.name}
          </li>
        ))}
      </ul>

      <div ref={wrapRef} className="metric-chart__frame">
        {width > 0 && days.length > 0 && (
          <svg
            className="metric-chart__svg"
            width={width}
            height={HEIGHT}
            viewBox={`0 0 ${width} ${HEIGHT}`}
            role="img"
            aria-label={summary}
            tabIndex={0}
            onKeyDown={handleKey}
            onFocus={() => setActive((current) => current ?? days.length - 1)}
            onBlur={() => setActive(null)}
          >
            <g transform={`translate(${margin.left},${margin.top})`}>
              {ticks.map((tick) => (
                <g key={tick} transform={`translate(0,${y(tick)})`}>
                  <line className={tick === 0 ? 'metric-chart__baseline' : 'metric-chart__grid'} x2={innerW} />
                  <text className="metric-chart__tick" x={-10} dy="0.32em" textAnchor="end">
                    {formatMetric(metric, tick, { short: true })}
                  </text>
                </g>
              ))}

              {xLabelIdx.map((i, k) => (
                <text
                  key={days[i]}
                  className="metric-chart__tick"
                  x={x(i)}
                  y={innerH + 20}
                  textAnchor={k === 0 ? 'start' : k === xLabelIdx.length - 1 ? 'end' : 'middle'}
                >
                  {formatDay(days[i] ?? '')}
                </text>
              ))}

              {paths.map((d, i) => (
                <path key={series[i]?.campaignId ?? i} className={`metric-chart__line metric-chart__line--s${i + 1}`} d={d} />
              ))}

              {wide &&
                series.map((s, i) => {
                  const endY = y(s.points.at(-1)?.value ?? 0);
                  const labelY = labelYs[i] ?? endY;
                  return (
                    <g key={s.campaignId ?? s.name} className="metric-chart__direct">
                      <path
                        className="metric-chart__leader"
                        d={`M${innerW + 4},${endY} L${innerW + 12},${labelY}`}
                      />
                      <text className="metric-chart__direct-label" x={innerW + 16} y={labelY} dy="0.32em">
                        {truncate(s.name, 22)}
                      </text>
                    </g>
                  );
                })}

              {active !== null && (
                <g className="metric-chart__hover" aria-hidden="true">
                  <line className="metric-chart__crosshair" x1={crossX} x2={crossX} y2={innerH} />
                  {series.map((s, i) => (
                    <circle
                      key={s.campaignId ?? s.name}
                      className={`metric-chart__dot metric-chart__dot--s${i + 1}`}
                      cx={crossX}
                      cy={y(s.points[active]?.value ?? 0)}
                      r={4}
                    />
                  ))}

                  <g transform={`translate(${tooltipX},${Math.max(0, Math.min(8, innerH - tooltipH))})`}>
                    <rect className="metric-chart__tooltip" width={TOOLTIP_W} height={tooltipH} rx={6} />
                    <text className="metric-chart__tooltip-title" x={12} y={20}>
                      {formatDay(days[active] ?? '')}
                    </text>
                    {tooltipRows.map((row, k) => (
                      <g key={row.name} transform={`translate(12,${34 + k * ROW_H})`}>
                        <line className={`metric-chart__tooltip-key metric-chart__line--s${row.slot}`} x2={12} y1={6} y2={6} />
                        <text className="metric-chart__tooltip-value" x={20} y={10}>
                          {formatMetric(metric, row.value)}
                        </text>
                        <text className="metric-chart__tooltip-name" x={TOOLTIP_W - 24} y={10} textAnchor="end">
                          {truncate(row.name, 20)}
                        </text>
                      </g>
                    ))}
                  </g>
                </g>
              )}

              <rect
                className="metric-chart__hit"
                width={innerW}
                height={innerH}
                onPointerMove={handlePointer}
                onPointerDown={handlePointer}
                onPointerLeave={() => setActive(null)}
              />
            </g>
          </svg>
        )}
      </div>

      <details className="metric-chart__table-toggle" onToggle={(e) => setTableOpen(e.currentTarget.open)}>
        <summary>Show daily numbers as a table</summary>
        {/* Rendered only when opened: no hidden DOM for 30 days × 4 campaigns until it's wanted. */}
        {tableOpen && (
        <div className="metric-chart__table-scroll">
          <table className="metric-chart__table">
            <caption className="visually-hidden">{label} per day by campaign</caption>
            <thead>
              <tr>
                <th scope="col">Day</th>
                {series.map((s) => (
                  <th key={s.campaignId ?? s.name} scope="col">
                    {s.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {days.map((day, i) => (
                <tr key={day}>
                  <th scope="row">{formatDay(day)}</th>
                  {series.map((s) => (
                    <td key={s.campaignId ?? s.name}>{formatMetric(metric, s.points[i]?.value ?? 0)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </details>
    </figure>
  );
}

export default memo(MetricChart);
