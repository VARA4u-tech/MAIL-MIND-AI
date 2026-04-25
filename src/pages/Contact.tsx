import { FC } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Github, Twitter } from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const },
};

const ContactPage: FC = () => (
  <div className="min-h-screen bg-background text-foreground px-4 md:px-6 py-12 md:py-20 max-w-4xl mx-auto">
    <motion.div {...fadeUp}>
      <Link to="/" className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-primary/50 hover:text-primary transition-colors mb-12 md:mb-16">
        <ArrowLeft className="w-3 h-3" /> Back to Home
      </Link>

      <div className="mb-12 border-b border-primary/20 pb-8">
        <span className="font-mono text-xs uppercase tracking-[0.3em] text-primary/40 mb-4 block">[03] CONTACT</span>
        <h1 className="font-display text-primary uppercase leading-none" style={{ fontSize: "clamp(36px, 8vw, 112px)" }}>
          GET IN<br />TOUCH
        </h1>
      </div>

      <div className="space-y-12">
        <section>
          <p className="font-mono text-sm text-primary/70 leading-[2]">
            Whether you have feedback on the product, want to collaborate, or are a recruiter or reviewer interested in learning more about the project — reach out through any of the channels below.
          </p>
        </section>

        <section className="border-t border-primary/15 pt-10">
          <h2 className="font-display text-primary text-2xl uppercase mb-6">Channels</h2>
          <div className="flex flex-col gap-4">
            <a
              href="https://github.com/VARA4u-tech"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-4 border border-primary/20 p-5 hover:border-primary/50 hover:bg-primary/[0.03] transition-all"
            >
              <Github className="w-5 h-5 text-primary/60 group-hover:text-primary transition-colors" />
              <div>
                <p className="font-mono text-xs uppercase tracking-widest text-primary mb-1">GitHub</p>
                <p className="font-mono text-[11px] text-primary/40">github.com/VARA4u-tech</p>
              </div>
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-4 border border-primary/20 p-5 hover:border-primary/50 hover:bg-primary/[0.03] transition-all"
            >
              <Twitter className="w-5 h-5 text-primary/60 group-hover:text-primary transition-colors" />
              <div>
                <p className="font-mono text-xs uppercase tracking-widest text-primary mb-1">Twitter / X</p>
                <p className="font-mono text-[11px] text-primary/40">Follow for project updates</p>
              </div>
            </a>
          </div>
        </section>

        <section className="border-t border-primary/15 pt-10">
          <h2 className="font-display text-primary text-2xl uppercase mb-4">For Recruiters</h2>
          <p className="font-mono text-sm text-primary/70 leading-[2]">
            MailMind AI is a student-built project designed to demonstrate practical skills in React, TypeScript, UI/UX design, and AI-powered product development. All source code, design decisions, and technical choices are documented and available on GitHub.
          </p>
          <div className="mt-6 p-6 border border-primary/25 bg-primary/[0.03]">
            <p className="font-mono text-xs text-primary/50 leading-relaxed">
              <span className="text-primary font-bold block mb-1">Key Skills Demonstrated</span>
              React + TypeScript · Framer Motion Animations · Zod Form Validation · Component Architecture · SaaS UI/UX Design · Responsive Layout · Accessibility (WCAG) · React Router DOM
            </p>
          </div>
        </section>
      </div>
    </motion.div>
  </div>
);

export default ContactPage;
