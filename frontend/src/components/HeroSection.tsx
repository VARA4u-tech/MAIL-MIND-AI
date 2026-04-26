import { FC, useRef, useEffect, useState } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useMotionValueEvent,
} from "framer-motion";

// ============================================================
// Hero clip-path keyframe timings — exposed for quick iteration
// Each stop is [scrollProgress, insetPercent] for top/right/bottom/left.
// Pattern: REVEAL (open from edges) → HOLD (stay open) → CLOSE (re-mask edges)
// ============================================================
const HERO_CLIP_KEYFRAMES = {
  // scroll progress stops: start, end-of-reveal, start-of-close, full-close
  progress: [0, 0.08, 0.45, 0.9] as const,
  // inset % at each stop, in order: [reveal-start, reveal-end, hold-end, close]
  top: [0, 0, 0, 18] as number[],
  right: [0, 0, 0, 12] as number[],
  bottom: [0, 0, 0, 22] as number[],
  left: [0, 0, 0, 12] as number[],
};

interface HeroSectionProps {
  onViewDemo?: () => void;
}

const HeroSection: FC<HeroSectionProps> = ({ onViewDemo }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [clipValue, setClipValue] = useState("inset(0% 0% 0% 0%)");
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const scale = useTransform(scrollYProgress, [0, 0.8], [1, 0.92]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const textY = useTransform(scrollYProgress, [0, 1], [0, -80]);

  // Keyframed scroll-linked clip-path: reveal → hold → close
  const K = HERO_CLIP_KEYFRAMES;
  const clipTop = useTransform(scrollYProgress, [...K.progress], K.top);
  const clipRight = useTransform(scrollYProgress, [...K.progress], K.right);
  const clipBottom = useTransform(scrollYProgress, [...K.progress], K.bottom);
  const clipLeft = useTransform(scrollYProgress, [...K.progress], K.left);

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Sync clip-path to a CSS string - DISABLED ON MOBILE FOR PERFORMANCE
  useMotionValueEvent(clipTop, "change", () => {
    if (window.innerWidth < 768) return; // Skip heavy math on mobile
    const t = clipTop.get();
    const r = clipRight.get();
    const b = clipBottom.get();
    const l = clipLeft.get();
    setClipValue(`inset(${t}% ${r}% ${b}% ${l}%)`);
  });

  return (
    <section
      ref={ref}
      className="relative h-[100svh] flex items-center justify-center overflow-hidden"
      data-debug="hero"
    >
      {/* Clip-path masked background layer - HIDDEN ON MOBILE TO PREVENT LAG */}
      {!isMobile && (
        <div
          className="absolute inset-0 pointer-events-none transition-[clip-path] duration-100"
          style={{
            clipPath: clipValue,
            willChange: "clip-path",
          }}
        >
          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.1]"
            style={{
              backgroundImage:
                "linear-gradient(hsl(0 100% 50%) 1px, transparent 1px), linear-gradient(90deg, hsl(0 100% 50%) 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          />
          {/* Red glow at center */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 70% 50% at 50% 50%, hsl(0 100% 50% / 0.1) 0%, transparent 70%)",
            }}
          />
        </div>
      )}

      {/* Noise overlay - REMOVED ON MOBILE (GPU HEAVY) */}
      {!isMobile && (
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          }}
        />
      )}

      {/* Radial vignette — softened so edges don't go pitch black */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 30%, hsl(0 0% 3% / 0.85) 100%)",
        }}
      />

      <motion.div
        style={{ scale, opacity, y: textY }}
        className="relative w-full flex flex-col items-center justify-center px-[1vw] py-12"
      >
        {/* Main title with entrance animation */}
        <motion.h1
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={
            mounted
              ? {
                  opacity: 1,
                  scale: 1,
                  y: [0, -8, 0], // Gentle floating loop
                }
              : {}
          }
          transition={{
            opacity: { duration: 1.2, delay: 0.2 },
            scale: { duration: 1.2, delay: 0.2 },
            y: { duration: 4, repeat: Infinity, ease: "easeInOut" }, // Slow breathing
          }}
          className="font-display text-primary select-none leading-[0.95] tracking-tight w-full text-center"
          style={{ fontSize: "clamp(32px, 13vw, 440px)" }}
        >
          MAILMIND
        </motion.h1>

        {/* Subtitle below title */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={mounted ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.8 }}
          className="font-mono text-[9px] md:text-sm text-primary/60 uppercase tracking-[0.15em] md:tracking-[0.4em] mt-3 md:mt-6 px-4 text-center"
        >
          AI Email &amp; Calendar Assistant
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={mounted ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: "easeOut", delay: 1 }}
          className="flex flex-col sm:flex-row items-center gap-3 mt-8 md:mt-10"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            animate={isMobile ? { scale: [1, 1.02, 1] } : {}} // Subtle pulse for mobile
            transition={
              isMobile
                ? { duration: 3, repeat: Infinity, ease: "easeInOut" }
                : {}
            }
            onClick={() => {
              document
                .getElementById("playground")
                ?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            className="font-mono text-[11px] uppercase tracking-[0.25em] bg-primary text-background px-5 py-3 hover:bg-primary/90 transition-colors cursor-pointer"
          >
            Get Started →
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onViewDemo}
            className="font-mono text-[11px] uppercase tracking-[0.25em] border border-primary/60 text-primary px-5 py-3 hover:border-primary hover:bg-primary/10 transition-colors cursor-pointer"
          >
            View Demo
          </motion.button>
        </motion.div>
      </motion.div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-background to-transparent" />

      {/* Version marker — bottom right to avoid navbar overlap */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={mounted ? { opacity: 1 } : {}}
        transition={{ duration: 0.6, delay: 1.2 }}
        className="absolute bottom-6 right-6 md:bottom-8 md:right-8 font-mono text-[9px] text-primary/20 tracking-widest"
      >
        v1.0
      </motion.div>
    </section>
  );
};

export default HeroSection;
