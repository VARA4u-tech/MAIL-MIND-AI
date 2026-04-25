import { FC } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const },
};

const TermsPage: FC = () => (
  <div className="min-h-screen bg-background text-foreground px-4 md:px-6 py-12 md:py-20 max-w-4xl mx-auto">
    <motion.div {...fadeUp}>
      <Link to="/" className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-primary/50 hover:text-primary transition-colors mb-12 md:mb-16">
        <ArrowLeft className="w-3 h-3" /> Back to Home
      </Link>

      <div className="mb-12 border-b border-primary/20 pb-8">
        <span className="font-mono text-xs uppercase tracking-[0.3em] text-primary/40 mb-4 block">[05] LEGAL</span>
        <h1 className="font-display text-primary uppercase leading-none" style={{ fontSize: "clamp(36px, 8vw, 112px)" }}>
          TERMS OF<br />SERVICE
        </h1>
        <p className="font-mono text-xs text-primary/30 mt-4">Last updated: April 2026</p>
      </div>

      <div className="space-y-10 font-mono text-sm text-primary/70 leading-[2]">
        <section>
          <h2 className="font-display text-primary text-xl uppercase mb-3">1. Acceptance</h2>
          <p>
            By accessing MailMind AI, you acknowledge that this is a <span className="text-primary">student-built portfolio project</span> and not a commercial product. It is provided for demonstration and educational purposes only.
          </p>
        </section>

        <section className="border-t border-primary/15 pt-8">
          <h2 className="font-display text-primary text-xl uppercase mb-3">2. Use of the Application</h2>
          <p>
            You may use this application to evaluate its design and functionality. You agree not to misuse, clone for commercial gain, or represent this work as your own. The source code is available on GitHub for learning and reference purposes.
          </p>
        </section>

        <section className="border-t border-primary/15 pt-8">
          <h2 className="font-display text-primary text-xl uppercase mb-3">3. Intellectual Property</h2>
          <p>
            All design, code, and content within MailMind AI was created by VARA as part of a student initiative. The MailMind name, brand, and visual identity are original work created for this project.
          </p>
        </section>

        <section className="border-t border-primary/15 pt-8">
          <h2 className="font-display text-primary text-xl uppercase mb-3">4. Disclaimer of Warranties</h2>
          <p>
            MailMind AI is provided "as is" without warranties of any kind. As a student project, it may have bugs, incomplete features, or evolving functionality. No guarantees are made regarding uptime, data integrity, or fitness for production use.
          </p>
        </section>

        <section className="border-t border-primary/15 pt-8">
          <h2 className="font-display text-primary text-xl uppercase mb-3">5. Changes</h2>
          <p>
            These terms may be updated at any time as the project evolves. Continued use of the site constitutes acceptance of any revised terms.
          </p>
        </section>

        <section className="border-t border-primary/15 pt-8">
          <h2 className="font-display text-primary text-xl uppercase mb-3">6. Contact</h2>
          <p>
            Questions about these terms?{" "}
            <Link to="/contact" className="text-primary hover:underline">Get in touch</Link>.
          </p>
        </section>
      </div>
    </motion.div>
  </div>
);

export default TermsPage;
