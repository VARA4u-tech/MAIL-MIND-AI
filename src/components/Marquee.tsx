import { FC } from "react";

interface MarqueeProps {
  text: string;
}

const MarqueeTrack: FC<{ text: string; direction?: "left" | "right" }> = ({
  text,
  direction = "left",
}) => {
  // Double the items so the second half seamlessly replaces the first
  const items = Array.from({ length: 20 });
  const animClass = direction === "left" ? "animate-marquee" : "animate-marquee-reverse";

  return (
    <div className="flex overflow-hidden">
      <div className={`flex shrink-0 ${animClass}`}>
        {items.map((_, i) => (
          <span
            key={i}
            className="flex items-center shrink-0 px-4 gap-3 text-[11px] font-mono uppercase tracking-[0.25em] text-primary whitespace-nowrap"
          >
            <span className="text-[8px]">◼</span>
            {text} ↗
          </span>
        ))}
      </div>
    </div>
  );
};

const Marquee: FC<MarqueeProps> = ({ text }) => {
  return (
    <div className="w-full overflow-hidden border-y border-primary/60 py-2.5 select-none">
      <MarqueeTrack text={text} direction="left" />
    </div>
  );
};

export default Marquee;