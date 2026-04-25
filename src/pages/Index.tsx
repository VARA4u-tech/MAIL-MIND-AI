import HeroSection from "@/components/HeroSection";
import Marquee from "@/components/Marquee";
import ScrollRevealText from "@/components/ScrollRevealText";
import FeatureAccordion from "@/components/FeatureAccordion";
import PropertyDemo from "@/components/PropertyDemo";
import DebugOverlay from "@/components/DebugOverlay";
import UseCases from "@/components/UseCases";
import Playground from "@/components/Playground";
import WaitlistForm from "@/components/WaitlistForm";
import DemoModal from "@/components/DemoModal";
import Navbar from "@/components/Navbar";
import LogoCloud from "@/components/LogoCloud";
import { motion, useScroll, useTransform, MotionValue } from "framer-motion";
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
          <SubtitleLine
            key={i}
            text={line}
            progress={scrollYProgress}
            range={[start, end]}
          />
        );
      })}
      <div className="mt-8 flex items-center justify-between w-full max-w-5xl px-4">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-primary" />
          <span className="w-3 h-3 border border-primary" />
          <span className="font-mono text-[10px] text-muted-foreground tracking-widest">
            · SCROLL TO DISCOVER
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-muted-foreground tracking-widest">
            SCROLL TO DISCOVER ·
          </span>
          <span className="w-3 h-3 border border-primary" />
          <span className="w-3 h-3 bg-primary" />
        </div>
      </div>
    </div>
  );
};

const SubtitleLine = ({
  text,
  progress,
  range,
}: {
  text: string;
  progress: MotionValue<number>;
  range: [number, number];
}) => {
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
  <footer className="py-20 border-t border-primary/20 bg-background">
    <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">
      <div className="col-span-1 md:col-span-1">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-2 h-2 bg-primary" />
          <span className="font-display tracking-widest text-primary text-xl uppercase">MailMind</span>
        </div>
        <p className="font-mono text-xs text-primary/50 leading-relaxed mb-6">
          AI-powered email and calendar assistant to help you focus on what actually matters.
        </p>
        <a
          href="https://github.com/VARA4u-tech"
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-xs text-primary/40 hover:text-primary transition-colors"
        >
          Built by VARA❤️.
        </a>
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="font-mono text-[10px] uppercase tracking-widest text-primary/70 mb-2">Product</h3>
        <a href="#features" className="font-mono text-xs text-primary/50 hover:text-primary transition-colors">Features</a>
        <a href="#use-cases" className="font-mono text-xs text-primary/50 hover:text-primary transition-colors">Use Cases</a>
        <a href="#demo" className="font-mono text-xs text-primary/50 hover:text-primary transition-colors">Playground Demo</a>
        <a href="#" className="font-mono text-xs text-primary/50 hover:text-primary transition-colors">Pricing (Soon)</a>
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="font-mono text-[10px] uppercase tracking-widest text-primary/70 mb-2">Company</h3>
        <a href="#" className="font-mono text-xs text-primary/50 hover:text-primary transition-colors">About Us</a>
        <a href="#" className="font-mono text-xs text-primary/50 hover:text-primary transition-colors">Careers</a>
        <a href="#" className="font-mono text-xs text-primary/50 hover:text-primary transition-colors">Contact</a>
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="font-mono text-[10px] uppercase tracking-widest text-primary/70 mb-2">Legal & Social</h3>
        <a href="#" className="font-mono text-xs text-primary/50 hover:text-primary transition-colors">Privacy Policy</a>
        <a href="#" className="font-mono text-xs text-primary/50 hover:text-primary transition-colors">Terms of Service</a>
        <a href="#" className="font-mono text-xs text-primary/50 hover:text-primary transition-colors">Twitter / X</a>
        <a href="#" className="font-mono text-xs text-primary/50 hover:text-primary transition-colors">LinkedIn</a>
      </div>
    </div>
  </footer>
);

const Index = () => {
  const [debugEnabled, setDebugEnabled] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      return window.localStorage.getItem("revelo:debug") === "1";
    } catch {
      return false;
    }
  });
  const [demoOpen, setDemoOpen] = useState(false);

  useEffect(() => {
    try {
      window.localStorage.setItem("revelo:debug", debugEnabled ? "1" : "0");
    } catch {
      // Silence persistence errors
    }
  }, [debugEnabled]);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Navbar />
      <DebugOverlay
        enabled={debugEnabled}
        onToggle={() => setDebugEnabled((v) => !v)}
      />
      <HeroSection onViewDemo={() => setDemoOpen(true)} />
      <LogoCloud />
      <DemoModal open={demoOpen} onClose={() => setDemoOpen(false)} />
      <Marquee text="MAILMIND AI · SMARTER EMAIL, AUTOMATED" />

      <SubtitleSection />

      {/* Choose between section */}
      <section className="py-32 px-4">
        <ScrollRevealText
          className="text-4xl md:text-7xl lg:text-8xl font-display uppercase max-w-6xl mx-auto"
          words={[
            { text: "GENERATE" },
            { text: "SMART," },
            { text: "CONTEXT-AWARE" },
            { text: "REPLIES" },
            { text: "IN" },
            { text: "SECONDS." },
          ]}
        />
      </section>

      {/* Mix section */}
      <section className="py-32 px-4">
        <ScrollRevealText
          className="text-4xl md:text-7xl lg:text-8xl font-display uppercase max-w-6xl mx-auto"
          words={[
            { text: "TURN" },
            { text: "LONG" },
            { text: "threads,", className: "font-serif-italic normal-case" },
            { text: "MEETINGS," },
            { text: "AND" },
            { text: "DECISIONS" },
            { text: "INTO" },
            { text: "CLEAR" },
            { text: "SUMMARIES." },
          ]}
        />
      </section>

      {/* Split text section */}
      <section className="py-32 px-4">
        <ScrollRevealText
          className="text-4xl md:text-7xl lg:text-8xl font-display uppercase max-w-6xl mx-auto"
          words={[
            { text: "DETECT" },
            { text: "INTENT:" },
            { text: "REPLY," },
            { text: "SCHEDULE," },
            { text: "IGNORE." },
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
            { text: "EXTRACT" },
            { text: "MEETINGS," },
            { text: "DATES," },
            { text: "ATTENDEES" },
            { text: "&" },
            { text: "BUILD" },
            { text: "EVENTS" },
            { text: "INSTANTLY." },
          ]}
        />
      </section>

      <Marquee text="MAILMIND AI · SMARTER EMAIL, AUTOMATED" />

      {/* Features */}
      <section className="py-24 px-4">
        <FeatureAccordion />
      </section>

      <UseCases />

      <Playground />

      <WaitlistForm />

      <Marquee text="MAILMIND AI · SMARTER EMAIL, AUTOMATED" />

      <Footer />
    </div>
  );
};

export default Index;
