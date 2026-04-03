export default function CoinChart({
  data,
  positive,
  height = 180,
}: {
  data: number[];
  positive: boolean;
  height?: number;
}) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const width = 500;
  const pad = 2;

  const points = data
    .map((v, i) => {
      const x = pad + (i / (data.length - 1)) * (width - pad * 2);
      const y = pad + (1 - (v - min) / range) * (height - pad * 2);
      return `${x},${y}`;
    })
    .join(" ");

  const areaPoints = `${pad},${height} ${points} ${width - pad},${height}`;
  const color = positive ? "#22C55E" : "#EF4444";
  const gradId = `chart-grad-${positive ? "g" : "r"}`;

  return (
    <div className="w-full rounded-xl overflow-hidden bg-bg">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto block">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.12" />
            <stop offset="100%" stopColor={color} stopOpacity="0.01" />
          </linearGradient>
        </defs>
        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map((pct) => (
          <line
            key={pct}
            x1={pad}
            y1={height * pct}
            x2={width - pad}
            y2={height * pct}
            stroke="#E5E5E5"
            strokeWidth="0.5"
            strokeDasharray="4 4"
          />
        ))}
        <polygon points={areaPoints} fill={`url(#${gradId})`} />
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* End dot */}
        {data.length > 0 && (
          <>
            <circle
              cx={width - pad}
              cy={pad + (1 - (data[data.length - 1] - min) / range) * (height - pad * 2)}
              r="4"
              fill={color}
            />
            <circle
              cx={width - pad}
              cy={pad + (1 - (data[data.length - 1] - min) / range) * (height - pad * 2)}
              r="8"
              fill={color}
              opacity="0.2"
            />
          </>
        )}
      </svg>
    </div>
  );
}
