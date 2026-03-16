const DIAMETER = 18;
const STROKE_WIDTH = 5;

export function Loading({ percent }) {
  const half = DIAMETER / 2;
  const r = half - STROKE_WIDTH / 2;
  const round = 2 * Math.PI * r;

  return (
    <svg
      viewBox={`0 0 ${DIAMETER} ${DIAMETER}`}
      style={{ width: DIAMETER, height: DIAMETER }}
    >
      <circle
        cx={half}
        cy={half}
        r={r}
        fill="none"
        style={{ strokeWidth: STROKE_WIDTH, stroke: "#e6e6e6" }}
      />
      <linearGradient
        id="linearColors"
        x1="0%"
        y1="0%"
        x2="100%"
        y2="0%"
        gradientTransform="rotate(43)"
      >
        <stop
          offset="0%"
          style={{ stopColor: "#97c6f7", stopOpacity: 1 }}
        ></stop>
        <stop
          offset="46%"
          style={{ stopColor: "#97c6f7", stopOpacity: 1 }}
        ></stop>
        <stop
          offset="100%"
          style={{ stopColor: "#97c6f7", stopOpacity: 1 }}
        ></stop>
      </linearGradient>
      <circle
        cx={half}
        cy={half}
        r={r}
        fill="none"
        style={{
          strokeDasharray: `${(round * percent) / 100} ${round}`,
          strokeWidth: STROKE_WIDTH,
          stroke: "url(#linearColors)",
        }}
      />
    </svg>
  );
}

export default Loading;
