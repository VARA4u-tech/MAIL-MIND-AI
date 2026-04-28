import { FC, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, ChevronRight, X } from "lucide-react";

interface AuthNoticeModalProps {
  open: boolean;
  onClose: () => void;
  onProceed: () => void;
}

const AuthNoticeModal: FC<AuthNoticeModalProps> = ({ open, onClose, onProceed }) => {
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
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/95 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.96, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.97, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto border border-primary/30 bg-background p-6 sm:p-10 md:p-12 shadow-[0_0_50px_-12px_rgba(255,255,255,0.05)] custom-scrollbar"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-primary/40 hover:text-primary transition-colors cursor-pointer z-10"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            <div className="flex items-center gap-3 mb-6 sm:mb-8">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/10 flex items-center justify-center rounded-sm shrink-0">
                <ShieldAlert className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-mono text-[8px] sm:text-[10px] uppercase tracking-[0.3em] text-primary/50 truncate">Security Advisory</span>
                <span className="font-display text-lg sm:text-xl uppercase tracking-widest text-primary truncate">Authentication Notice</span>
              </div>
            </div>

            <div className="space-y-4 sm:space-y-6 font-mono text-[10px] sm:text-xs leading-relaxed text-primary/70">
              <p className="text-primary font-bold">MailMind AI is currently undergoing Google verification.</p>
              
              <p>During sign-in, you may encounter a warning screen stating that the app is not verified. This is expected during development.</p>

              <div className="bg-primary/5 border-l-2 border-primary p-4 sm:p-5 space-y-2 sm:space-y-3">
                <p className="text-primary font-bold uppercase tracking-widest text-[9px] sm:text-[10px]">To continue securely:</p>
                <ul className="space-y-1.5 sm:space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>Click <strong className="text-primary">"Advanced"</strong> on the Google screen</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>Select <strong className="text-primary">"Proceed to MailMind AI (unsafe)"</strong></span>
                  </li>
                </ul>
              </div>

              <p>We ensure that all authentication processes follow strict secure OAuth standards. Thank you for your understanding.</p>
            </div>

            <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                onClick={onProceed}
                className="flex-1 font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.15em] sm:tracking-[0.2em] border border-primary text-primary px-4 py-3 sm:px-6 sm:py-4 hover:bg-primary hover:text-background transition-all flex items-center justify-center gap-2 group cursor-pointer"
              >
                Accept & Proceed
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={onClose}
                className="font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.15em] sm:tracking-[0.2em] border border-primary/20 text-primary/60 px-4 py-3 sm:px-6 sm:py-4 hover:border-primary hover:text-primary transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AuthNoticeModal;
