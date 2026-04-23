import { FC, useRef, useEffect, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

const HeroSection: FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const scale = useTransform(scrollYProgress, [0, 0.8], [1, 0.92]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const textY = useTransform(scrollYProgress, [0, 1], [0, -80]);
  // Clip reveal from center outward
  const clipProgress = useTransform(scrollYProgress, [0, 0.4], [1, 0.85]);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section
      ref={ref}
      className="relative h-[100svh] flex items-center justify-center overflow-hidden"
    >
      {/* Background grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(hsl(0 100% 50%) 1px, transparent 1px), linear-gradient(90deg, hsl(0 100% 50%) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Noise overlay */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Radial vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, transparent 40%, hsl(0 0% 0%) 100%)",
        }}
      />

      <motion.div
        style={{ scale, opacity, y: textY }}
        className="relative w-full flex flex-col items-center justify-center px-[1vw]"
      >
        {/* Main title with entrance animation */}
        <motion.h1
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={mounted ? { opacity: 1, scale: 1, y: 0 } : {}}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          className="font-display text-primary select-none leading-[0.82] tracking-[-0.03em] w-full text-center"
          style={{ fontSize: "clamp(72px, 28vw, 520px)" }}
        >
          REVELO
        </motion.h1>

        {/* Subtitle below title */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={mounted ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.8 }}
          className="font-mono text-[9px] md:text-[10px] text-primary/30 uppercase tracking-[0.5em] mt-4 md:mt-6"
        >
          Text Reveal Component
        </motion.p>
      </motion.div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-background to-transparent" />

      {/* Corner markers */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={mounted ? { opacity: 1 } : {}}
        transition={{ duration: 0.6, delay: 1.2 }}
        className="absolute top-6 left-6 md:top-8 md:left-8 flex items-center gap-2"
      >
        <span className="w-2 h-2 bg-primary" />
        <span className="font-mono text-[9px] text-primary/30 tracking-widest uppercase">Revelo</span>
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={mounted ? { opacity: 1 } : {}}
        transition={{ duration: 0.6, delay: 1.2 }}
        className="absolute top-6 right-6 md:top-8 md:right-8 font-mono text-[9px] text-primary/20 tracking-widest"
      >
        v1.0
      </motion.div>
    </section>
  );
};

export default HeroSection;