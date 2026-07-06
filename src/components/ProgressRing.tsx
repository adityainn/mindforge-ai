import React from "react";

interface ProgressRingProps {
  radius: number;
  stroke: number;
  progress: number; // 0 to 100
  colorStart?: string;
  colorEnd?: string;
  id?: string;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  radius,
  stroke,
  progress,
  colorStart = "#3b82f6",
  colorEnd = "#8b5cf6",
  id = "progress-ring-grad"
}) => {
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  // Cap progress between 0 and 100
  const safeProgress = Math.min(100, Math.max(0, progress));
  const strokeDashoffset = circumference - (safeProgress / 100) * circumference;

  return (
    <svg height={radius * 2} width={radius * 2} style={{ transform: "rotate(-90deg)" }}>
      <defs>
        <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={colorStart} />
          <stop offset="100%" stopColor={colorEnd} />
        </linearGradient>
      </defs>
      <circle
        stroke="rgba(255, 255, 255, 0.04)"
        fill="transparent"
        strokeWidth={stroke}
        r={normalizedRadius}
        cx={radius}
        cy={radius}
      />
      <circle
        stroke={`url(#${id})`}
        fill="transparent"
        strokeWidth={stroke}
        strokeDasharray={circumference + " " + circumference}
        style={{ 
          strokeDashoffset, 
          transition: "stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1)" 
        }}
        strokeLinecap="round"
        r={normalizedRadius}
        cx={radius}
        cy={radius}
      />
    </svg>
  );
};

export default ProgressRing;
