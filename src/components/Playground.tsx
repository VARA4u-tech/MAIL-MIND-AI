import { FC, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  from: "them" | "you";
  author: string;
  time: string;
  body: string;
}

const sampleThread: Message[] = [
  {
    from: "them",
    author: "sarah.lin@acme.co",
    time: "Mon · 9:42",
    body: "Hey — loved the proposal you sent over. The team is mostly aligned, but we had a few questions about the rollout timeline and how onboarding would work for our APAC offices.",
  },
  {
    from: "you",
    author: "you",
    time: "Mon · 10:11",
    body: "Thanks Sarah! Happy to dig in. I can share a phased rollout plan and a separate onboarding doc tailored to APAC. Want to jump on a quick call this week?",
  },
  {
    from: "them",
    author: "sarah.lin@acme.co",
    time: "Mon · 14:03",
    body: "That sounds great. I'm open Wednesday 2–4pm PT or Thursday morning before 11. Also — could you ballpark go-live by end of Q3? Leadership is asking.",
  },
];

type Mode = "reply" | "summary" | "schedule";

const REPLY_VARIANTS = [
  (intent: string) =>
    `Hi Sarah,\n\n${intent}Wednesday at 2pm PT works well on my end. I'll send a calendar invite with the phased rollout deck and an APAC-specific onboarding draft attached.\n\nA Q3 go-live is realistic if we kick off discovery this week — I'll have my team start prep on our side.\n\nBest,`,
  (intent: string) =>
    `Hi Sarah,\n\nThanks for the quick turnaround. ${intent}Let's lock Wednesday 2pm PT. I'll bring the rollout phases (pilot → APAC → global) and a draft onboarding playbook tailored to your offices.\n\nOn timing: end of Q3 is achievable assuming we sign off on scope by next Friday.\n\nTalk soon,`,
  (intent: string) =>
    `Hi Sarah,\n\nAppreciate the alignment. ${intent}I'll grab Wednesday at 2pm PT and send an invite shortly with two attachments — phased rollout plan and APAC onboarding outline.\n\nEnd of Q3 is on the table if discovery wraps in the next two weeks.\n\nBest,`,
];

const SUMMARY_VARIANTS = [
  [
    "• Sarah's team is aligned on the proposal.",
    "• Open questions: APAC onboarding flow & rollout timeline.",
    "• She's offering Wed 2–4pm PT or Thu before 11am for a call.",
    "• Leadership wants a confirmed Q3 go-live estimate.",
  ].join("\n"),
  [
    "TL;DR — Acme is in. Two blockers to clear:",
    "  1. APAC onboarding plan needs detail.",
    "  2. Rollout timeline + Q3 go-live confirmation.",
    "Sarah is asking for a 30-min call this week.",
  ].join("\n"),
  [
    "Status:    Proposal accepted, pending details",
    "Asks:      APAC onboarding · rollout phases · Q3 ETA",
    "Meeting:   Wed 2–4pm PT  /  Thu pre-11am PT",
    "Owner:     you (response expected today)",
  ].join("\n"),
];

const SCHEDULE_VARIANTS = [
  [
    "DETECTED MEETING",
    "──────────────────",
    "Title:     MailMind × Acme — APAC rollout sync",
    "Options:   Wed 2:00 PM PT  ·  Thu 9:30 AM PT",
    "Attendees: you, sarah.lin@acme.co",
    "Duration:  30 min",
    "",
    '→ Click "Create Event" to add to your calendar',
  ].join("\n"),
  [
    "EVENT DRAFT",
    "──────────────────",
    "Subject:   Acme x MailMind — discovery + rollout",
    "When:      Wed, 2:00–2:30 PM PT (preferred)",
    "Backup:    Thu, 9:30–10:00 AM PT",
    "Location:  Google Meet (auto-generated)",
    "Agenda:    1. APAC onboarding  2. Phasing  3. Q3 ETA",
    "",
    "→ 1 click to send invites + add to your calendar",
  ].join("\n"),
  [
    "CALENDAR ACTION",
    "──────────────────",
    "▸ Block 30 min, Wed 14:00 PT",
    "▸ Invite: sarah.lin@acme.co",
    "▸ Attach: rollout-deck-v3.pdf",
    "▸ Reminder: 10 min before",
    "",
    "Hold a tentative Thu 09:30 PT slot? [Y/N]",
  ].join("\n"),
];

function generateOutput(mode: Mode, draft: string, variant: number) {
  const intent = draft.trim() ? `${draft.trim()}\n\n` : "";
  if (mode === "reply") return REPLY_VARIANTS[variant % REPLY_VARIANTS.length](intent);
  if (mode === "summary") return SUMMARY_VARIANTS[variant % SUMMARY_VARIANTS.length];
  return SCHEDULE_VARIANTS[variant % SCHEDULE_VARIANTS.length];
}

const STORAGE_KEY = "mailmind:playground";
interface PersistedState {
  mode: Mode;
  draft: string;
  output: string | null;
  variant: number;
}

function loadPersisted(): PersistedState {
  if (typeof window === "undefined") return { mode: "reply", draft: "", output: null, variant: 0 };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { mode: "reply", draft: "", output: null, variant: 0 };
    const parsed = JSON.parse(raw);
    const mode: Mode = ["reply", "summary", "schedule"].includes(parsed.mode) ? parsed.mode : "reply";
    return {
      mode,
      draft: typeof parsed.draft === "string" ? parsed.draft.slice(0, 500) : "",
      output: typeof parsed.output === "string" ? parsed.output : null,
      variant: Number.isInteger(parsed.variant) ? parsed.variant : 0,
    };
  } catch {
    return { mode: "reply", draft: "", output: null, variant: 0 };
  }
}

const Playground: FC = () => {
  const initial = useMemo(() => loadPersisted(), []);
  const [mode, setMode] = useState<Mode>(initial.mode);
  const [draft, setDraft] = useState(initial.draft);
  const [generated, setGenerated] = useState<string | null>(initial.output);
  const [variant, setVariant] = useState(initial.variant);
  const [pending, setPending] = useState(false);

  // Persist state
  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ mode, draft, output: generated, variant })
      );
    } catch {}
  }, [mode, draft, generated, variant]);

  const output = useMemo(
    () => (generated !== null ? generated : ""),
    [generated]
  );

  const handleGenerate = () => {
    setPending(true);
    const nextVariant = variant + 1;
    setVariant(nextVariant);
    setGenerated(null);
    // Mock async generation — cycles variants for "regenerate" feel
    setTimeout(() => {
      setGenerated(generateOutput(mode, draft, nextVariant));
      setPending(false);
    }, 650);
  };

  // Live update output when switching modes (if we already have one) so preview stays in sync
  const handleModeChange = (m: Mode) => {
    setMode(m);
    if (generated !== null) setGenerated(generateOutput(m, draft, variant));
  };

  // Live re-render reply when draft changes (only when currently showing a reply)
  useEffect(() => {
    if (mode !== "reply" || generated === null || pending) return;
    setGenerated(generateOutput("reply", draft, variant));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  return (
    <section
      id="demo"
      className="py-32 px-4 max-w-6xl mx-auto scroll-mt-20"
      data-debug="playground"
    >
      <div className="mb-16 flex items-baseline justify-between border-b border-primary/20 pb-6">
        <h2
          className="font-display text-primary uppercase leading-none"
          style={{ fontSize: "clamp(36px, 7vw, 96px)" }}
        >
          TRY THE DEMO
        </h2>
        <span className="font-mono text-[10px] text-primary/40 tracking-widest hidden md:inline">
          [04] PLAYGROUND
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-primary/15 border border-primary/20">
        {/* Sample conversation */}
        <div className="bg-background p-6 md:p-8 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <span className="font-mono text-[10px] uppercase tracking-widest text-primary/50">
              ▣ Sample thread
            </span>
            <span className="font-mono text-[9px] text-primary/30">3 messages</span>
          </div>

          <div className="space-y-4 flex-1 max-h-[420px] overflow-y-auto pr-2">
            {sampleThread.map((m, i) => (
              <div
                key={i}
                className={`border ${
                  m.from === "you"
                    ? "border-primary/40 bg-primary/[0.04]"
                    : "border-primary/15"
                } p-4`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-[10px] text-primary/60 truncate">
                    {m.author}
                  </span>
                  <span className="font-mono text-[9px] text-primary/30">{m.time}</span>
                </div>
                <p className="font-mono text-[11px] text-primary/70 leading-[1.75] whitespace-pre-wrap">
                  {m.body}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* AI panel */}
        <div className="bg-background p-6 md:p-8 flex flex-col">
          <div className="flex items-center gap-px mb-6 border border-primary/20 w-fit">
            {(["reply", "summary", "schedule"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => handleModeChange(m)}
                className={`font-mono text-[10px] uppercase tracking-[0.2em] px-3 py-2 transition-colors ${
                  mode === m
                    ? "bg-primary text-background"
                    : "text-primary/60 hover:text-primary"
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          {mode === "reply" && (
            <div className="mb-4">
              <label className="font-mono text-[9px] uppercase tracking-widest text-primary/40 block mb-2">
                Your intent (optional)
              </label>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="e.g. Confirm Wednesday and attach the rollout deck…"
                rows={3}
                className="w-full bg-transparent border border-primary/25 focus:border-primary/60 outline-none font-mono text-[11px] text-primary p-3 placeholder:text-primary/25 resize-none transition-colors"
              />
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={pending}
            className="font-mono text-[10px] uppercase tracking-[0.25em] bg-primary text-background px-4 py-2.5 hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer w-fit mb-6"
          >
            {pending ? "Generating…" : `Generate ${mode}`}
          </button>

          <div className="flex-1 border border-primary/15 bg-primary/[0.02] p-4 min-h-[200px]">
            <div className="font-mono text-[9px] uppercase tracking-widest text-primary/40 mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-primary animate-pulse" />
              AI output
            </div>
            <AnimatePresence mode="wait">
              {pending ? (
                <motion.p
                  key="pending"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="font-mono text-[11px] text-primary/30"
                >
                  analyzing thread…
                </motion.p>
              ) : output ? (
                <motion.pre
                  key={output}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="font-mono text-[11px] text-primary/80 leading-[1.8] whitespace-pre-wrap"
                >
                  {output}
                </motion.pre>
              ) : (
                <motion.p
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="font-mono text-[11px] text-primary/25"
                >
                  Click generate to see a {mode} for this thread.
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Playground;
