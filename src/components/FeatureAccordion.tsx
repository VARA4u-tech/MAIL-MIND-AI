import { FC, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Feature {
  number: string;
  title: string;
  details: string[];
}

const features: Feature[] = [
  {
    number: "01",
    title: "Animation Modes",
    details: [
      "progress mode: The animation syncs with the scroll progress of the linked section.",
      "trigger mode: The animation is triggered when the linked section enters the viewport.",
    ],
  },
  {
    number: "02",
    title: "Styling Freedom",
    details: [
      "Style text however you want: mix weights, fonts, colors, paragraphs. All inside the same text layer.",
      "Full support of responsive text styles: enable seamless responsive behaviour with breakpoints and rem sizes.",
    ],
  },
  {
    number: "03",
    title: "Parallel Animation",
    details: [
      "split text into: Lines, Words or Letters.",
      "get independent animation controls for each layer.",
      "Parallel animations across layers combine into a synchronized motion experience.",
    ],
  },
  {
    number: "04",
    title: "Animated Properties",
    details: [
      "animate everything: control Mask, color, stroke, opacity, position, scale, blur, rotation, skew, per layer.",
      "Each property supports \"from\" and \"to\" values with ranges and units.",
    ],
  },
  {
    number: "05",
    title: "Animation Settings",
    details: [
      "tune it your way: Adjust duration, delay, stagger, easing, and origin (start, center, end, edges or random). Again, per layer.",
      "choose from 25 easing curves presets, powered by GSAP.",
    ],
  },
  {
    number: "06",
    title: "\u2026and more",
    details: [
      "canvas: Preview animations on canvas.",
      "performance: Only triggers when needed. Zero layout shift. GPU-accelerated.",
      "accessibility: Text remains selectable, readable, and screen-reader safe.",
      "SEO: Text remains in the DOM, with invisible fallback for indexing.",
    ],
  },
];

const FeatureAccordion: FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="w-full max-w-4xl mx-auto">
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
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
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
                    height: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
                    opacity: { duration: 0.35, ease: "easeOut", delay: 0.05 },
                  }}
                  className="overflow-hidden"
                >
                  <div className="pb-6 md:pb-8 pl-[44px] md:pl-[56px] pr-6 md:pr-10 space-y-2">
                    {feature.details.map((detail, j) => (
                      <motion.p
                        key={j}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: j * 0.06, ease: "easeOut" }}
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