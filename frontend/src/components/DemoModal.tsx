import { FC, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface DemoModalProps {
  open: boolean;
  onClose: () => void;
}

const DemoModal: FC<DemoModalProps> = ({ open, onClose }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/85 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.96, y: 12, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.97, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-3xl border border-primary bg-background p-6 md:p-10"
          >
            <button
              onClick={onClose}
              aria-label="Close"
              className="absolute top-3 right-3 font-mono text-primary/60 hover:text-primary text-xl w-8 h-8 flex items-center justify-center cursor-pointer"
            >
              ×
            </button>

            <div className="flex items-center gap-2 mb-6">
              <span className="w-2 h-2 bg-primary animate-pulse" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-primary/60">
                LIVE PREVIEW
              </span>
            </div>

            <h3
              className="font-display text-primary uppercase leading-[0.9] mb-6"
              style={{ fontSize: "clamp(28px, 5vw, 56px)" }}
            >
              MAILMIND IN 60 SECONDS
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-primary/15 border border-primary/15 mb-6">
              {[
                { k: "01", t: "FETCH", d: "Email arrives — full thread parsed in milliseconds." },
                { k: "02", t: "ANALYZE", d: "Intent + entities + tone classified by the model." },
                { k: "03", t: "SUGGEST", d: "Reply, summary, and calendar action ready to ship." },
              ].map((s) => (
                <div key={s.k} className="bg-background p-4">
                  <p className="font-mono text-[9px] text-primary/30 mb-1">[{s.k}]</p>
                  <p className="font-display text-primary text-2xl uppercase leading-none mb-2">
                    {s.t}
                  </p>
                  <p className="font-mono text-[10px] text-primary/50 leading-relaxed">
                    {s.d}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 items-start">
              <button
                onClick={() => {
                  onClose();
                  document
                    .getElementById("demo")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className="font-mono text-[11px] uppercase tracking-[0.25em] bg-primary text-background px-5 py-3 hover:bg-primary/90 transition-colors cursor-pointer"
              >
                Try it live →
              </button>
              <button
                onClick={onClose}
                className="font-mono text-[11px] uppercase tracking-[0.25em] border border-primary/40 text-primary px-5 py-3 hover:border-primary transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DemoModal;
