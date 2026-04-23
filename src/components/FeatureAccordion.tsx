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
    <div className="w-full max-w-5xl mx-auto">
      {features.map((feature, i) => {
        const isOpen = openIndex === i;
        return (
          <div key={i} className="border-t border-primary/20">
            <button
              onClick={() => setOpenIndex(isOpen ? null : i)}
              className="w-full flex items-center justify-between py-4 px-0 text-left group cursor-pointer"
            >
              <div className="flex items-baseline gap-5">
                <span className="font-mono text-[10px] text-primary/40 tabular-nums">
                  [{feature.number}]
                </span>
                <span className="font-mono text-[13px] uppercase tracking-[0.15em] text-primary">
                  {feature.title}
                </span>
              </div>
              <motion.span
                animate={{ rotate: isOpen ? 45 : 0 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="text-primary text-lg leading-none"
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
                  transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
                  className="overflow-hidden"
                >
                  <div className="pb-5 pl-[52px] pr-8 space-y-2.5">
                    {feature.details.map((detail, j) => (
                      <p
                        key={j}
                        className="font-mono text-[11px] text-primary/50 leading-[1.7] tracking-wide"
                      >
                        <span className="text-primary/25 mr-2 select-none">//</span>
                        {detail}
                      </p>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
      <div className="border-t border-primary/20" />
    </div>
  );
};

export default FeatureAccordion;