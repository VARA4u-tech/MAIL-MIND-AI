import { FC, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

const HeroSection: FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.9]);
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <section
      ref={ref}
      className="relative h-[100vh] flex items-center justify-center overflow-hidden"
    >
      {/* Subtle noise/grain overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      <motion.div
        style={{ scale, opacity }}
        className="relative w-full flex items-center justify-center px-[1vw]"
      >
        {/* Giant REVELO text — fills entire viewport width */}
        <h1
          className="font-display text-primary select-none leading-[0.82] tracking-[-0.02em] w-full text-center"
          style={{ fontSize: "clamp(80px, 26vw, 500px)" }}
        >
          REVELO
        </h1>
      </motion.div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

export default HeroSection;