import { FC, FormEvent, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { z } from "zod";

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
  const [touched, setTouched] = useState<{ name: boolean; email: boolean }>({ name: false, email: false });

  const validation = useMemo(() => waitlistSchema.safeParse({ name, email }), [name, email]);
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
    // Mock submission only — no network call
    setTimeout(() => setStatus("done"), 700);
  };

  return (
    <section
      id="waitlist"
      className="py-32 px-4 max-w-3xl mx-auto"
      data-debug="waitlist"
    >
      {/* Anchor alias for "Get Started" CTA */}
      <span id="get-started" className="block -mt-20 pt-20" aria-hidden="true" />

      <div className="mb-12 flex items-baseline justify-between border-b border-primary/20 pb-6">
        <h2
          className="font-display text-primary uppercase leading-none"
          style={{ fontSize: "clamp(36px, 7vw, 96px)" }}
        >
          JOIN WAITLIST
        </h2>
        <span className="font-mono text-xs text-primary/40 tracking-widest hidden md:inline">
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
              <span className="font-mono text-xs uppercase tracking-widest text-primary">
                CONFIRMED
              </span>
            </div>
            <p className="font-display text-primary text-3xl md:text-4xl uppercase leading-tight mb-3">
              YOU'RE ON THE LIST, {name.trim().split(" ")[0].toUpperCase()}.
            </p>
            <p className="font-mono text-xs text-primary/50 leading-relaxed">
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
            noValidate
          >
            <div>
              <label className="font-mono text-xs uppercase tracking-widest text-primary/40 block mb-2">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, 100))}
                onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                maxLength={100}
                autoComplete="name"
                placeholder="Ada Lovelace"
                aria-invalid={touched.name && !!fieldErrors.name}
                className={`w-full bg-transparent border outline-none font-mono text-[13px] text-primary p-3 placeholder:text-primary/25 transition-colors ${
                  touched.name && fieldErrors.name
                    ? "border-primary"
                    : "border-primary/25 focus:border-primary"
                }`}
              />
              {touched.name && fieldErrors.name && (
                <p className="font-mono text-xs text-primary/80 uppercase tracking-widest mt-2">
                  ! {fieldErrors.name}
                </p>
              )}
            </div>
            <div>
              <label className="font-mono text-xs uppercase tracking-widest text-primary/40 block mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value.slice(0, 255))}
                onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                maxLength={255}
                autoComplete="email"
                placeholder="ada@analytical.engine"
                aria-invalid={touched.email && !!fieldErrors.email}
                className={`w-full bg-transparent border outline-none font-mono text-[13px] text-primary p-3 placeholder:text-primary/25 transition-colors ${
                  touched.email && fieldErrors.email
                    ? "border-primary"
                    : "border-primary/25 focus:border-primary"
                }`}
              />
              {touched.email && fieldErrors.email && (
                <p className="font-mono text-xs text-primary/80 uppercase tracking-widest mt-2">
                  ! {fieldErrors.email}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={status === "submitting" || !isValid}
              className="font-mono text-xs uppercase tracking-[0.25em] bg-primary text-background px-6 py-3 hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
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
