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
      "Progress mode: The animation syncs with the scroll progress of the linked section.",
      "Trigger mode: The animation is triggered when the linked section enters the viewport.",
    ],
  },
  {
    number: "02",
    title: "Styling Freedom",
    details: [
      "Style text however you want: mix weights, fonts, colors, paragraphs — all inside the same text layer.",
      "Full support of responsive text styles with breakpoints and rem sizes.",
    ],
  },
  {
    number: "03",
    title: "Parallel Animation",
    details: [
      "Split text into: Lines, Words or Letters.",
      "Get independent animation controls for each layer.",
      "Parallel animations across layers combine into a synchronized motion experience.",
    ],
  },
  {
    number: "04",
    title: "Animated Properties",
    details: [
      "Animate everything: control mask, color, stroke, opacity, position, scale, blur, rotation, skew — per layer.",
      "Each property supports 'from' and 'to' values with ranges and units.",
    ],
  },
  {
    number: "05",
    title: "Animation Settings",
    details: [
      "Tune it your way: adjust duration, delay, stagger, easing, and origin (start, center, end, edges or random) — per layer.",
      "Choose from 25 easing curve presets.",
    ],
  },
  {
    number: "06",
    title: "...and more",
    details: [
      "Canvas: Preview animations on canvas.",
      "Performance: Only triggers when needed. Zero layout shift. GPU-accelerated.",
      "Accessibility: Text remains selectable, readable, and screen-reader safe.",
      "SEO: Text remains in the DOM with invisible fallback for indexing.",
    ],
  },
];

const FeatureAccordion: FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="w-full max-w-5xl mx-auto">
      {features.map((feature, i) => (
        <div key={i} className="border-t border-primary/30">
          <button
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            className="w-full flex items-center justify-between py-5 px-2 text-left group"
          >
            <div className="flex items-center gap-6">
              <span className="font-mono text-xs text-muted-foreground">[{feature.number}]</span>
              <span className="font-mono text-sm uppercase tracking-widest text-primary">
                {feature.title}
              </span>
            </div>
            <span className="text-primary text-xl transition-transform duration-300" style={{ transform: openIndex === i ? "rotate(45deg)" : "rotate(0deg)" }}>
              ⨁
            </span>
          </button>
          <AnimatePresence>
            {openIndex === i && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="pb-6 px-2 pl-16 space-y-3">
                  {feature.details.map((detail, j) => (
                    <p key={j} className="font-mono text-xs text-muted-foreground leading-relaxed">
                      <span className="text-primary/50 mr-2">//</span>
                      {detail}
                    </p>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
      <div className="border-t border-primary/30" />
    </div>
  );
};

export default FeatureAccordion;