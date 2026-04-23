import { FC, useEffect, useRef, useState } from "react";

interface MarqueeProps {
  text: string;
}

const MarqueeTrack: FC<{ text: string; direction?: "left" | "right"; speed?: number }> = ({
  text,
  direction = "left",
  speed = 50,
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [itemCount, setItemCount] = useState(30);

  // Dynamically calculate items needed to fill viewport + buffer
  useEffect(() => {
    const measure = () => {
      if (!trackRef.current) return;
      const viewportWidth = window.innerWidth;
      // Each item is roughly 280px wide, we need 2x viewport coverage
      const needed = Math.ceil((viewportWidth * 2.5) / 280);
      setItemCount(Math.max(needed, 20));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const items = Array.from({ length: itemCount });
  const duration = (itemCount * 280) / speed / 2;

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
            className="flex items-center shrink-0 px-6 md:px-8 gap-3 md:gap-4 text-[10px] md:text-[11px] font-mono uppercase tracking-[0.3em] text-primary whitespace-nowrap"
          >
            <span className="text-[6px] md:text-[7px] opacity-80">◼</span>
            <span>{text}</span>
            <span className="text-[10px] md:text-[11px] opacity-60">↗</span>
          </span>
        ))}
      </div>
    </div>
  );
};

const Marquee: FC<MarqueeProps> = ({ text }) => {
  return (
    <div className="w-full overflow-hidden border-y border-primary/40 py-3 md:py-3.5 select-none">
      <MarqueeTrack text={text} direction="left" speed={60} />
    </div>
  );
};

export default Marquee;