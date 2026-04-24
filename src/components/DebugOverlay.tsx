import { FC, useEffect, useState, useRef } from "react";
import { toPng } from "html-to-image";
import type { MarqueeDebugInfo } from "./Marquee";

interface DebugOverlayProps {
  enabled: boolean;
  onToggle: () => void;
}

// Hero dimension callouts — px offsets to annotate against the reference.
// Tweak freely; these are visual guides only.
const HERO_CALLOUTS = [
  { id: "title-top",    label: "title→top",    side: "top" as const,    valuePx: () => measureHero("title-top") },
  { id: "title-left",   label: "title→left",   side: "left" as const,   valuePx: () => measureHero("title-left") },
  { id: "title-right",  label: "title→right",  side: "right" as const,  valuePx: () => measureHero("title-right") },
  { id: "title-bottom", label: "title→bottom", side: "bottom" as const, valuePx: () => measureHero("title-bottom") },
];

function measureHero(kind: string): number {
  const hero = document.querySelector('[data-debug="hero"]') as HTMLElement | null;
  const title = hero?.querySelector("h1") as HTMLElement | null;
  if (!hero || !title) return 0;
  const h = hero.getBoundingClientRect();
  const t = title.getBoundingClientRect();
  switch (kind) {
    case "title-top":    return Math.round(t.top - h.top);
    case "title-bottom": return Math.round(h.bottom - t.bottom);
    case "title-left":   return Math.round(t.left - h.left);
    case "title-right":  return Math.round(h.right - t.right);
  }
  return 0;
}

// Read the live clip-path inset() values from the hero background layer.
// Returns pixel offsets for each edge (top/right/bottom/left) and the hero rect.
function measureRevealEdges(): {
  rect: DOMRect;
  topPx: number;
  rightPx: number;
  bottomPx: number;
  leftPx: number;
} | null {
  const hero = document.querySelector('[data-debug="hero"]') as HTMLElement | null;
  if (!hero) return null;
  const rect = hero.getBoundingClientRect();
  // The clipped layer is the first child div with inline clipPath
  const layer = hero.querySelector('div[style*="clip-path"]') as HTMLElement | null;
  const cp = layer?.style.clipPath || "inset(0% 0% 0% 0%)";
  const m = cp.match(/inset\(([\d.]+)%\s+([\d.]+)%\s+([\d.]+)%\s+([\d.]+)%\)/);
  const [t, r, b, l] = m
    ? [parseFloat(m[1]), parseFloat(m[2]), parseFloat(m[3]), parseFloat(m[4])]
    : [0, 0, 0, 0];
  return {
    rect,
    topPx: Math.round((t / 100) * rect.height),
    rightPx: Math.round((r / 100) * rect.width),
    bottomPx: Math.round((b / 100) * rect.height),
    leftPx: Math.round((l / 100) * rect.width),
  };
}

const DebugOverlay: FC<DebugOverlayProps> = ({ enabled, onToggle }) => {
  const [marquee, setMarquee] = useState<MarqueeDebugInfo | null>(null);
  const [callouts, setCallouts] = useState<Record<string, number>>({});
  const [edges, setEdges] = useState<ReturnType<typeof measureRevealEdges>>(null);
  const [exporting, setExporting] = useState(false);
  const rafRef = useRef<number>();

  // Subscribe to marquee debug events
  useEffect(() => {
    const handler = (e: Event) => setMarquee((e as CustomEvent<MarqueeDebugInfo>).detail);
    window.addEventListener("marquee:debug", handler);
    return () => window.removeEventListener("marquee:debug", handler);
  }, []);

  // Recompute hero callouts on resize/scroll while debug is enabled
  useEffect(() => {
    if (!enabled) return;
    const recompute = () => {
      const next: Record<string, number> = {};
      for (const c of HERO_CALLOUTS) next[c.id] = c.valuePx();
      setCallouts(next);
      setEdges(measureRevealEdges());
    };
    const tick = () => {
      recompute();
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [enabled]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const dataUrl = await toPng(document.body, {
        cacheBust: true,
        pixelRatio: window.devicePixelRatio || 1,
        filter: (node) => {
          // Exclude the toolbar itself from the export
          if (!(node instanceof HTMLElement)) return true;
          return !node.dataset?.debugToolbar;
        },
      });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `revelo-debug-${Date.now()}.png`;
      a.click();
    } catch (err) {
      console.error("[DebugOverlay] screenshot failed", err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      {/* Toolbar — always visible */}
      <div
        data-debug-toolbar="true"
        className="fixed bottom-4 right-4 z-[9999] flex flex-col items-end gap-2 font-mono text-[9px] uppercase tracking-widest"
      >
        {enabled && marquee && (
          <div
            className="px-3 py-2 border bg-background/90 backdrop-blur-sm leading-relaxed"
            style={{ borderColor: "hsl(120 100% 50% / 0.5)", color: "hsl(120 100% 70%)" }}
          >
            <div>marquee.bp     {marquee.bpKey}</div>
            <div>marquee.items  {marquee.itemCount}</div>
            <div>marquee.gap    {marquee.gapClass}</div>
            <div>marquee.dur    {marquee.duration.toFixed(2)}s</div>
          </div>
        )}
        {enabled && (
          <button
            onClick={handleExport}
            disabled={exporting}
            className="px-3 py-1.5 border cursor-pointer transition-colors disabled:opacity-50"
            style={{
              borderColor: "hsl(200 100% 50%)",
              color: "hsl(200 100% 70%)",
              background: "hsl(200 100% 50% / 0.1)",
            }}
          >
            {exporting ? "⏳ Exporting…" : "⬇ Export screenshot"}
          </button>
        )}
        <button
          onClick={onToggle}
          className="px-3 py-1.5 border cursor-pointer transition-colors"
          style={{
            borderColor: enabled ? "hsl(0 100% 50%)" : "hsl(0 0% 30%)",
            color: enabled ? "hsl(0 100% 50%)" : "hsl(0 0% 50%)",
            background: enabled ? "hsl(0 100% 50% / 0.1)" : "hsl(0 0% 0% / 0.8)",
          }}
        >
          {enabled ? "■ Debug ON" : "□ Debug OFF"}
        </button>
      </div>

      {enabled && (
        <>
          {/* Hero dimension callouts (numbered px badges) */}
          <div className="pointer-events-none fixed inset-0 z-[9996]">
            {HERO_CALLOUTS.map((c, i) => {
              const v = callouts[c.id] ?? 0;
              const hero = document.querySelector('[data-debug="hero"]') as HTMLElement | null;
              const title = hero?.querySelector("h1") as HTMLElement | null;
              if (!title) return null;
              const t = title.getBoundingClientRect();
              const style: React.CSSProperties = { position: "absolute" };
              if (c.side === "top")    { style.left = t.left + t.width / 2; style.top = Math.max(8, t.top - 18); style.transform = "translateX(-50%)"; }
              if (c.side === "bottom") { style.left = t.left + t.width / 2; style.top = t.bottom + 4; style.transform = "translateX(-50%)"; }
              if (c.side === "left")   { style.left = Math.max(4, t.left - 60); style.top = t.top + t.height / 2; style.transform = "translateY(-50%)"; }
              if (c.side === "right")  { style.left = t.right + 6; style.top = t.top + t.height / 2; style.transform = "translateY(-50%)"; }
              return (
                <div
                  key={c.id}
                  style={{
                    ...style,
                    fontFamily: "Space Mono, monospace",
                    fontSize: 9,
                    padding: "2px 5px",
                    border: "1px solid hsl(60 100% 50% / 0.7)",
                    color: "hsl(60 100% 70%)",
                    background: "hsl(0 0% 0% / 0.8)",
                    letterSpacing: "0.1em",
                    whiteSpace: "nowrap",
                  }}
                >
                  <span style={{ opacity: 0.5 }}>{i + 1}·</span> {c.label} {v}px
                </div>
              );
            })}
          </div>

          <style>{`
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
            [data-debug="accordion"] > div {
              outline: 1px dashed hsl(60 100% 50% / 0.2) !important;
            }
            [data-debug="hero"] {
              background-image:
                linear-gradient(hsl(0 100% 50% / 0.08) 1px, transparent 1px),
                linear-gradient(90deg, hsl(0 100% 50% / 0.08) 1px, transparent 1px);
              background-size: 50% 50%;
              background-position: center;
            }
          `}</style>
        </>
      )}
    </>
  );
};

export default DebugOverlay;