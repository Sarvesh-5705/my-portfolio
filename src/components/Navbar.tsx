import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import gsap from "gsap";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollToPlugin, ScrollTrigger);

export default function Navbar() {
  const [activeSection, setActiveSection] = useState("home");

  const navLinks = [
    { name: "Home", href: "home" },
    { name: "About", href: "about" },
    { name: "Projects", href: "projects" },
    { name: "Contact", href: "contact" },
  ];

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    }, { 
      // Trigger when at least 20% of the section is visible
      threshold: 0.2,
      rootMargin: "-10% 0px -40% 0px"
    });

    // Poll until Scrollytelling finishes loading and renders the sections
    const checkAndObserve = setInterval(() => {
      let foundCount = 0;
      navLinks.forEach(link => {
        const el = document.getElementById(link.href);
        if (el) {
          foundCount++;
          observer.observe(el);
        }
      });
      if (foundCount === navLinks.length) {
        clearInterval(checkAndObserve);
      }
    }, 500);

    return () => {
      clearInterval(checkAndObserve);
      observer.disconnect();
    };
  }, []);

  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    gsap.to(window, { scrollTo: { y: `#${href}`, offsetY: 0 }, duration: 1.5, ease: "power3.inOut" });
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 w-full max-w-[1400px] mx-auto px-6 py-6 md:px-10 md:py-10 flex flex-row justify-between items-center pointer-events-none">
      <div className="flex items-center pointer-events-auto">
        <span className="text-[2rem] tracking-[-0.04em] font-display text-foreground leading-none drop-shadow-md">
          Sarvesh
        </span>
      </div>

      <div className="hidden md:flex items-center gap-12 pointer-events-auto">
        {navLinks.map((link) => {
          const isActive = activeSection === link.href;
          return (
            <a
              key={link.name}
              href={`#${link.href}`}
              onClick={(e) => handleScroll(e, link.href)}
              className={cn(
                "text-[14px] uppercase tracking-[0.1em] transition-all duration-500",
                isActive 
                  ? "text-[#FAF0CA] font-bold drop-shadow-[0_0_12px_rgba(250,240,202,0.8)] scale-110" 
                  : "text-muted-foreground hover:text-foreground hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]"
              )}
            >
              {link.name}
            </a>
          );
        })}
      </div>

      <Button
        onClick={() => gsap.to(window, { scrollTo: { y: "#contact" }, duration: 1.5, ease: "power3.inOut" })}
        className="liquid-glass rounded-full px-8 py-3 text-[13px] uppercase tracking-wider text-[#FAF0CA] font-bold hover:scale-[1.05] transition-all duration-500 bg-white/10 border border-white/20 hover:bg-white/20 shadow-[0_0_15px_rgba(250,240,202,0.2)]"
      >
        Let's Connect
      </Button>
    </nav>
  );
}
