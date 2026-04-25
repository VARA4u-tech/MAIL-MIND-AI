import { motion } from "framer-motion";
import LetterReveal from "./LetterReveal";
import { FC } from "react";

const cases = [
  {
    tag: "REPLY",
    sender: "sarah.lin@acme.co",
    subject: "Re: Q3 marketing budget proposal",
    snippet:
      "Thanks for sending the deck. Quick question on slide 12 — can you walk me through the assumed CAC payback?",
    intent: "Needs response · low urgency",
    suggestion:
      '"Happy to walk through it. Slide 12 assumes a 9-month payback based on Q2 cohorts — I can share the model if useful."',
  },
  {
    tag: "SCHEDULE",
    sender: "david@northwind.io",
    subject: "Discovery call next week?",
    snippet:
      "Would love to chat about the integration. I'm open Tue 2–4pm or Thu morning, your timezone.",
    intent: "Meeting detected · 2 time slots",
    suggestion: "Create calendar event · Tue 2:00 PM or Thu 9:30 AM",
  },
  {
    tag: "IGNORE",
    sender: "newsletter@bytes.dev",
    subject: "🚀 5 frameworks you didn't know you needed",
    snippet:
      "This week we're diving into the latest meta-frameworks shaping the modern web stack…",
    intent: "Promotional · safe to skip",
    suggestion: "Auto-archived after preview",
  },
];

const tagColor: Record<string, string> = {
  REPLY: "bg-primary text-background",
  SCHEDULE: "border border-primary text-primary",
  IGNORE: "border border-primary/30 text-primary/40",
};

const UseCases: FC = () => {
  return (
    <section
      id="use-cases"
      className="py-32 px-4 max-w-6xl mx-auto"
      data-debug="use-cases"
    >
      <div className="mb-16 flex items-baseline justify-between border-b border-primary/20 pb-6">
        <LetterReveal
          text="INBOX, SORTED"
          className="font-display text-primary uppercase leading-none text-[36px] md:text-7xl lg:text-[96px]"
        />
        <span className="font-mono text-xs text-primary/40 tracking-widest hidden md:inline">
          [03] USE CASES
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-primary/15">
        {cases.map((c, i) => (
          <motion.article
            key={c.tag}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{
              duration: 0.6,
              delay: i * 0.08,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="bg-background p-6 md:p-8 flex flex-col gap-4 min-h-[320px] relative group hover:bg-primary/[0.02] transition-colors duration-500 border border-transparent hover:border-primary/20"
          >
            {/* Hover glow effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none bg-[radial-gradient(circle_at_50%_-20%,hsl(0,100%,50%,0.05),transparent_70%)]" />
            <div className="flex items-center justify-between">
              <span
                className={`font-mono text-xs uppercase tracking-[0.25em] px-2.5 py-1 ${tagColor[c.tag]}`}
              >
                {c.tag}
              </span>
              <span className="font-mono text-xs text-primary/30">
                [{String(i + 1).padStart(2, "0")}]
              </span>
            </div>

            <div className="space-y-1">
              <p className="font-mono text-xs text-primary/40 truncate">
                {c.sender}
              </p>
              <p className="font-display text-primary text-xl md:text-2xl leading-tight uppercase tracking-tight group-hover:text-accent transition-colors">
                {c.subject}
              </p>
            </div>

            <p className="font-mono text-sm text-primary/50 leading-[1.7] flex-1">
              {c.snippet}
            </p>

            <div className="border-t border-primary/15 pt-3 space-y-1.5">
              <p className="font-mono text-xs uppercase tracking-widest text-primary/30">
                AI: {c.intent}
              </p>
              <p className="font-mono text-xs text-primary/70 leading-relaxed">
                → {c.suggestion}
              </p>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
};

export default UseCases;
