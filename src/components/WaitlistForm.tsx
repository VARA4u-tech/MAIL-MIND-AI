import { FC, FormEvent, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const WaitlistForm: FC = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !email.trim()) {
      setError("Both fields are required.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email.");
      return;
    }
    setStatus("submitting");
    // Mock submission
    setTimeout(() => setStatus("done"), 700);
  };

  return (
    <section
      id="waitlist"
      className="py-32 px-4 max-w-3xl mx-auto"
      data-debug="waitlist"
    >
      <div className="mb-12 flex items-baseline justify-between border-b border-primary/20 pb-6">
        <h2
          className="font-display text-primary uppercase leading-none"
          style={{ fontSize: "clamp(36px, 7vw, 96px)" }}
        >
          JOIN WAITLIST
        </h2>
        <span className="font-mono text-[10px] text-primary/40 tracking-widest hidden md:inline">
          [05] EARLY ACCESS
        </span>
      </div>

      <p className="font-mono text-[12px] text-primary/50 leading-[1.8] mb-10 max-w-xl">
        Get early access to MailMind AI. We'll email you when your seat is
        ready — no spam, ever.
      </p>

      <AnimatePresence mode="wait">
        {status === "done" ? (
          <motion.div
            key="done"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="border border-primary p-8 md:p-10 bg-primary/[0.04]"
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="w-2 h-2 bg-primary" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-primary">
                CONFIRMED
              </span>
            </div>
            <p className="font-display text-primary text-3xl md:text-4xl uppercase leading-tight mb-3">
              YOU'RE ON THE LIST, {name.split(" ")[0].toUpperCase()}.
            </p>
            <p className="font-mono text-[11px] text-primary/50 leading-relaxed">
              We sent a confirmation to{" "}
              <span className="text-primary/80">{email}</span>. Keep an eye on
              your inbox — irony intended.
            </p>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            onSubmit={handleSubmit}
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-6"
          >
            <div>
              <label className="font-mono text-[9px] uppercase tracking-widest text-primary/40 block mb-2">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ada Lovelace"
                className="w-full bg-transparent border border-primary/25 focus:border-primary outline-none font-mono text-[13px] text-primary p-3 placeholder:text-primary/25 transition-colors"
              />
            </div>
            <div>
              <label className="font-mono text-[9px] uppercase tracking-widest text-primary/40 block mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ada@analytical.engine"
                className="w-full bg-transparent border border-primary/25 focus:border-primary outline-none font-mono text-[13px] text-primary p-3 placeholder:text-primary/25 transition-colors"
              />
            </div>

            {error && (
              <p className="font-mono text-[10px] text-primary/80 uppercase tracking-widest">
                ! {error}
              </p>
            )}

            <button
              type="submit"
              disabled={status === "submitting"}
              className="font-mono text-[11px] uppercase tracking-[0.25em] bg-primary text-background px-6 py-3 hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {status === "submitting" ? "Adding…" : "Request access →"}
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </section>
  );
};

export default WaitlistForm;
