import { useMemo, useState } from 'react';
import type { CampaignStatus, CampaignWithTotals } from '@shared/types';
import Button from '@/components/Button';
import {
  formatMoney,
  formatNumber,
  formatPercent,
  ratio,
} from '@/lib/format';
import './CampaignTable.scss';

type SortKey = 'name' | 'spend' | 'impressions' | 'clicks' | 'ctr' | 'conversions' | 'cpa';

interface Column {
  key: SortKey;
  label: string;
  numeric: boolean;
  value: (c: CampaignWithTotals) => number | string | null;
  render: (c: CampaignWithTotals) => string;
}

const COLUMNS: Column[] = [
  {
    key: 'spend',
    label: 'Spend',
    numeric: true,
    value: (c) => c.totals.spendCents,
    render: (c) => formatMoney(c.totals.spendCents),
  },
  {
    key: 'impressions',
    label: 'Impressions',
    numeric: true,
    value: (c) => c.totals.impressions,
    render: (c) => formatNumber(c.totals.impressions),
  },
  {
    key: 'clicks',
    label: 'Clicks',
    numeric: true,
    value: (c) => c.totals.clicks,
    render: (c) => formatNumber(c.totals.clicks),
  },
  {
    key: 'ctr',
    label: 'Click rate',
    numeric: true,
    value: (c) => ratio(c.totals.clicks, c.totals.impressions),
    render: (c) => {
      const r = ratio(c.totals.clicks, c.totals.impressions);
      return r === null ? '—' : formatPercent(r);
    },
  },
  {
    key: 'conversions',
    label: 'Conversions',
    numeric: true,
    value: (c) => c.totals.conversions,
    render: (c) => formatNumber(c.totals.conversions),
  },
  {
    key: 'cpa',
    label: 'Cost per conversion',
    numeric: true,
    value: (c) => ratio(c.totals.spendCents, c.totals.conversions),
    render: (c) => {
      const r = ratio(c.totals.spendCents, c.totals.conversions);
      return r === null ? '—' : formatMoney(r);
    },
  },
];

const OBJECTIVE_LABELS = { awareness: 'Awareness', traffic: 'Traffic', conversions: 'Conversions' } as const;

interface CampaignTableProps {
  campaigns: CampaignWithTotals[];
  isDimmed?: boolean;
  onToggleStatus: (id: number, next: CampaignStatus) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

export default function CampaignTable({ campaigns, isDimmed = false, onToggleStatus, onDelete }: CampaignTableProps) {
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({ key: 'spend', dir: 'desc' });
  const [busyId, setBusyId] = useState<number | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);

  const sorted = useMemo(() => {
    const column = COLUMNS.find((c) => c.key === sort.key);
    const get = column ? column.value : (c: CampaignWithTotals) => c.name.toLowerCase();
    const factor = sort.dir === 'asc' ? 1 : -1;
    return [...campaigns].sort((a, b) => {
      const va = get(a);
      const vb = get(b);
      // Missing values (no conversions yet) always sink to the bottom.
      if (va === null) return 1;
      if (vb === null) return -1;
      return va < vb ? -factor : va > vb ? factor : 0;
    });
  }, [campaigns, sort]);

  const toggleSort = (key: SortKey) =>
    setSort((current) =>
      current.key === key
        ? { key, dir: current.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: key === 'name' ? 'asc' : 'desc' }
    );

  const run = async (id: number, action: () => Promise<void>) => {
    setBusyId(id);
    try {
      await action();
    } finally {
      setBusyId(null);
      setConfirmId(null);
    }
  };

  const ariaSort = (key: SortKey) =>
    sort.key === key ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined;

  const sortHeader = (key: SortKey, label: string, numeric: boolean) => (
    <th
      key={key}
      scope="col"
      aria-sort={ariaSort(key)}
      className={`campaign-table__th${numeric ? ' campaign-table__th--num' : ''}`}
    >
      <button type="button" className="campaign-table__sort" onClick={() => toggleSort(key)}>
        {label}
        <span className="campaign-table__sort-icon" aria-hidden="true">
          {sort.key === key ? (sort.dir === 'asc' ? '▲' : '▼') : ''}
        </span>
      </button>
    </th>
  );

  return (
    <div className={`campaign-table${isDimmed ? ' campaign-table--dimmed' : ''}`}>
      <div className="campaign-table__scroll">
        <table className="campaign-table__table">
          <caption className="visually-hidden">All campaigns with totals for the selected range</caption>
          <thead>
            <tr>
              {sortHeader('name', 'Campaign', false)}
              <th scope="col" className="campaign-table__th">
                Status
              </th>
              {COLUMNS.map((c) => sortHeader(c.key, c.label, c.numeric))}
              <th scope="col" className="campaign-table__th">
                <span className="visually-hidden">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((c) => {
              const isBusy = busyId === c.id;
              const next: CampaignStatus = c.status === 'active' ? 'paused' : 'active';
              return (
                <tr key={c.id} className="campaign-table__row">
                  <th scope="row" className="campaign-table__name">
                    <span className="campaign-table__title">{c.name}</span>
                    <span className="campaign-table__objective">{OBJECTIVE_LABELS[c.objective]}</span>
                  </th>
                  <td className="campaign-table__status">
                    <span className={`campaign-table__badge campaign-table__badge--${c.status}`}>
                      <svg className="campaign-table__badge-icon" viewBox="0 0 10 10" aria-hidden="true">
                        {c.status === 'active' ? (
                          <circle cx="5" cy="5" r="4" />
                        ) : (
                          <path d="M2.5 1.5v7M7.5 1.5v7" />
                        )}
                      </svg>
                      {c.status === 'active' ? 'Active' : 'Paused'}
                    </span>
                  </td>
                  {COLUMNS.map((col) => (
                    <td key={col.key} className="campaign-table__num">
                      {col.render(c)}
                    </td>
                  ))}
                  <td className="campaign-table__actions">
                    {confirmId === c.id ? (
                      <>
                        <Button variant="danger" size="sm" isBusy={isBusy} onClick={() => run(c.id, () => onDelete(c.id))}>
                          Delete campaign
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setConfirmId(null)}>
                          Keep
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="secondary"
                          size="sm"
                          isBusy={isBusy}
                          onClick={() => run(c.id, () => onToggleStatus(c.id, next))}
                          aria-label={`${next === 'paused' ? 'Pause' : 'Resume'} ${c.name}`}
                        >
                          {next === 'paused' ? 'Pause' : 'Resume'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setConfirmId(c.id)}
                          aria-label={`Delete ${c.name}`}
                        >
                          Delete
                        </Button>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
