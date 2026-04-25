import { FC } from "react";
import { motion } from "framer-motion";

const LogoCloud: FC = () => {
  const companies = [
    "ACME CORP",
    "GLOBEX",
    "SOYLENT",
    "INERODE",
    "MASSIVE DYNAMIC",
  ];

  return (
    <section className="py-20 border-b border-primary/20 bg-background overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-background z-10 pointer-events-none w-full" />
      <div className="max-w-7xl mx-auto px-4 mb-8 text-center relative z-20">
        <p className="font-mono text-xs uppercase tracking-widest text-primary/40">
          Trusted by early adopters at
        </p>
      </div>
      <div className="flex w-[200vw] sm:w-[150vw] md:w-full overflow-hidden">
        <motion.div
          className="flex whitespace-nowrap items-center justify-around w-full shrink-0 gap-8 md:gap-0 px-8"
          animate={{ x: ["0%", "-100%"] }}
          transition={{
            repeat: Infinity,
            ease: "linear",
            duration: 20,
          }}
        >
          {companies.map((company, i) => (
            <div key={`first-${i}`} className="font-display text-2xl md:text-3xl text-primary/30 tracking-widest px-8">
              {company}
            </div>
          ))}
          {/* Duplicate for seamless loop on smaller screens where width isn't enough to fill without scrolling */}
          {companies.map((company, i) => (
            <div key={`second-${i}`} className="font-display text-2xl md:text-3xl text-primary/30 tracking-widest px-8 md:hidden">
              {company}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default LogoCloud;
