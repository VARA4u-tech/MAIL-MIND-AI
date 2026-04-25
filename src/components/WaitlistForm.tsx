import { FC, FormEvent, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { z } from "zod";
import Magnetic from "./Magnetic";
import LetterReveal from "./LetterReveal";

const waitlistSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: "Name is required" })
    .max(100, { message: "Name must be under 100 characters" }),
  email: z
    .string()
    .trim()
    .min(1, { message: "Email is required" })
    .email({ message: "Please enter a valid email" })
    .max(255, { message: "Email must be under 255 characters" }),
});

const WaitlistForm: FC = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "done">("idle");
  const [touched, setTouched] = useState<{ name: boolean; email: boolean }>({
    name: false,
    email: false,
  });

  const validation = useMemo(
    () => waitlistSchema.safeParse({ name, email }),
    [name, email],
  );
  const isValid = validation.success;
  const fieldErrors: Record<string, string> = {};
  if (!isValid) {
    for (const issue of validation.error.issues) {
      const key = issue.path[0] as string;
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, email: true });
    if (!isValid) return;
    setStatus("submitting");
    // Mock submission
    setTimeout(() => setStatus("done"), 1200);
  };

  return (
    <section
      id="waitlist"
      className="py-32 px-4 max-w-3xl mx-auto"
      data-debug="waitlist"
    >
      {/* Anchor alias for "Get Started" CTA */}
      <span
        id="get-started"
        className="block -mt-20 pt-20"
        aria-hidden="true"
      />

      <div className="mb-12 flex items-baseline justify-between border-b border-primary/20 pb-6">
        <LetterReveal
          text="JOIN WAITLIST"
          className="font-display text-primary uppercase leading-none text-[36px] md:text-7xl lg:text-[96px]"
        />
        <span className="font-mono text-xs text-primary/40 tracking-widest hidden md:inline">
          [05] EARLY ACCESS
        </span>
      </div>

      <p className="font-mono text-[12px] text-primary/50 leading-[1.8] mb-10 max-w-xl">
        Get early access to MailMind AI. We'll email you when your seat is ready
        — no spam, ever.
      </p>

      <div className="relative min-h-[300px]">
        <AnimatePresence mode="wait">
          {status === "done" ? (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="border border-primary p-8 md:p-12 bg-primary/[0.04] relative overflow-hidden"
            >
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{
                  duration: 1.5,
                  ease: "easeInOut",
                  repeat: Infinity,
                }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/[0.05] to-transparent pointer-events-none"
              />

              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <span className="w-2 h-2 bg-primary animate-pulse" />
                  <span className="font-mono text-xs uppercase tracking-[0.3em] text-primary">
                    CONFIRMED
                  </span>
                </div>
                <h3 className="font-display text-primary text-3xl md:text-5xl uppercase leading-none mb-6">
                  WELCOME TO THE INBOX REVOLUTION,{" "}
                  {name.trim().split(" ")[0].toUpperCase()}.
                </h3>
                <p className="font-mono text-sm text-primary/60 leading-relaxed max-w-lg">
                  We've reserved your spot and sent a confirmation to{" "}
                  <span className="text-primary underline underline-offset-4">
                    {email}
                  </span>
                  . You're currently #1,240 in line.
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              onSubmit={handleSubmit}
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
              noValidate
            >
              {/* Name Field */}
              <div className="group">
                <label className="font-mono text-[10px] uppercase tracking-[0.3em] text-primary/40 block mb-3 transition-colors group-focus-within:text-primary">
                  [01] NAME
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value.slice(0, 100))}
                    onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                    maxLength={100}
                    autoComplete="name"
                    placeholder="Your Full Name"
                    className={`w-full bg-transparent border-b outline-none font-mono text-sm md:text-base text-primary py-3 placeholder:text-primary/35 transition-all duration-300 ${
                      touched.name && fieldErrors.name
                        ? "border-primary"
                        : "border-primary/20 focus:border-primary bg-primary/[0.01]"
                    }`}
                  />
                  <motion.div
                    className="absolute bottom-0 left-0 h-[1px] bg-primary"
                    initial={{ width: 0 }}
                    whileFocus={{ width: "100%" }}
                  />
                </div>
                <AnimatePresence>
                  {touched.name && fieldErrors.name && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="font-mono text-[10px] text-primary uppercase tracking-widest mt-3 flex items-center gap-2"
                    >
                      <span className="w-1 h-1 bg-primary" /> {fieldErrors.name}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Email Field */}
              <div className="group">
                <label className="font-mono text-[10px] uppercase tracking-[0.3em] text-primary/40 block mb-3 transition-colors group-focus-within:text-primary">
                  [02] EMAIL
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value.slice(0, 255))}
                    onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                    maxLength={255}
                    autoComplete="email"
                    placeholder="E-Mail Address"
                    className={`w-full bg-transparent border-b outline-none font-mono text-sm md:text-base text-primary py-3 placeholder:text-primary/35 transition-all duration-300 ${
                      touched.email && fieldErrors.email
                        ? "border-primary"
                        : "border-primary/20 focus:border-primary bg-primary/[0.01]"
                    }`}
                  />
                </div>
                <AnimatePresence>
                  {touched.email && fieldErrors.email && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="font-mono text-[10px] text-primary uppercase tracking-widest mt-3 flex items-center gap-2"
                    >
                      <span className="w-1 h-1 bg-primary" />{" "}
                      {fieldErrors.email}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              <div className="pt-4">
                <Magnetic>
                  <button
                    type="submit"
                    disabled={status === "submitting" || !isValid}
                    className="group relative overflow-hidden font-mono text-xs uppercase tracking-[0.3em] bg-primary text-background px-8 py-4 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <span className="relative z-10 flex items-center gap-3">
                      {status === "submitting" ? (
                        <>
                          <span className="w-2 h-2 bg-background animate-ping" />
                          PROCESSING...
                        </>
                      ) : (
                        "REQUEST EARLY ACCESS →"
                      )}
                    </span>
                    {status === "submitting" && (
                      <motion.div 
                        className="absolute inset-0 bg-white/10"
                        initial={{ x: "-100%" }}
                        animate={{ x: "0%" }}
                        transition={{ duration: 1.2, ease: "linear" }}
                      />
                    )}
                  </button>
                </Magnetic>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};

export default WaitlistForm;
