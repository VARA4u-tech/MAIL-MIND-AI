import { FC, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

const HeroSection: FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.85]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section ref={ref} className="relative h-screen flex items-center justify-center overflow-hidden">
      <motion.h1
        style={{ scale, opacity }}
        className="font-display text-primary text-[18vw] leading-[0.85] tracking-tight select-none"
      >
        REVELO
      </motion.h1>
    </section>
  );
};

export default HeroSection;