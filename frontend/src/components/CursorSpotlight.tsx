import { FC, useEffect, useState } from "react";
import { motion, useSpring, useMotionValue, useMotionTemplate } from "framer-motion";

const CursorSpotlight: FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth out the movement
  const springConfig = { damping: 25, stiffness: 200 };
  const sx = useSpring(mouseX, springConfig);
  const sy = useSpring(mouseY, springConfig);

  const background = useMotionTemplate`radial-gradient(600px circle at ${sx}px ${sy}px, rgba(255, 0, 0, 0.04), transparent 80%)`;

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      if (!isVisible) setIsVisible(true);
    };

    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("mouseenter", handleMouseEnter);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mouseenter", handleMouseEnter);
    };
  }, [isVisible, mouseX, mouseY]);

  return (
    <>
      <motion.div
        className="fixed inset-0 pointer-events-none z-[9998] transition-opacity duration-500"
        style={{
          opacity: isVisible ? 1 : 0,
          background,
        }}
      />
      <motion.div
        className="fixed top-0 left-0 w-4 h-4 rounded-full bg-primary/20 blur-[2px] pointer-events-none z-[9999] transition-opacity duration-500"
        style={{
          opacity: isVisible ? 1 : 0,
          x: sx,
          y: sy,
          translateX: "-50%",
          translateY: "-50%",
        }}
      />
    </>
  );
};

export default CursorSpotlight;
