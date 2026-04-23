import { FC, useEffect, useRef, useState, useMemo } from "react";

interface MarqueeProps {
  text: string;
}

// Breakpoint-locked config: item count & spacing locked per breakpoint
// so nothing shifts mid-scroll or during resize within the same breakpoint
interface BreakpointConfig {
  itemCount: number;
  gapClass: string;
  textClass: string;
  itemWidthEstimate: number;
}

function getBreakpointConfig(width: number): BreakpointConfig {
  if (width >= 1280) {
    return { itemCount: 24, gapClass: "px-10 gap-5", textClass: "text-[11px] tracking-[0.32em]", itemWidthEstimate: 320 };
  }
  if (width >= 1024) {
    return { itemCount: 20, gapClass: "px-8 gap-4", textClass: "text-[11px] tracking-[0.3em]", itemWidthEstimate: 290 };
  }
  if (width >= 768) {
    return { itemCount: 18, gapClass: "px-7 gap-4", textClass: "text-[10px] tracking-[0.28em]", itemWidthEstimate: 260 };
  }
  return { itemCount: 16, gapClass: "px-5 gap-3", textClass: "text-[9px] tracking-[0.25em]", itemWidthEstimate: 220 };
}

function getBreakpointKey(width: number): string {
  if (width >= 1280) return "xl";
  if (width >= 1024) return "lg";
  if (width >= 768) return "md";
  return "sm";
}

const MarqueeTrack: FC<{ text: string; direction?: "left" | "right"; speed?: number }> = ({
  text,
  direction = "left",
  speed = 50,
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [bpKey, setBpKey] = useState(() => getBreakpointKey(typeof window !== "undefined" ? window.innerWidth : 1024));
  
  // Only update when crossing a breakpoint boundary, not on every pixel resize
  useEffect(() => {
    const onResize = () => {
      const newKey = getBreakpointKey(window.innerWidth);
      setBpKey(prev => prev !== newKey ? newKey : prev);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const config = useMemo(() => getBreakpointConfig(
    bpKey === "xl" ? 1280 : bpKey === "lg" ? 1024 : bpKey === "md" ? 768 : 375
  ), [bpKey]);

  const items = Array.from({ length: config.itemCount });
  // Duration based on total track width / speed — half because animation moves -50%
  const duration = (config.itemCount * config.itemWidthEstimate) / speed / 2;

  return (
    <div className="flex overflow-hidden whitespace-nowrap">
      <div
        ref={trackRef}
        className="flex shrink-0"
        style={{
          animation: `${direction === "left" ? "marquee" : "marquee-reverse"} ${duration}s linear infinite`,
          willChange: "transform",
        }}
      >
        {items.map((_, i) => (
          <span
            key={i}
            className={`flex items-center shrink-0 ${config.gapClass} ${config.textClass} font-mono uppercase text-primary whitespace-nowrap`}
          >
            <span className="text-[6px] opacity-70">◼</span>
            <span>{text}</span>
            <span className="opacity-50">↗</span>
          </span>
        ))}
      </div>
    </div>
  );
};

const Marquee: FC<MarqueeProps> = ({ text }) => {
  return (
    <div className="w-full overflow-hidden border-y border-primary/40 py-3 md:py-3.5 select-none" data-debug="marquee">
      <MarqueeTrack text={text} direction="left" speed={60} />
    </div>
  );
};

export default Marquee;