import { FC, useRef } from "react";
import { motion, useScroll, useTransform, MotionValue } from "framer-motion";

interface ScrollRevealTextProps {
  words: { text: string; className?: string }[];
  className?: string;
}

const ScrollRevealText: FC<ScrollRevealTextProps> = ({ words, className = "" }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 0.9", "start 0.2"],
  });

  return (
    <div ref={containerRef} className={`flex flex-wrap justify-center gap-x-[0.3em] ${className}`}>
      {words.map((word, i) => {
        const start = i / words.length;
        const end = (i + 1) / words.length;
        return <Word key={i} range={[start, end]} progress={scrollYProgress} text={word.text} wordClass={word.className} />;
      })}
    </div>
  );
};

interface WordProps {
  range: [number, number];
  progress: MotionValue<number>;
  text: string;
  wordClass?: string;
}

const Word: FC<WordProps> = ({ range, progress, text, wordClass = "" }) => {
  const opacity = useTransform(progress, range, [0.15, 1]);
  const y = useTransform(progress, range, [20, 0]);

  return (
    <motion.span style={{ opacity, y }} className={`inline-block text-primary ${wordClass}`}>
      {text}
    </motion.span>
  );
};

export default ScrollRevealText;