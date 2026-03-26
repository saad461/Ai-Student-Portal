'use client';

import React from 'react';

interface RadarData {
  label: string;
  value: number; // 0 to 100
}

interface KnowledgeRadarProps {
  data: RadarData[];
  size?: number;
}

export function KnowledgeRadar({ data, size = 300 }: KnowledgeRadarProps) {
  const center = size / 2;
  const radius = (size / 2) * 0.8;
  const angleStep = (Math.PI * 2) / data.length;

  const getPoint = (angle: number, value: number) => {
    const factor = (value / 100) * radius;
    return {
      x: center + Math.cos(angle - Math.PI / 2) * factor,
      y: center + Math.sin(angle - Math.PI / 2) * factor,
    };
  };

  // Background circles
  const levels = [20, 40, 60, 80, 100];
  const gridCircles = levels.map((level) => {
    const points = data.map((_, i) => getPoint(i * angleStep, level));
    return points.map((p) => `${p.x},${p.y}`).join(' ');
  });

  // Data polygon
  const dataPoints = data.map((d, i) => getPoint(i * angleStep, d.value));
  const dataPath = dataPoints.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="overflow-visible">
        {/* Grid lines */}
        {gridCircles.map((points, i) => (
          <polygon
            key={i}
            points={points}
            fill="none"
            stroke="currentColor"
            className="text-muted/30"
            strokeWidth="1"
          />
        ))}

        {/* Axis lines */}
        {data.map((_, i) => {
          const point = getPoint(i * angleStep, 100);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={point.x}
              y2={point.y}
              stroke="currentColor"
              className="text-muted/30"
              strokeWidth="1"
            />
          );
        })}

        {/* Data area */}
        <polygon
          points={dataPath}
          fill="var(--primary)"
          fillOpacity="0.2"
          stroke="var(--primary)"
          strokeWidth="2"
          className="transition-all duration-1000"
        />

        {/* Labels */}
        {data.map((d, i) => {
          const point = getPoint(i * angleStep, 120); // Extra distance for labels
          return (
            <text
              key={i}
              x={point.x}
              y={point.y}
              textAnchor="middle"
              className="text-[10px] font-black uppercase tracking-tighter fill-muted-foreground"
            >
              {d.label}
            </text>
          );
        })}

        {/* Points */}
        {dataPoints.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="3"
            className="fill-primary shadow-xl"
          />
        ))}
      </svg>
    </div>
  );
}
