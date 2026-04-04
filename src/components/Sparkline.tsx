export default function Sparkline({
  data,
  positive,
  height = 32,
}: {
  data: number[];
  positive: boolean;
  height?: number;
}) {
  if (!data || data.length === 0) return null;
  if (data.length === 1) data = [data[0], data[0]];

  const min = Math.min(...data);
  const max = Math.max(...data);
  const rawRange = max - min;

  // If price change is less than 5% of the average, show mostly flat
  // This prevents micro-variations from looking like wild swings
  const avg = data.reduce((a, b) => a + b, 0) / data.length;
  const minRange = avg * 0.1; // At least 10% of average for visual range
  const range = Math.max(rawRange, minRange) || 1;

  // Center the data in the visual range
  const center = (max + min) / 2;
  const visualMin = center - range / 2;

  const w = height > 50 ? 400 : data.length * 6;
  const pad = 2;

  const points = data
    .map((v, i) => {
      const x = pad + (i / (data.length - 1)) * (w - pad * 2);
      const y = pad + (1 - (v - visualMin) / range) * (height - pad * 2);
      // Clamp y to chart bounds
      const clampedY = Math.max(pad, Math.min(height - pad, y));
      return `${x},${clampedY}`;
    })
    .join(" ");

  const color = positive ? "#22C55E" : "#EF4444";
  const gradId = `spark-${positive ? "g" : "r"}-${height}-${data.length}`;

  const lastY = (() => {
    const v = data[data.length - 1];
    const y = pad + (1 - (v - visualMin) / range) * (height - pad * 2);
    return Math.max(pad, Math.min(height - pad, y));
  })();

  return (
    <svg
      viewBox={`0 0 ${w} ${height}`}
      className="w-full h-auto block"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={height > 50 ? 0.15 : 0.2} />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={`${pad},${height} ${points} ${w - pad},${height}`}
        fill={`url(#${gradId})`}
      />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={height > 50 ? 2.5 : 1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {height > 50 && (
        <>
          <circle cx={w - pad} cy={lastY} r="4" fill={color} />
          <circle cx={w - pad} cy={lastY} r="8" fill={color} opacity="0.2" />
        </>
      )}
    </svg>
  );
}
