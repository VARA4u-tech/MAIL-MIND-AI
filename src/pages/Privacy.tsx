import { FC } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const },
};

const PrivacyPage: FC = () => (
  <div className="min-h-screen bg-background text-foreground px-4 md:px-6 py-12 md:py-20 max-w-4xl mx-auto">
    <motion.div {...fadeUp}>
      <Link to="/" className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-primary/50 hover:text-primary transition-colors mb-12 md:mb-16">
        <ArrowLeft className="w-3 h-3" /> Back to Home
      </Link>

      <div className="mb-12 border-b border-primary/20 pb-8">
        <span className="font-mono text-xs uppercase tracking-[0.3em] text-primary/40 mb-4 block">[04] LEGAL</span>
        <h1 className="font-display text-primary uppercase leading-none" style={{ fontSize: "clamp(36px, 8vw, 112px)" }}>
          PRIVACY<br />POLICY
        </h1>
        <p className="font-mono text-xs text-primary/30 mt-4">Last updated: April 2026</p>
      </div>

      <div className="space-y-10 font-mono text-sm text-primary/70 leading-[2]">
        <section>
          <h2 className="font-display text-primary text-xl uppercase mb-3">1. Overview</h2>
          <p>
            MailMind AI is a student-built demonstration project. This Privacy Policy explains how information is handled within this application. Since this is a portfolio and learning project, no real user data is stored, processed, or transmitted to any third-party servers.
          </p>
        </section>

        <section className="border-t border-primary/15 pt-8">
          <h2 className="font-display text-primary text-xl uppercase mb-3">2. Data Collection</h2>
          <p>
            The waitlist form on this site is a <span className="text-primary">simulated demo</span>. It does not transmit data over any network. Any inputs you provide are processed locally in the browser and are not stored or shared with any party.
          </p>
        </section>

        <section className="border-t border-primary/15 pt-8">
          <h2 className="font-display text-primary text-xl uppercase mb-3">3. Cookies</h2>
          <p>
            This application uses <code className="text-primary text-xs bg-primary/10 px-1 py-0.5">localStorage</code> only to persist a debug toggle setting. No tracking cookies, analytics scripts, or advertising SDKs are used.
          </p>
        </section>

        <section className="border-t border-primary/15 pt-8">
          <h2 className="font-display text-primary text-xl uppercase mb-3">4. Third-Party Services</h2>
          <p>
            Google Fonts is loaded via a CDN. By visiting this page, your browser may make a request to Google's servers to fetch font files. This is governed by Google's privacy policy.
          </p>
        </section>

        <section className="border-t border-primary/15 pt-8">
          <h2 className="font-display text-primary text-xl uppercase mb-3">5. Contact</h2>
          <p>
            For any questions regarding this privacy policy, please reach out via the{" "}
            <Link to="/contact" className="text-primary hover:underline">Contact page</Link>.
          </p>
        </section>
      </div>
    </motion.div>
  </div>
);

export default PrivacyPage;
