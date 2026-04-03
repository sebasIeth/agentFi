export default function Sparkline({
  data,
  positive,
  height = 32,
}: {
  data: number[];
  positive: boolean;
  height?: number;
}) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = height > 50 ? 400 : data.length * 6;
  const pad = 2;

  const points = data
    .map((v, i) => {
      const x = pad + (i / (data.length - 1)) * (w - pad * 2);
      const y = pad + (1 - (v - min) / range) * (height - pad * 2);
      return `${x},${y}`;
    })
    .join(" ");

  const color = positive ? "#22C55E" : "#EF4444";
  const gradId = `spark-${positive ? "g" : "r"}-${height}`;

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
      {height > 50 && data.length > 0 && (
        <>
          <circle
            cx={w - pad}
            cy={pad + (1 - (data[data.length - 1] - min) / range) * (height - pad * 2)}
            r="4"
            fill={color}
          />
          <circle
            cx={w - pad}
            cy={pad + (1 - (data[data.length - 1] - min) / range) * (height - pad * 2)}
            r="8"
            fill={color}
            opacity="0.2"
          />
        </>
      )}
    </svg>
  );
}
