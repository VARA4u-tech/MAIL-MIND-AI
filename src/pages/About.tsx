import { FC } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const },
};

const AboutPage: FC = () => (
  <div className="min-h-screen bg-background text-foreground px-6 py-20 max-w-4xl mx-auto">
    <motion.div {...fadeUp}>
      <Link to="/" className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-primary/50 hover:text-primary transition-colors mb-16">
        <ArrowLeft className="w-3 h-3" /> Back to Home
      </Link>

      <div className="mb-12 border-b border-primary/20 pb-8">
        <span className="font-mono text-xs uppercase tracking-[0.3em] text-primary/40 mb-4 block">[01] ABOUT</span>
        <h1 className="font-display text-primary uppercase leading-none" style={{ fontSize: "clamp(48px, 8vw, 112px)" }}>
          ABOUT<br />MAILMIND
        </h1>
      </div>

      <div className="space-y-12">
        <section>
          <h2 className="font-display text-primary text-2xl uppercase mb-4">The Project</h2>
          <p className="font-mono text-sm text-primary/70 leading-[2]">
            MailMind AI is an AI-powered email and calendar assistant, designed and engineered as a student-driven initiative to bridge the gap between academic knowledge and real-world software development.
          </p>
          <p className="font-mono text-sm text-primary/70 leading-[2] mt-4">
            This project was built to demonstrate practical proficiency in full-stack development, AI integration, user experience design, and modern SaaS architecture — all while solving a genuine problem: inbox overload.
          </p>
        </section>

        <section className="border-t border-primary/15 pt-10">
          <h2 className="font-display text-primary text-2xl uppercase mb-4">The Mission</h2>
          <p className="font-mono text-sm text-primary/70 leading-[2]">
            We believe that your time is best spent on decisions that require your judgment — not triaging emails. MailMind AI handles the classification, summarization, and drafting, so you can focus on what actually matters.
          </p>
        </section>

        <section className="border-t border-primary/15 pt-10">
          <h2 className="font-display text-primary text-2xl uppercase mb-4">The Builder</h2>
          <p className="font-mono text-sm text-primary/70 leading-[2]">
            MailMind AI was designed and engineered by <span className="text-primary font-bold">VARA</span> — a student committed to building real-world solutions, growing through hands-on experience, and creating a strong professional portfolio through purposeful projects.
          </p>
          <a
            href="https://github.com/VARA4u-tech"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-6 font-mono text-xs uppercase tracking-widest border border-primary/40 text-primary px-5 py-3 hover:bg-primary hover:text-background transition-colors"
          >
            View on GitHub →
          </a>
        </section>

        <section className="border-t border-primary/15 pt-10">
          <h2 className="font-display text-primary text-2xl uppercase mb-6">Tech Stack</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {["React + Vite", "TypeScript", "Tailwind CSS", "Framer Motion", "Zod Validation", "React Router", "Lucide Icons", "shadcn/ui"].map((tech) => (
              <div key={tech} className="border border-primary/20 p-3 font-mono text-xs text-primary/60 uppercase tracking-widest">
                {tech}
              </div>
            ))}
          </div>
        </section>
      </div>
    </motion.div>
  </div>
);

export default AboutPage;
