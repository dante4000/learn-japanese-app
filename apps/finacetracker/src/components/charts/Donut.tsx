"use client";

import { useState } from 'react';
import { DetailLink } from '../DetailPanel';
import { detailHref } from '@/lib/details';
import { formatMoney } from '@/lib/format';
interface Slice { label: string; value: number; color: string; key?: string; href?: string }
export function Donut({ slices, total, currency = 'USD', size = 200, month, centerLabel = 'Spent', totalHref }: {
  slices: Slice[]; total: number; currency?: string; size?: number; hrefBase?: string; month?: string; centerLabel?: string; totalHref?: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const stroke = 22, r = (size - stroke - 6) / 2, circumference = 2 * Math.PI * r;
  const positive = slices.filter((s) => s.value > 0);
  const sum = positive.reduce((a, s) => a + s.value, 0) || 1;
  const segments = positive.map((s, i) => ({ ...s, fraction: s.value / sum, offset: positive.slice(0, i).reduce((a, p) => a + p.value / sum * circumference, 0) }));
  const active = hover == null ? null : segments[hover];
  const href = (s: Slice) => s.href ?? (s.key ? detailHref({ metric: 'spending', category: s.key, months: month ? [month] : undefined }) : undefined);
  const selectedHref = active ? href(active) : totalHref ?? (month ? detailHref({ metric: 'spending', months: [month] }) : undefined);
  return <div className="relative max-w-full" title={slices.some((s) => s.value < 0) ? 'Ring: positive category totals. Center: net total including refunds.' : undefined} style={{ width: size, height: size }}>
    <svg width={size} height={size} className="-rotate-90" aria-label={`${centerLabel} by category`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-line)" strokeWidth={stroke} />
      {segments.map((s, i) => {
        const circle = <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={s.color} strokeWidth={hover === i ? stroke + 6 : stroke} strokeDasharray={`${s.fraction * circumference} ${(1 - s.fraction) * circumference}`} strokeDashoffset={-s.offset} opacity={hover == null || hover === i ? 1 : .35} onPointerEnter={() => setHover(i)} onPointerLeave={() => setHover(null)} />;
        return href(s) ? <DetailLink key={i} href={href(s)} onFocus={() => setHover(i)} onBlur={() => setHover(null)} aria-label={`${s.label}: ${formatMoney(s.value, currency)}. Inspect records.`}>{circle}</DetailLink> : <g key={i}>{circle}</g>;
      })}
    </svg>
    <div className="pointer-events-none absolute inset-8 grid place-items-center text-center">
      <div className="min-w-0"><p className="text-xs text-muted">{active?.label ?? centerLabel}</p><p className="tnum text-xl text-cream">{selectedHref ? <DetailLink className="pointer-events-auto" href={selectedHref}>{formatMoney(active?.value ?? total, currency, { cents: false })}</DetailLink> : formatMoney(active?.value ?? total, currency, { cents: false })}</p>{active && <p className="text-xs text-muted">{Math.round(active.fraction * 100)}% of positive totals</p>}</div>
    </div>
  </div>;
}
