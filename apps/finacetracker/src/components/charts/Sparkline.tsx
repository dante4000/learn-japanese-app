/** Tiny inline trend line. Pure SVG, no axes. */
export function Sparkline({
  values,
  color = "var(--color-blue)",
  width = 96,
  height = 28,
}: {
  values: (number | null)[];
  color?: string;
  width?: number;
  height?: number;
}) {
  if (values.length < 2)
    return <svg width={width} height={height} aria-hidden />;
  const pad = 3;
  const known = values.filter((v): v is number => v != null);
  if (!known.length) return <svg width={width} height={height} aria-hidden />;
  const max = Math.max(...known);
  const min = Math.min(...known);
  const range = max - min || 1;
  const stepX = (width - pad * 2) / (values.length - 1);
  const y = (v: number) => pad + (1 - (v - min) / range) * (height - pad * 2);
  const pts = values.map((v, i) => v == null ? null : [pad + i * stepX, y(v)] as const);
  const line = pts.map((p, i) => p ? `${i && pts[i - 1] ? "L" : "M"}${p[0]},${p[1]}` : "").join(" ");
  const last = pts[pts.length - 1];
  return (
    <svg width={width} height={height} className="overflow-visible">
      <path d={line} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
      {last && <circle cx={last[0]} cy={last[1]} r={2} fill={color} />}
    </svg>
  );
}
