import { FC } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const },
};

const CareersPage: FC = () => (
  <div className="min-h-screen bg-background text-foreground px-4 md:px-6 py-12 md:py-20 max-w-4xl mx-auto">
    <motion.div {...fadeUp}>
      <Link to="/" className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-primary/50 hover:text-primary transition-colors mb-12 md:mb-16">
        <ArrowLeft className="w-3 h-3" /> Back to Home
      </Link>

      <div className="mb-12 border-b border-primary/20 pb-8">
        <span className="font-mono text-xs uppercase tracking-[0.3em] text-primary/40 mb-4 block">[02] CAREERS</span>
        <h1 className="font-display text-primary uppercase leading-none" style={{ fontSize: "clamp(36px, 8vw, 112px)" }}>
          JOIN THE<br />JOURNEY
        </h1>
      </div>

      <div className="space-y-12">
        <section>
          <p className="font-mono text-sm text-primary/70 leading-[2]">
            MailMind AI is currently a student-driven solo project in its early stages. As the product grows and the vision takes shape, there may be opportunities to collaborate, contribute, or join the team.
          </p>
          <p className="font-mono text-sm text-primary/70 leading-[2] mt-4">
            If you're a student, developer, designer, or AI enthusiast who shares the vision of making communication smarter — we'd love to hear from you.
          </p>
        </section>

        <section className="border-t border-primary/15 pt-10">
          <h2 className="font-display text-primary text-2xl uppercase mb-6">What We Value</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { title: "Curiosity", desc: "A drive to ask why and build better solutions." },
              { title: "Ownership", desc: "Taking responsibility for your work end-to-end." },
              { title: "Craft", desc: "Caring deeply about quality of code and design." },
              { title: "Growth", desc: "Learning continuously and improving relentlessly." },
            ].map(({ title, desc }) => (
              <div key={title} className="border border-primary/15 p-6 group hover:border-primary/40 transition-colors">
                <h3 className="font-display text-primary text-xl uppercase mb-2">{title}</h3>
                <p className="font-mono text-xs text-primary/50 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-primary/15 pt-10">
          <h2 className="font-display text-primary text-2xl uppercase mb-4">Get In Touch</h2>
          <p className="font-mono text-sm text-primary/70 leading-[2] mb-6">
            There are no formal openings yet, but if you want to collaborate or contribute, reach out via GitHub.
          </p>
          <a
            href="https://github.com/VARA4u-tech"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block font-mono text-xs uppercase tracking-widest bg-primary text-background px-6 py-3 hover:bg-primary/90 transition-colors"
          >
            Reach Out on GitHub →
          </a>
        </section>
      </div>
    </motion.div>
  </div>
);

export default CareersPage;
