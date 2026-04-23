import HeroSection from "@/components/HeroSection";
import Marquee from "@/components/Marquee";
import ScrollRevealText from "@/components/ScrollRevealText";
import FeatureAccordion from "@/components/FeatureAccordion";
import PropertyDemo from "@/components/PropertyDemo";
import DebugOverlay from "@/components/DebugOverlay";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState } from "react";

const SubtitleSection = () => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.8", "start 0.3"],
  });

  const lines = ["THE ULTIMATE", "TEXT-REVEAL COMPONENT", "FOR FRAMER"];

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
  const [debugEnabled, setDebugEnabled] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <DebugOverlay enabled={debugEnabled} onToggle={() => setDebugEnabled(v => !v)} />
      <HeroSection />
      <Marquee text="GET REVELO ON FRAMER MARKETPLACE" />

      <SubtitleSection />

      {/* Choose between section */}
      <section className="py-32 px-4">
        <ScrollRevealText
          className="text-4xl md:text-7xl lg:text-8xl font-display uppercase max-w-6xl mx-auto"
          words={[
            { text: "CHOOSE" }, { text: "BETWEEN" },
            { text: "SCROLL" }, { text: "PROGRESS" },
            { text: "OR" },
            { text: "TRIGGER-BASED" },
            { text: "ANIMATIONS." },
          ]}
        />
      </section>

      {/* Mix section */}
      <section className="py-32 px-4">
        <ScrollRevealText
          className="text-4xl md:text-7xl lg:text-8xl font-display uppercase max-w-6xl mx-auto"
          words={[
            { text: "YOU'RE" }, { text: "FREE" },
            { text: "TO" }, { text: "MIX" },
            { text: "Fonts,", className: "font-serif-italic normal-case" },
            { text: "STYLES," }, { text: "COLORS," },
            { text: "OR" }, { text: "PARAGRAPHS" },
            { text: "HOWEVER" }, { text: "YOU" }, { text: "WANT." },
          ]}
        />
      </section>

      {/* Split text section */}
      <section className="py-32 px-4">
        <ScrollRevealText
          className="text-4xl md:text-7xl lg:text-8xl font-display uppercase max-w-6xl mx-auto"
          words={[
            { text: "SPLIT" }, { text: "TEXT" }, { text: "BY" },
            { text: "LINES," }, { text: "WORDS," }, { text: "LETTERS," },
          ]}
        />
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1 }}
          viewport={{ once: true }}
          className="font-mono text-xs md:text-sm text-muted-foreground text-center mt-8 tracking-wider max-w-2xl mx-auto"
        >
          with their own motion, all playing in sync.
        </motion.p>
      </section>

      <PropertyDemo />

      {/* Easings section */}
      <section className="py-32 px-4">
        <ScrollRevealText
          className="text-4xl md:text-7xl lg:text-8xl font-display uppercase max-w-6xl mx-auto"
          words={[
            { text: "APPLY" }, { text: "CUSTOM" },
            { text: "EASINGS," }, { text: "STAGGER" }, { text: "ORIGIN," },
            { text: "DURATION" }, { text: "&" }, { text: "DELAY." },
          ]}
        />
      </section>

      <Marquee text="GET REVELO ON FRAMER MARKETPLACE" />

      {/* Features */}
      <section className="py-24 px-4">
        <FeatureAccordion />
      </section>

      <Marquee text="GET REVELO ON FRAMER MARKETPLACE" />

      <Footer />
    </div>
  );
};

export default Index;
