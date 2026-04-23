import { FC } from "react";

interface MarqueeProps {
  text: string;
  icon?: string;
}

const Marquee: FC<MarqueeProps> = ({ text, icon = "◼" }) => {
  const items = Array.from({ length: 12 });
  return (
    <div className="w-full overflow-hidden border-y border-primary py-3">
      <div className="animate-marquee flex whitespace-nowrap">
        {items.map((_, i) => (
          <span key={i} className="mx-6 text-xs font-mono uppercase tracking-[0.3em] text-primary flex items-center gap-4">
            {icon} {text} ↗
          </span>
        ))}
      </div>
    </div>
  );
};

export default Marquee;