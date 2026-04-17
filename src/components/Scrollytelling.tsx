import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Twitter, Linkedin, Github, Mail, ShieldAlert, Search, Bug, Activity, Network, Zap, Code, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger);

const FRAME_COUNT = 192;
const INITIAL_LOAD_COUNT = 15; // Only wait for the first 15 frames to start
const ZOOM_FACTOR = 1.0;

export default function Scrollytelling() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const textSectionsRef = useRef<HTMLDivElement[]>([]);
  const projectsContainerRef = useRef<HTMLDivElement>(null);
  const projectsWrapperRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);
  
  const [loadedFrames, setLoadedFrames] = useState(0);
  const [images, setImages] = useState<HTMLImageElement[]>([]);

  // Preload images with a sequential worker pool to prevent network/CPU saturation (fixes scrolling jitters)
  useEffect(() => {
    let loaded = 0;
    const imgArray: HTMLImageElement[] = new Array(FRAME_COUNT + 1);

    // Load 3 frames concurrently to balance speed and CPU load
    const concurrentWorkers = 3;
    let currentIndex = 1;

    const loadNextFrame = () => {
      if (currentIndex > FRAME_COUNT) return;
      const indexToLoad = currentIndex++;
      
      const img = new Image();
      const paddedIndex = String(indexToLoad).padStart(3, "0");
      img.src = `/frames/${paddedIndex}.jpg?v=2`;
      
      img.onload = () => {
        loaded++;
        imgArray[indexToLoad] = img;
        setLoadedFrames(loaded);
        // Chain the next frame
        loadNextFrame();
      };
      img.onerror = () => {
        loadNextFrame(); // keep queue moving even if one fails
      };
    };

    // Start background workers
    for (let i = 0; i < concurrentWorkers; i++) {
      loadNextFrame();
    }
    
    setImages(imgArray);
  }, []);

  // Helper to resize canvas only when window resizes
  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.scale(dpr, dpr);
    
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
  };

  // Draw frame on canvas with DPR support
  const drawFrame = (index: number) => {
    const canvas = canvasRef.current;
    if (!canvas || !images[index] || !images[index].complete) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = images[index];
    
    // Ensure smoothing is maintained
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    const canvasWidth = window.innerWidth;
    const canvasHeight = window.innerHeight;
    const canvasRatio = canvasWidth / canvasHeight;
    const imgRatio = img.width / img.height;

    let renderWidth = canvasWidth;
    let renderHeight = canvasHeight;
    let offsetX = 0;
    let offsetY = 0;

    if (canvasRatio > imgRatio) {
      renderHeight = canvasWidth / imgRatio;
      offsetY = (canvasHeight - renderHeight) / 2;
    } else {
      renderWidth = canvasHeight * imgRatio;
      offsetX = (canvasWidth - renderWidth) / 2;
    }

    const zoomedWidth = renderWidth * ZOOM_FACTOR;
    const zoomedHeight = renderHeight * ZOOM_FACTOR;
    const zoomedOffsetX = offsetX - (zoomedWidth - renderWidth) / 2;
    const zoomedOffsetY = offsetY - (zoomedHeight - renderHeight) / 2;

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.drawImage(img, zoomedOffsetX, zoomedOffsetY, zoomedWidth, zoomedHeight);
  };

  // Setup ScrollTrigger for animation and sections
  useEffect(() => {
    // Start as soon as we have our initial batch, and only initialize ONCE
    if (loadedFrames < INITIAL_LOAD_COUNT || initialized.current) return;
    initialized.current = true;

    // Initialize canvas dimensions
    resizeCanvas();
    drawFrame(0);

    const handleResize = () => {
      resizeCanvas();
      ScrollTrigger.refresh();
      drawFrame(Math.round(frameObj.frame));
    };
    window.addEventListener("resize", handleResize);

    // 1. Frame sequence animation mapped to scroll container
    const frameObj = { frame: 0 };
    
    const seqTrigger = ScrollTrigger.create({
      trigger: containerRef.current,
      start: "top top",
      end: "bottom bottom",
      scrub: 0.1,
      animation: gsap.to(frameObj, {
        frame: FRAME_COUNT - 1,
        snap: "frame",
        ease: "none",
        onUpdate: () => drawFrame(Math.round(frameObj.frame))
      })
    });

    // 2. Mouse Parallax effect
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      const xPos = (e.clientX / innerWidth - 0.5) * 30; 
      const yPos = (e.clientY / innerHeight - 0.5) * 30;

      gsap.to(canvasRef.current, {
        x: -xPos,
        y: -yPos,
        duration: 0.8,
        ease: "power2.out",
      });
    };
    window.addEventListener("mousemove", handleMouseMove);

    // 3. Horizontal Scroll for Projects
    let hScrollTrigger: ScrollTrigger | null = null;
    if (projectsContainerRef.current && projectsWrapperRef.current) {
      hScrollTrigger = ScrollTrigger.create({
        trigger: projectsContainerRef.current,
        start: "top top",
        end: () => `+=${projectsWrapperRef.current!.scrollWidth}`, 
        pin: true,
        scrub: 1,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        animation: gsap.to(projectsWrapperRef.current, {
          x: () => -(projectsWrapperRef.current!.scrollWidth - window.innerWidth),
          ease: "none"
        })
      });
    }

    // 4. Text sections fade in/out
    const sectionTriggers = textSectionsRef.current.map((section) => {
      if (!section) return null;
      return ScrollTrigger.create({
        trigger: section,
        start: "top 75%",
        end: "bottom 25%",
        onEnter: () => gsap.to(section, { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: "power3.out" }),
        onLeave: () => gsap.to(section, { opacity: 0, y: -50, scale: 0.95, duration: 0.6, ease: "power3.in" }),
        onEnterBack: () => gsap.to(section, { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: "power3.out" }),
        onLeaveBack: () => gsap.to(section, { opacity: 0, y: 50, scale: 0.95, duration: 0.6, ease: "power3.in" }),
      });
    });

    // Set initial state for sections
    gsap.set(textSectionsRef.current, { opacity: 0, y: 50, scale: 0.95 });
    
    if (textSectionsRef.current[0]) {
      gsap.to(textSectionsRef.current[0], { opacity: 1, y: 0, scale: 1, duration: 1, ease: "power3.out", delay: 0.5 });
    }

    // CRITICAL: Sort triggers by DOM order so GSAP calculates pin spacing correctly
    ScrollTrigger.sort();
    // Force a recalculation to apply pin-spacers perfectly
    ScrollTrigger.refresh();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      seqTrigger.kill();
      sectionTriggers.forEach(t => t?.kill());
      hScrollTrigger?.kill();
    };
  }, [loadedFrames]);

  const isLoading = loadedFrames < INITIAL_LOAD_COUNT;
  const loadPercentage = Math.min(100, Math.round((loadedFrames / INITIAL_LOAD_COUNT) * 100));

  return (
    <div ref={containerRef} className="relative w-full bg-black">
      {/* Aesthetic Cinematic Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-br from-[#020b17] via-black to-[#051c33] text-white animate-gradient-breath bg-[length:200%_200%] transition-opacity duration-1000">
          <div className="text-5xl md:text-7xl font-display italic tracking-tight mb-8 drop-shadow-[0_0_25px_rgba(250,240,202,0.4)] text-[#FAF0CA]">
            Sarvesh Portfolio
          </div>
          <div className="text-lg md:text-xl opacity-80 font-light tracking-[0.2em] text-[#FAF0CA]/80">
            {loadPercentage}%
          </div>
          <div className="w-64 md:w-96 h-1 bg-white/10 mt-8 rounded-full overflow-hidden shadow-[0_0_20px_rgba(250,240,202,0.15)]">
            <div 
              className="h-full bg-[#FAF0CA] transition-all duration-300 ease-out shadow-[0_0_15px_rgba(250,240,202,0.9)]"
              style={{ width: `${loadPercentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Canvas Viewport */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <canvas
          ref={canvasRef}
          className={cn(
            "fixed inset-0 w-full h-full scale-105 origin-center transition-opacity duration-1000",
            "contrast-105 saturate-110", // Minimal pop, preserving HD clarity
            isLoading ? "opacity-0" : "opacity-100"
          )}
        />
        {/* Animated Film Grain Overlay */}
        <div className="film-grain" />
        {/* Subtle dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60 pointer-events-none" />
      </div>

      {/* Content Sections */}
      {!isLoading && (
        <div className="relative z-10 w-full pt-[10vh] pb-0 block">
          
          {/* Section 1: Home (Bottom Overlay) */}
          <div id="home" className="min-h-[80vh] flex items-end justify-center pb-20 mb-[25vh]">
            <div 
              ref={el => { if (el) textSectionsRef.current[0] = el; }}
              className="px-6 md:px-8 py-6 text-center max-w-5xl transform-gpu"
            >
              <h1 className="text-[#FAF0CA] text-6xl md:text-[8rem] font-display italic leading-none tracking-tight mb-4 drop-shadow-[0_4px_24px_rgba(0,0,0,0.9)]">
                Welcome to my portfolio
              </h1>
              <p className="text-[#FAF0CA]/90 text-lg md:text-3xl font-display italic tracking-wide font-medium drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">
                Aspiring Software Engineer & Cybersecurity Enthusiast
              </p>
            </div>
          </div>

          {/* Section 2: About */}
          <div id="about" className="min-h-screen flex items-center justify-start px-6 md:px-24 mb-[25vh]">
            <div 
              ref={el => { if (el) textSectionsRef.current[1] = el; }}
              className="px-6 py-8 md:px-10 md:py-10 rounded-3xl shadow-2xl border border-white/20 max-w-2xl transform-gpu relative overflow-hidden transition-all duration-500 hover:border-[#FAF0CA]/60 hover:shadow-[0_0_40px_rgba(250,240,202,0.4)]"
              style={{ backgroundColor: 'rgba(0, 0, 0, 0.45)', backdropFilter: 'blur(24px)' }}
            >
              {/* Subtle inner glow to maintain the coastal warmth */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#FAF0CA]/5 to-transparent pointer-events-none" />
              
              <div className="relative z-10">
                <h2 className="text-[#FAF0CA] text-4xl md:text-6xl font-display italic tracking-tight mb-6 drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)]">
                  About Me
                </h2>
              <div className="text-[#FAF0CA]/90 text-base md:text-xl leading-relaxed font-light drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] space-y-3 md:space-y-4">
                <p>
                  I am an aspiring Software Engineer with a passion for building secure, scalable, and data-driven systems. Through my education and hands-on projects, I've gained strong expertise in cyber threat intelligence, malware analysis, and incident response.
                </p>
                <p>
                  Beyond code, I thrive on leadership. Over the past year, I've served as the <strong>President of the CySec Club</strong> at DSU, orchestrating cyber defense events, and led the PRO & Marketing teams, honing my ability to multitask and manage complex operations.
                </p>
                <p>
                  When I'm not dissecting malware or competing in Google hackathons, you'll likely find me exploring geopolitics or hitting the floor as a former Dance Team Head.
                </p>
              </div>
              </div>
            </div>
          </div>

          {/* Section 3: Projects (Horizontal Scroll) */}
          <div id="projects" ref={projectsContainerRef} className="h-screen w-full flex items-center overflow-hidden mb-[25vh]">
             <div ref={projectsWrapperRef} className="flex flex-row gap-16 px-12 md:px-24 w-max h-[70vh] items-center">
                {/* Horizontal Scroll Title */}
                <div className="w-[90vw] md:w-[40vw] flex items-center justify-start flex-shrink-0">
                  <h2 className="text-[#FAF0CA] text-6xl md:text-8xl font-display italic tracking-tight drop-shadow-[0_4px_24px_rgba(0,0,0,0.9)] leading-tight">
                    Featured<br/>Works
                  </h2>
                </div>

                {/* Project Cards */}
                <div className="w-[90vw] md:w-[45vw] h-full flex-shrink-0 rounded-3xl shadow-2xl border border-white/20 p-8 md:p-12 flex flex-col justify-end relative overflow-hidden transition-all duration-500 hover:border-[#FAF0CA]/60 hover:shadow-[0_0_40px_rgba(250,240,202,0.4)]"
                     style={{ backgroundColor: 'rgba(250, 240, 202, 0.15)', backdropFilter: 'blur(24px)' }}>
                   <ShieldAlert className="absolute top-6 right-6 md:top-10 md:right-10 text-[#0f4d92]/30 animate-float w-24 h-24 md:w-40 md:h-40" />
                   <Search className="absolute top-28 right-24 md:top-40 md:right-48 text-[#0f4d92]/20 animate-float-delayed w-16 h-16 md:w-20 md:h-20" />
                   <div className="relative z-10">
                     <h3 className="text-[#0f4d92] text-3xl md:text-5xl font-display italic mb-4 drop-shadow-[0_0_15px_rgba(250,240,202,0.9)]">Phishing Attack Investigation</h3>
                     <p className="text-[#FAF0CA]/90 text-base md:text-lg font-light leading-relaxed drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">Analyzed 30+ phishing samples using Wireshark, VirusTotal, and URLScan to identify malicious domains and extract key indicators, strengthening investigative skills for real-world cyber threat operations.</p>
                   </div>
                </div>

                <div className="w-[90vw] md:w-[45vw] h-full flex-shrink-0 rounded-3xl shadow-2xl border border-white/20 p-8 md:p-12 flex flex-col justify-end relative overflow-hidden transition-all duration-500 hover:border-[#FAF0CA]/60 hover:shadow-[0_0_40px_rgba(250,240,202,0.4)]"
                     style={{ backgroundColor: 'rgba(250, 240, 202, 0.15)', backdropFilter: 'blur(24px)' }}>
                   <Bug className="absolute top-8 right-8 md:top-12 md:right-12 text-[#0f4d92]/30 animate-float-delayed w-20 h-20 md:w-36 md:h-36" />
                   <Activity className="absolute top-28 right-24 md:top-40 md:right-40 text-[#0f4d92]/20 animate-float w-16 h-16 md:w-24 md:h-24" />
                   <div className="relative z-10">
                     <h3 className="text-[#0f4d92] text-3xl md:text-5xl font-display italic mb-4 drop-shadow-[0_0_15px_rgba(250,240,202,0.9)]">Malware Analysis & Containment</h3>
                     <p className="text-[#FAF0CA]/90 text-base md:text-lg font-light leading-relaxed drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">Performed static and dynamic analysis on malware samples using PEStudio, ProcMon, and Any.Run to reveal infection vectors. Reduced analysis time by 20% by automating behavioral observation workflows.</p>
                   </div>
                </div>

                <div className="w-[90vw] md:w-[45vw] h-full flex-shrink-0 rounded-3xl shadow-2xl border border-white/20 p-8 md:p-12 flex flex-col justify-end relative overflow-hidden transition-all duration-500 hover:border-[#FAF0CA]/60 hover:shadow-[0_0_40px_rgba(250,240,202,0.4)]"
                     style={{ backgroundColor: 'rgba(250, 240, 202, 0.15)', backdropFilter: 'blur(24px)' }}>
                   <Network className="absolute top-6 right-6 md:top-10 md:right-10 text-[#0f4d92]/30 animate-float w-24 h-24 md:w-40 md:h-40" />
                   <Zap className="absolute top-32 right-32 md:top-44 md:right-52 text-[#0f4d92]/20 animate-float-delayed w-16 h-16 md:w-24 md:h-24" />
                   <div className="relative z-10">
                     <h3 className="text-[#0f4d92] text-3xl md:text-5xl font-display italic mb-4 drop-shadow-[0_0_15px_rgba(250,240,202,0.9)]">DDoS Detection & Response</h3>
                     <p className="text-[#FAF0CA]/90 text-base md:text-lg font-light leading-relaxed drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">Simulated DDoS attacks to evaluate network resilience and detect anomalies using Wireshark and Nmap. Applied mitigation strategies with Fail2Ban and Snort to reduce downtime in test scenarios.</p>
                   </div>
                </div>

                <div className="w-[90vw] md:w-[45vw] h-full flex-shrink-0 rounded-3xl shadow-2xl border border-white/20 p-8 md:p-12 flex flex-col justify-end relative overflow-hidden transition-all duration-500 hover:border-[#FAF0CA]/60 hover:shadow-[0_0_40px_rgba(250,240,202,0.4)]"
                     style={{ backgroundColor: 'rgba(250, 240, 202, 0.15)', backdropFilter: 'blur(24px)' }}>
                   <Code className="absolute top-4 right-8 md:top-8 md:right-12 text-[#0f4d92]/30 animate-float-delayed w-28 h-28 md:w-48 md:h-48" />
                   <Trophy className="absolute top-28 right-28 md:top-40 md:right-48 text-[#0f4d92]/20 animate-float w-16 h-16 md:w-20 md:h-20" />
                   <div className="relative z-10">
                     <h3 className="text-[#0f4d92] text-3xl md:text-5xl font-display italic mb-4 drop-shadow-[0_0_15px_rgba(250,240,202,0.9)]">The Big Code 2026</h3>
                     <p className="text-[#FAF0CA]/90 text-base md:text-lg font-light leading-relaxed drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">Competed in Google India's national coding challenge, achieving a rank in the top 15,000. This experience honed my efficiency, edge-case thinking, and structured problem-solving under strict time constraints.</p>
                   </div>
                </div>

             </div>
          </div>
          
          {/* Section 4: Contact */}
          <div id="contact" className="min-h-screen flex items-center justify-center px-6">
            <div 
              ref={el => { if (el) textSectionsRef.current[2] = el; }}
              className="px-8 py-10 md:px-14 md:py-12 rounded-3xl shadow-2xl border border-white/20 text-center max-w-2xl transform-gpu flex flex-col items-center transition-all duration-500 hover:border-[#FAF0CA]/60 hover:shadow-[0_0_40px_rgba(250,240,202,0.4)]"
              style={{ backgroundColor: 'rgba(250, 240, 202, 0.15)', backdropFilter: 'blur(24px)' }}
            >
              <h2 className="text-[#0f4d92] text-5xl md:text-7xl font-display italic tracking-tight mb-4 drop-shadow-[0_0_15px_rgba(250,240,202,0.9)]">
                Let's Build Together
              </h2>
              <p className="text-[#FAF0CA]/80 text-lg md:text-xl font-light mb-10 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                Ready to create something secure and beautiful? Let's connect.
              </p>
              
              {/* Social Links using Yale Blue for accent */}
              <div className="flex gap-6 mb-10">
                <a href="mailto:sarvesh.chidhambaradas@gmail.com" className="p-4 bg-[#FAF0CA] text-[#0f4d92] rounded-full hover:scale-110 transition-transform shadow-[0_4px_20px_rgba(250,240,202,0.3)]">
                   <Mail size={24} />
                </a>
                <a href="https://linkedin.com/in/sarvesh-c" target="_blank" rel="noreferrer" className="p-4 bg-[#FAF0CA] text-[#0f4d92] rounded-full hover:scale-110 transition-transform shadow-[0_4px_20px_rgba(250,240,202,0.3)]">
                   <Linkedin size={24} />
                </a>
                <a href="https://github.com/Sarvesh-5705" target="_blank" rel="noreferrer" className="p-4 bg-[#FAF0CA] text-[#0f4d92] rounded-full hover:scale-110 transition-transform shadow-[0_4px_20px_rgba(250,240,202,0.3)]">
                   <Github size={24} />
                </a>
              </div>

              <button 
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="bg-transparent border border-[#FAF0CA] text-[#FAF0CA] hover:bg-[#FAF0CA] hover:text-[#0f4d92] px-10 py-4 rounded-full text-sm font-bold transition-all hover:scale-105 active:scale-95 uppercase tracking-widest drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]"
              >
                Back to Top
              </button>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
