import { FC, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface PropertyConfig {
  name: string;
  preview: {
    initial: Record<string, any>;
    animate: Record<string, any>;
    transition?: Record<string, any>;
  };
  label: string;
}

const properties: PropertyConfig[] = [
  {
    name: "POSITION",
    label: "translateY",
    preview: {
      initial: { y: 40 },
      animate: { y: [40, -40, 40] },
      transition: { duration: 2, repeat: Infinity, ease: "easeInOut" },
    },
  },
  {
    name: "SCALE",
    label: "scale",
    preview: {
      initial: { scale: 0.6 },
      animate: { scale: [0.6, 1.2, 0.6] },
      transition: { duration: 2, repeat: Infinity, ease: "easeInOut" },
    },
  },
  {
    name: "BLUR",
    label: "blur",
    preview: {
      initial: { filter: "blur(8px)" },
      animate: { filter: ["blur(8px)", "blur(0px)", "blur(8px)"] },
      transition: { duration: 2.5, repeat: Infinity, ease: "easeInOut" },
    },
  },
  {
    name: "SKEW",
    label: "skewX",
    preview: {
      initial: { skewX: -15 },
      animate: { skewX: [-15, 15, -15] },
      transition: { duration: 2, repeat: Infinity, ease: "easeInOut" },
    },
  },
  {
    name: "OPACITY",
    label: "opacity",
    preview: {
      initial: { opacity: 0.1 },
      animate: { opacity: [0.1, 1, 0.1] },
      transition: { duration: 2, repeat: Infinity, ease: "easeInOut" },
    },
  },
  {
    name: "COLOR",
    label: "color",
    preview: {
      initial: { color: "hsl(0, 100%, 50%)" },
      animate: {
        color: [
          "hsl(0, 100%, 50%)",
          "hsl(0, 100%, 25%)",
          "hsl(0, 80%, 70%)",
          "hsl(0, 100%, 50%)",
        ],
      },
      transition: { duration: 3, repeat: Infinity, ease: "easeInOut" },
    },
  },
  {
    name: "STROKE",
    label: "stroke",
    preview: {
      initial: {
        WebkitTextStroke: "2px hsl(0, 100%, 50%)",
        color: "transparent",
      },
      animate: {
        WebkitTextStroke: [
          "2px hsl(0, 100%, 50%)",
          "1px hsl(0, 100%, 30%)",
          "3px hsl(0, 100%, 50%)",
        ],
        color: "transparent",
      },
      transition: { duration: 2, repeat: Infinity, ease: "easeInOut" },
    },
  },
  {
    name: "ROTATION",
    label: "rotate",
    preview: {
      initial: { rotate: -8 },
      animate: { rotate: [-8, 8, -8] },
      transition: { duration: 2.5, repeat: Infinity, ease: "easeInOut" },
    },
  },
];

const PropertyDemo: FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = properties[activeIndex];

  return (
    <div className="py-24 max-w-5xl mx-auto px-4">
      {/* Header */}
      <h2
        className="font-display text-primary text-center uppercase mb-16"
        style={{ fontSize: "clamp(32px, 6vw, 80px)" }}
      >
        SEE IT IN ACTION
      </h2>

      {/* Property selector tabs */}
      <div className="flex flex-wrap justify-center gap-2 mb-12">
        {properties.map((prop, i) => (
          <button
            key={prop.name}
            onClick={() => setActiveIndex(i)}
            className={`
              font-mono text-[11px] uppercase tracking-[0.2em] px-4 py-2 border transition-all duration-200 cursor-pointer
              ${
                i === activeIndex
                  ? "border-primary bg-primary text-background"
                  : "border-primary/30 text-primary/60 hover:border-primary/60 hover:text-primary"
              }
            `}
          >
            {prop.name}
          </button>
        ))}
      </div>

      {/* Preview area */}
      <div className="relative border border-primary/20 h-[280px] md:h-[340px] flex items-center justify-center overflow-hidden">
        {/* Grid background */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(hsl(0 100% 50%) 1px, transparent 1px), linear-gradient(90deg, hsl(0 100% 50%) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Crosshair */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-primary/10" />
        <div className="absolute top-1/2 left-0 right-0 h-px bg-primary/10" />

        {/* Active property label */}
        <div className="absolute top-4 left-4 font-mono text-[10px] text-primary/30 uppercase tracking-widest">
          {active.label}
        </div>
        <div className="absolute top-4 right-4 font-mono text-[10px] text-primary/30">
          ∞ loop
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={active.name}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.span
              className="font-display text-primary text-5xl md:text-7xl lg:text-8xl select-none inline-block"
              initial={active.preview.initial}
              animate={active.preview.animate}
              transition={active.preview.transition}
            >
              MAILMIND
            </motion.span>
          </motion.div>
        </AnimatePresence>

        {/* Bottom info bar */}
        <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
          <span className="font-mono text-[9px] text-primary/20 uppercase tracking-widest">
            property: {active.name}
          </span>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="font-mono text-[9px] text-primary/30">
              ANIMATING
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDemo;