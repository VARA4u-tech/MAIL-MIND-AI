import { FC, useState, useEffect } from "react";
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from "framer-motion";

const NAV_LINKS = [
  { label: "Demo", href: "#demo" },
  { label: "Features", href: "#features" },
  { label: "Use Cases", href: "#use-cases" },
];

const Navbar: FC = () => {
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("");

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() ?? 0;
    if (latest > previous && latest > 150 && !menuOpen) {
      setHidden(true);
    } else {
      setHidden(false);
    }
    setScrolled(latest > 50);
  });

  // Track active section with IntersectionObserver
  useEffect(() => {
    const ids = ["demo", "features", "use-cases"];
    const observers = ids.map((id) => {
      const el = document.getElementById(id);
      if (!el) return null;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveSection(id); },
        { rootMargin: "-30% 0px -60% 0px" }
      );
      obs.observe(el);
      return obs;
    });
    return () => observers.forEach((o) => o?.disconnect());
  }, []);

  const handleNavClick = (href: string) => {
    setMenuOpen(false);
    const id = href.replace("#", "");
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <motion.header
        variants={{ visible: { y: 0 }, hidden: { y: "-100%" } }}
        animate={hidden ? "hidden" : "visible"}
        transition={{ duration: 0.35, ease: "easeInOut" }}
        className={`fixed top-0 inset-x-0 z-50 transition-colors duration-300 ${
          scrolled ? "bg-background/90 backdrop-blur-md border-b border-primary/20" : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <a href="#" className="flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary group">
            <img 
              src="/favicon.png" 
              alt="MailMind Logo" 
              className="w-8 h-8 object-contain transition-transform group-hover:scale-110" 
            />
            <span className="font-display tracking-widest text-primary text-xl uppercase">MailMind</span>
          </a>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map(({ label, href }) => (
              <a
                key={href}
                href={href}
                onClick={(e) => { e.preventDefault(); handleNavClick(href); }}
                className={`font-mono text-xs uppercase tracking-widest transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  activeSection === href.replace("#", "")
                    ? "text-primary"
                    : "text-primary/50 hover:text-primary"
                }`}
              >
                {label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            {/* CTA */}
            <button
              onClick={() => document.getElementById("get-started")?.scrollIntoView({ behavior: "smooth" })}
              className="hidden md:block font-mono text-[10px] uppercase tracking-[0.2em] bg-primary/10 text-primary border border-primary/30 px-4 py-2 hover:bg-primary hover:text-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Join Waitlist
            </button>

            {/* Hamburger (mobile only) */}
            <button
              className="md:hidden flex flex-col justify-center items-center gap-1.5 w-8 h-8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              onClick={() => setMenuOpen((v) => !v)}
            >
              <motion.span
                animate={menuOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
                className="block w-5 h-px bg-primary origin-center"
              />
              <motion.span
                animate={menuOpen ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }}
                className="block w-5 h-px bg-primary origin-center"
              />
              <motion.span
                animate={menuOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
                className="block w-5 h-px bg-primary origin-center"
              />
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-16 inset-x-0 z-40 bg-background/95 backdrop-blur-md border-b border-primary/20 flex flex-col py-6"
          >
            {NAV_LINKS.map(({ label, href }) => (
              <button
                key={href}
                onClick={() => handleNavClick(href)}
                className="font-mono text-sm uppercase tracking-[0.3em] text-primary/70 hover:text-primary py-4 px-6 text-left hover:bg-primary/5 transition-colors"
              >
                {label}
              </button>
            ))}
            <div className="px-6 pt-4 border-t border-primary/10 mt-2">
              <button
                onClick={() => { setMenuOpen(false); document.getElementById("get-started")?.scrollIntoView({ behavior: "smooth" }); }}
                className="w-full font-mono text-xs uppercase tracking-[0.25em] bg-primary text-background px-4 py-3 hover:bg-primary/90 transition-colors"
              >
                Join Waitlist →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
