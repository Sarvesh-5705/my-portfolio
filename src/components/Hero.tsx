import { Button } from "@/components/ui/button";

export default function Hero() {
  return (
    <section className="relative z-10 flex flex-col items-center justify-center text-center px-10 flex-1 py-20">
      <div className="max-w-[1400px] w-full flex flex-col items-center">
        <h1 
          className="text-[clamp(3.5rem,10vw,8rem)] leading-[0.9] tracking-[-0.05em] font-normal font-display animate-fade-rise text-white"
        >
          Where <em className="not-italic text-muted-foreground/60">dreams</em> rise <br className="hidden lg:block" /> <em className="not-italic text-muted-foreground/60">through the silence.</em>
        </h1>

        <p className="text-muted-foreground text-[clamp(1.1rem,1.5vw,1.4rem)] max-w-3xl mt-12 leading-relaxed animate-fade-rise-delay font-light">
          We're designing tools for deep thinkers, bold creators, and quiet rebels. 
          Amid the chaos, we build digital spaces for sharp focus and inspired work.
        </p>

        <Button
          className="liquid-glass rounded-full px-12 py-6 text-base uppercase tracking-[0.2em] text-white mt-16 hover:scale-[1.03] transition-all duration-700 cursor-pointer bg-white/5 border-none animate-fade-rise-delay-2"
        >
          Begin Journey
        </Button>
      </div>
    </section>
  );
}
