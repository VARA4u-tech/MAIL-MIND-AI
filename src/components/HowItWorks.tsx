import { FC } from "react";
import { motion } from "framer-motion";
import { Inbox, Brain, Zap } from "lucide-react";

const STEPS = [
  {
    number: "01",
    icon: Inbox,
    title: "Connect Your Inbox",
    description:
      "Paste or connect your email thread. MailMind reads the full context — tone, history, and intent — not just the latest message.",
    tag: "INPUT",
  },
  {
    number: "02",
    icon: Brain,
    title: "AI Analyzes & Classifies",
    description:
      "Our AI detects intent (Reply · Schedule · Ignore), extracts meeting details, and understands exactly what action is needed — in under a second.",
    tag: "PROCESS",
  },
  {
    number: "03",
    icon: Zap,
    title: "Take Action in One Click",
    description:
      "Get a polished draft reply, a bullet-point summary, or a ready-to-send calendar event. Copy it, send it, or regenerate until it's perfect.",
    tag: "OUTPUT",
  },
];

const HowItWorks: FC = () => {
  return (
    <section id="how-it-works" className="py-32 px-4 max-w-6xl mx-auto">
      <div className="mb-16 flex items-baseline justify-between border-b border-primary/20 pb-6">
        <h2
          className="font-display text-primary uppercase leading-none"
          style={{ fontSize: "clamp(36px, 7vw, 96px)" }}
        >
          HOW IT WORKS
        </h2>
        <span className="font-mono text-xs text-primary/40 tracking-widest hidden md:inline">
          [02] PROCESS
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-primary/15">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          return (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.7, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
              className="bg-background p-8 md:p-10 flex flex-col gap-6 group relative overflow-hidden"
            >
              {/* Step number watermark */}
              <span
                className="absolute top-4 right-6 font-display text-primary/5 select-none pointer-events-none"
                style={{ fontSize: "clamp(64px, 10vw, 120px)" }}
                aria-hidden="true"
              >
                {step.number}
              </span>

              {/* Tag */}
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-primary/30">
                {step.tag}
              </span>

              {/* Icon */}
              <div className="w-12 h-12 border border-primary/25 flex items-center justify-center group-hover:border-primary group-hover:bg-primary/5 transition-colors duration-500">
                <Icon className="w-5 h-5 text-primary/60 group-hover:text-primary transition-colors duration-500" />
              </div>

              {/* Title */}
              <h3 className="font-display text-primary text-2xl md:text-3xl uppercase leading-tight">
                {step.title}
              </h3>

              {/* Description */}
              <p className="font-mono text-xs text-primary/50 leading-[1.9] flex-1">
                {step.description}
              </p>

              {/* Bottom connector line */}
              <div className="h-px w-0 group-hover:w-full bg-primary/40 transition-all duration-700 ease-out" />
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};

export default HowItWorks;
