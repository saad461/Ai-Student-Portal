'use client';

import React from 'react';

interface RadarData {
  label: string;
  value: number; // 0 to 100
}

interface KnowledgeRadarProps {
  data: RadarData[];
  size?: number;
  className?: string;
}

export function KnowledgeRadar({ data, size = 300, className }: KnowledgeRadarProps) {
  const center = size / 2;
  const radius = (size / 2) * 0.75; // Slightly reduced radius to accommodate labels
  const angleStep = (Math.PI * 2) / data.length;

  const getPoint = (angle: number, value: number) => {
    const factor = (value / 100) * radius;
    return {
      x: center + Math.cos(angle - Math.PI / 2) * factor,
      y: center + Math.sin(angle - Math.PI / 2) * factor,
    };
  };

  // Background levels
  const levels = [20, 40, 60, 80, 100];
  const gridPolygons = levels.map((level) => {
    return data.map((_, i) => {
      const p = getPoint(i * angleStep, level);
      return `${p.x},${p.y}`;
    }).join(' ');
  });

  // Data polygon
  const dataPoints = data.map((d, i) => getPoint(i * angleStep, d.value));
  const dataPath = dataPoints.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <div className={className}>
      <div className="relative flex items-center justify-center w-full max-w-[300px] aspect-square mx-auto">
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="w-full h-full overflow-visible"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Grid Polygons */}
          {gridPolygons.map((points, i) => (
            <polygon
              key={i}
              points={points}
              fill="none"
              stroke="currentColor"
              className="text-muted/20"
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
                className="text-muted/20"
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
            className="transition-all duration-1000 ease-in-out"
          />

          {/* Labels */}
          {data.map((d, i) => {
            const point = getPoint(i * angleStep, 115); // Label placement
            return (
              <text
                key={i}
                x={point.x}
                y={point.y}
                textAnchor="middle"
                className="text-[12px] md:text-[14px] font-black uppercase tracking-tighter fill-muted-foreground"
                style={{ dominantBaseline: 'middle' }}
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
              r="4"
              className="fill-primary shadow-lg"
            />
          ))}
        </svg>
      </div>
    </div>
  );
}
