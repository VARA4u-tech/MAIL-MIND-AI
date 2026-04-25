import { FC, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Shared timing configuration ───
// Single source of truth for all accordion transitions
const ACCORDION_EASING: [number, number, number, number] = [0.16, 1, 0.3, 1];
const ACCORDION_DURATION = 0.5;
const DETAIL_STAGGER = 0.04;
const DETAIL_DURATION = 0.28;

const heightTransition = {
  duration: ACCORDION_DURATION,
  ease: ACCORDION_EASING,
};

const opacityTransition = {
  duration: ACCORDION_DURATION * 0.7,
  ease: ACCORDION_EASING,
  delay: 0.03,
};

const iconTransition = {
  duration: ACCORDION_DURATION * 0.8,
  ease: ACCORDION_EASING,
};

interface Feature {
  number: string;
  title: string;
  details: string[];
}

const features: Feature[] = [
  {
    number: "01",
    title: "Smart Reply Generation",
    details: [
      "context-aware: drafts professional replies that match the tone, intent, and history of the thread.",
      "one-click regenerate: cycle through alternative responses until the wording feels right.",
    ],
  },
  {
    number: "02",
    title: "Email Summarization",
    details: [
      "long threads, short summaries: condense back-and-forth conversations into a few clear sentences.",
      "key points first: surfaces decisions, action items, and open questions at a glance.",
    ],
  },
  {
    number: "03",
    title: "Intent Detection",
    details: [
      "auto-classified: every email is tagged as Reply, Schedule, or Ignore so your inbox sorts itself.",
      "prioritized queue: focus on what actually needs you and skip the noise.",
    ],
  },
  {
    number: "04",
    title: "Meeting Scheduler",
    details: [
      "auto-extract: pulls dates, times, attendees, and locations directly from the email body.",
      "calendar-ready: turn detected meeting details into a calendar event in a single click.",
    ],
  },
  {
    number: "05",
    title: "How It Works",
    details: [
      "step 1: connect or paste your email content into the assistant.",
      "step 2: the AI analyzes intent, context, and key details from the message.",
      "step 3: receive a summary, a suggested reply, and ready-to-use scheduling actions.",
    ],
  },
  {
    number: "06",
    title: "\u2026and more",
    details: [
      "privacy-first: your email content stays in your control \u2014 no training on your data.",
      "performance: instant suggestions with zero workflow disruption.",
      "accessibility: clean, keyboard-navigable UI that works with screen readers.",
      "extensible: ready to plug into Gmail, Outlook, and your favorite calendar.",
    ],
  },
];

const FeatureAccordion: FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="w-full max-w-4xl mx-auto" data-debug="accordion">
      {features.map((feature, i) => {
        const isOpen = openIndex === i;
        return (
          <div key={i} className="border-t border-primary/15">
            <button
              onClick={() => setOpenIndex(isOpen ? null : i)}
              className="w-full flex items-center justify-between py-5 md:py-6 px-0 text-left group cursor-pointer"
            >
              <div className="flex items-baseline gap-4 md:gap-6">
                <span className="font-mono text-[9px] md:text-[10px] text-primary/30 tabular-nums">
                  [{feature.number}]
                </span>
                <span className="font-mono text-[12px] md:text-[13px] uppercase tracking-[0.18em] text-primary/90">
                  {feature.title}
                </span>
              </div>
              <motion.span
                animate={{ rotate: isOpen ? 45 : 0 }}
                transition={iconTransition}
                className="text-primary/60 text-base md:text-lg leading-none"
              >
                ⨁
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{
                    height: heightTransition,
                    opacity: opacityTransition,
                  }}
                  className="overflow-hidden"
                >
                  <div className="pb-6 md:pb-8 pl-[44px] md:pl-[56px] pr-6 md:pr-10 space-y-2">
                    {feature.details.map((detail, j) => (
                      <motion.p
                        key={j}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: DETAIL_DURATION,
                          delay: j * DETAIL_STAGGER,
                          ease: ACCORDION_EASING,
                        }}
                        className="font-mono text-[10px] md:text-[11px] text-primary/40 leading-[1.8] tracking-wide"
                      >
                        <span className="text-primary/20 mr-2 select-none">//</span>
                        {detail}
                      </motion.p>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
      <div className="border-t border-primary/15" />
    </div>
  );
};

export default FeatureAccordion;