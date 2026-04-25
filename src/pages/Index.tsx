import HeroSection from "@/components/HeroSection";
import Marquee from "@/components/Marquee";
import ScrollRevealText from "@/components/ScrollRevealText";
import FeatureAccordion from "@/components/FeatureAccordion";
import PropertyDemo from "@/components/PropertyDemo";
import DebugOverlay from "@/components/DebugOverlay";
import { motion, useScroll, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const SubtitleSection = () => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.8", "start 0.3"],
  });

  const lines = ["YOUR AI-POWERED", "EMAIL & CALENDAR", "ASSISTANT"];

  return (
    <div ref={ref} className="py-32 flex flex-col items-center gap-2">
      {lines.map((line, i) => {
        const start = i / lines.length;
        const end = (i + 1) / lines.length;
        return (
          <SubtitleLine key={i} text={line} progress={scrollYProgress} range={[start, end]} />
        );
      })}
      <div className="mt-8 flex items-center justify-between w-full max-w-5xl px-4">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-primary" />
          <span className="w-3 h-3 border border-primary" />
          <span className="font-mono text-[10px] text-muted-foreground tracking-widest">· SCROLL TO DISCOVER</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-muted-foreground tracking-widest">SCROLL TO DISCOVER ·</span>
          <span className="w-3 h-3 border border-primary" />
          <span className="w-3 h-3 bg-primary" />
        </div>
      </div>
    </div>
  );
};

const SubtitleLine = ({ text, progress, range }: { text: string; progress: any; range: [number, number] }) => {
  const opacity = useTransform(progress, range, [0, 1]);
  const y = useTransform(progress, range, [30, 0]);
  return (
    <motion.div
      style={{ opacity, y }}
      className="font-mono text-xs md:text-sm tracking-[0.5em] text-primary text-center uppercase"
    >
      <div className="border-t border-primary/40 w-full mb-2" />
      {text}
    </motion.div>
  );
};

const Footer = () => (
  <footer className="py-20 flex flex-col items-center gap-4">
    <div className="flex items-center gap-3 font-mono text-xs text-muted-foreground tracking-widest">
      <span>cooked</span>
      <span>and</span>
      <span>served</span>
      <span>by</span>
    </div>
    <a
      href="https://darkroom.engineering/"
      target="_blank"
      rel="noopener noreferrer"
      className="font-mono text-sm text-primary underline underline-offset-4 hover:text-accent transition-colors"
    >
      darkroom.engineering
    </a>
  </footer>
);

const Index = () => {
  const [debugEnabled, setDebugEnabled] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try { return window.localStorage.getItem("revelo:debug") === "1"; } catch { return false; }
  });

  useEffect(() => {
    try { window.localStorage.setItem("revelo:debug", debugEnabled ? "1" : "0"); } catch {}
  }, [debugEnabled]);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <DebugOverlay enabled={debugEnabled} onToggle={() => setDebugEnabled(v => !v)} />
      <HeroSection />
      <Marquee text="MAILMIND AI · SMARTER EMAIL, AUTOMATED" />

      <SubtitleSection />

      {/* Choose between section */}
      <section className="py-32 px-4">
        <ScrollRevealText
          className="text-4xl md:text-7xl lg:text-8xl font-display uppercase max-w-6xl mx-auto"
          words={[
            { text: "GENERATE" }, { text: "SMART," },
            { text: "CONTEXT-AWARE" },
            { text: "REPLIES" }, { text: "IN" },
            { text: "SECONDS." },
          ]}
        />
      </section>

      {/* Mix section */}
      <section className="py-32 px-4">
        <ScrollRevealText
          className="text-4xl md:text-7xl lg:text-8xl font-display uppercase max-w-6xl mx-auto"
          words={[
            { text: "TURN" }, { text: "LONG" },
            { text: "threads,", className: "font-serif-italic normal-case" },
            { text: "MEETINGS," }, { text: "AND" },
            { text: "DECISIONS" },
            { text: "INTO" }, { text: "CLEAR" }, { text: "SUMMARIES." },
          ]}
        />
      </section>

      {/* Split text section */}
      <section className="py-32 px-4">
        <ScrollRevealText
          className="text-4xl md:text-7xl lg:text-8xl font-display uppercase max-w-6xl mx-auto"
          words={[
            { text: "DETECT" }, { text: "INTENT:" },
            { text: "REPLY," }, { text: "SCHEDULE," }, { text: "IGNORE." },
          ]}
        />
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1 }}
          viewport={{ once: true }}
          className="font-mono text-xs md:text-sm text-muted-foreground text-center mt-8 tracking-wider max-w-2xl mx-auto"
        >
          your inbox sorts itself, so you focus only on what matters.
        </motion.p>
      </section>

      <PropertyDemo />

      {/* Easings section */}
      <section className="py-32 px-4">
        <ScrollRevealText
          className="text-4xl md:text-7xl lg:text-8xl font-display uppercase max-w-6xl mx-auto"
          words={[
            { text: "EXTRACT" }, { text: "MEETINGS," },
            { text: "DATES," }, { text: "ATTENDEES" },
            { text: "&" }, { text: "BUILD" }, { text: "EVENTS" },
            { text: "INSTANTLY." },
          ]}
        />
      </section>

      <Marquee text="MAILMIND AI · SMARTER EMAIL, AUTOMATED" />

      {/* Features */}
      <section className="py-24 px-4">
        <FeatureAccordion />
      </section>

      <Marquee text="MAILMIND AI · SMARTER EMAIL, AUTOMATED" />

      <Footer />
    </div>
  );
};

export default Index;
