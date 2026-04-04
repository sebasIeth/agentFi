export default function CoinChart({
  data,
  positive,
  height = 180,
}: {
  data: number[];
  positive: boolean;
  height?: number;
}) {
  if (!data || data.length === 0) {
    return (
      <div className="w-full rounded-xl overflow-hidden bg-bg flex items-center justify-center" style={{ height }}>
        <span className="text-[12px] text-fg-tertiary">No price data yet</span>
      </div>
    );
  }

  if (data.length === 1) data = [data[0], data[0]];

  const min = Math.min(...data);
  const max = Math.max(...data);
  const rawRange = max - min;
  const avg = data.reduce((a, b) => a + b, 0) / data.length;
  const minRange = avg * 0.1;
  const range = Math.max(rawRange, minRange) || 1;
  const center = (max + min) / 2;
  const visualMin = center - range / 2;

  const width = 500;
  const pad = 2;

  const points = data
    .map((v, i) => {
      const x = pad + (i / (data.length - 1)) * (width - pad * 2);
      const y = pad + (1 - (v - visualMin) / range) * (height - pad * 2);
      const clampedY = Math.max(pad, Math.min(height - pad, y));
      return `${x},${clampedY}`;
    })
    .join(" ");

  const areaPoints = `${pad},${height} ${points} ${width - pad},${height}`;
  const color = positive ? "#22C55E" : "#EF4444";
  const gradId = `chart-grad-${positive ? "g" : "r"}-${data.length}`;

  const lastY = (() => {
    const v = data[data.length - 1];
    const y = pad + (1 - (v - visualMin) / range) * (height - pad * 2);
    return Math.max(pad, Math.min(height - pad, y));
  })();

  return (
    <div className="w-full rounded-xl overflow-hidden bg-bg">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto block">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.12" />
            <stop offset="100%" stopColor={color} stopOpacity="0.01" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((pct) => (
          <line key={pct} x1={pad} y1={height * pct} x2={width - pad} y2={height * pct} stroke="#E5E5E5" strokeWidth="0.5" strokeDasharray="4 4" />
        ))}
        <polygon points={areaPoints} fill={`url(#${gradId})`} />
        <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={width - pad} cy={lastY} r="4" fill={color} />
        <circle cx={width - pad} cy={lastY} r="8" fill={color} opacity="0.2" />
      </svg>
    </div>
  );
}
