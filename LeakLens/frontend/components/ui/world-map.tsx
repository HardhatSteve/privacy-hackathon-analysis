"use client";

import { useRef, useState, useEffect, useMemo, useCallback, memo } from "react";
import { motion } from "motion/react";
import DottedMap from "dotted-map";

interface MapProps {
  dots?: Array<{
    start: { lat: number; lng: number; label?: string };
    end: { lat: number; lng: number; label?: string };
  }>;
  lineColor?: string;
}

// Pre-create the map instance outside component to avoid recreation on each render
const map = new DottedMap({ height: 100, grid: "diagonal" });

// Pre-generate the SVG map string (static, doesn't need theme)
const svgMapString = map.getSVG({
  radius: 0.22,
  color: "#FFFFFF40",
  shape: "circle",
  backgroundColor: "transparent",
});

function WorldMap({
  dots = [],
  lineColor = "#0ea5e9",
}: MapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [mounted, setMounted] = useState(false);

  // Only render after mount to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Memoize projection function
  const projectPoint = useCallback((lat: number, lng: number) => {
    const x = (lng + 180) * (800 / 360);
    const y = (90 - lat) * (400 / 180);
    return { x, y };
  }, []);

  // Memoize path creation
  const createCurvedPath = useCallback((
    start: { x: number; y: number },
    end: { x: number; y: number }
  ) => {
    const midX = (start.x + end.x) / 2;
    const midY = Math.min(start.y, end.y) - 50;
    return `M ${start.x} ${start.y} Q ${midX} ${midY} ${end.x} ${end.y}`;
  }, []);

  // Pre-compute all dot positions
  const computedDots = useMemo(() => {
    return dots.map((dot) => ({
      startPoint: projectPoint(dot.start.lat, dot.start.lng),
      endPoint: projectPoint(dot.end.lat, dot.end.lng),
    }));
  }, [dots, projectPoint]);

  // Pre-encode the SVG map (memoized)
  const encodedSvgMap = useMemo(() => {
    return `data:image/svg+xml;utf8,${encodeURIComponent(svgMapString)}`;
  }, []);

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="w-full aspect-[2/1] bg-transparent rounded-lg relative font-sans">
        <div className="h-full w-full opacity-20" />
      </div>
    );
  }

  return (
    <div className="w-full aspect-[2/1] bg-transparent rounded-lg relative font-sans">
      <img
        src={encodedSvgMap}
        className="h-full w-full [mask-image:linear-gradient(to_bottom,transparent,white_10%,white_90%,transparent)] pointer-events-none select-none"
        alt="world map"
        height="495"
        width="1056"
        draggable={false}
      />
      <svg
        ref={svgRef}
        viewBox="0 0 800 400"
        className="w-full h-full absolute inset-0 pointer-events-none select-none"
      >
        <defs>
          <linearGradient id="path-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="white" stopOpacity="0" />
            <stop offset="5%" stopColor={lineColor} stopOpacity="1" />
            <stop offset="95%" stopColor={lineColor} stopOpacity="1" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
        </defs>

        {computedDots.map((computed, i) => (
          <g key={`path-group-${i}`}>
            <motion.path
              d={createCurvedPath(computed.startPoint, computed.endPoint)}
              fill="none"
              stroke="url(#path-gradient)"
              strokeWidth="1"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{
                duration: 1,
                delay: 0.5 * i,
                ease: "easeOut",
              }}
            />
          </g>
        ))}

        {computedDots.map((computed, i) => (
          <g key={`points-group-${i}`}>
            <circle
              cx={computed.startPoint.x}
              cy={computed.startPoint.y}
              r="2"
              fill={lineColor}
            />
            <circle
              cx={computed.startPoint.x}
              cy={computed.startPoint.y}
              r="2"
              fill={lineColor}
              opacity="0.5"
            >
              <animate
                attributeName="r"
                from="2"
                to="8"
                dur="1.5s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                from="0.5"
                to="0"
                dur="1.5s"
                repeatCount="indefinite"
              />
            </circle>
            <circle
              cx={computed.endPoint.x}
              cy={computed.endPoint.y}
              r="2"
              fill={lineColor}
            />
            <circle
              cx={computed.endPoint.x}
              cy={computed.endPoint.y}
              r="2"
              fill={lineColor}
              opacity="0.5"
            >
              <animate
                attributeName="r"
                from="2"
                to="8"
                dur="1.5s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                from="0.5"
                to="0"
                dur="1.5s"
                repeatCount="indefinite"
              />
            </circle>
          </g>
        ))}
      </svg>
    </div>
  );
}

export default memo(WorldMap);
