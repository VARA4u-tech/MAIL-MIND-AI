import { FC } from "react";

interface DebugOverlayProps {
  enabled: boolean;
  onToggle: () => void;
}

const DebugOverlay: FC<DebugOverlayProps> = ({ enabled, onToggle }) => {
  return (
    <>
      {/* Toggle button — always visible */}
      <button
        onClick={onToggle}
        className="fixed bottom-4 right-4 z-[9999] font-mono text-[9px] uppercase tracking-widest px-3 py-1.5 border cursor-pointer transition-colors"
        style={{
          borderColor: enabled ? "hsl(0 100% 50%)" : "hsl(0 0% 30%)",
          color: enabled ? "hsl(0 100% 50%)" : "hsl(0 0% 50%)",
          background: enabled ? "hsl(0 100% 50% / 0.1)" : "hsl(0 0% 0% / 0.8)",
        }}
      >
        {enabled ? "■ Debug ON" : "□ Debug OFF"}
      </button>

      {enabled && (
        <style>{`
          /* Bounding boxes for major sections */
          [data-debug="hero"],
          [data-debug="marquee"],
          [data-debug="accordion"] {
            outline: 1px solid hsl(120 100% 50% / 0.4) !important;
            outline-offset: -1px;
            position: relative;
          }

          [data-debug="hero"]::after,
          [data-debug="marquee"]::after,
          [data-debug="accordion"]::after {
            content: attr(data-debug);
            position: absolute;
            top: 2px;
            left: 4px;
            font-family: 'Space Mono', monospace;
            font-size: 8px;
            color: hsl(120 100% 50% / 0.6);
            text-transform: uppercase;
            letter-spacing: 0.15em;
            pointer-events: none;
            z-index: 9998;
          }

          /* Baseline grid overlay */
          [data-debug="hero"]::before,
          [data-debug="marquee"]::before,
          [data-debug="accordion"]::before {
            content: "";
            position: absolute;
            inset: 0;
            pointer-events: none;
            z-index: 9997;
            background-image:
              linear-gradient(hsl(200 100% 50% / 0.06) 1px, transparent 1px),
              linear-gradient(90deg, hsl(200 100% 50% / 0.06) 1px, transparent 1px);
            background-size: 8px 8px;
          }

          /* Highlight all direct children with bounding boxes */
          [data-debug="accordion"] > div {
            outline: 1px dashed hsl(60 100% 50% / 0.2) !important;
          }

          /* Center crosshair on hero */
          [data-debug="hero"] {
            background-image:
              linear-gradient(hsl(0 100% 50% / 0.08) 1px, transparent 1px),
              linear-gradient(90deg, hsl(0 100% 50% / 0.08) 1px, transparent 1px);
            background-size: 50% 50%;
            background-position: center;
          }
        `}</style>
      )}
    </>
  );
};

export default DebugOverlay;