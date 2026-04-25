import { FC, useState, useEffect } from "react";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";

const Navbar: FC = () => {
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() ?? 0;
    if (latest > previous && latest > 150) {
      setHidden(true);
    } else {
      setHidden(false);
    }
    setScrolled(latest > 50);
  });

  return (
    <motion.header
      variants={{
        visible: { y: 0 },
        hidden: { y: "-100%" },
      }}
      animate={hidden ? "hidden" : "visible"}
      transition={{ duration: 0.35, ease: "easeInOut" }}
      className={`fixed top-0 inset-x-0 z-50 transition-colors duration-300 ${
        scrolled ? "bg-background/80 backdrop-blur-md border-b border-primary/20" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-primary" />
          <span className="font-display tracking-widest text-primary text-xl uppercase">MailMind</span>
        </div>
        
        <nav className="hidden md:flex items-center gap-8">
          <a href="#demo" className="font-mono text-xs uppercase tracking-widest text-primary/70 hover:text-primary transition-colors">Demo</a>
          <a href="#features" className="font-mono text-xs uppercase tracking-widest text-primary/70 hover:text-primary transition-colors">Features</a>
          <a href="#use-cases" className="font-mono text-xs uppercase tracking-widest text-primary/70 hover:text-primary transition-colors">Use Cases</a>
        </nav>

        <button 
          onClick={() => document.getElementById("get-started")?.scrollIntoView({ behavior: "smooth" })}
          className="font-mono text-[10px] uppercase tracking-[0.2em] bg-primary/10 text-primary border border-primary/30 px-4 py-2 hover:bg-primary hover:text-background transition-colors"
        >
          Join Waitlist
        </button>
      </div>
    </motion.header>
  );
};

export default Navbar;
