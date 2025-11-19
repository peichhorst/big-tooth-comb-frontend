// components/Hero.tsx
export default function Hero() {
  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-grit via-black to-grit">
      <div className="text-center z-10 px-6">
        <h1 
          data-text="BIG TOOTH COMB" 
          className="glitch font-display text-6xl md:text-9xl font-black tracking-tighter text-blood-500 drop-shadow-2xl"
        >
          BIG TOOTH COMB
        </h1>
        <p className="font-creepy text-3xl md:text-5xl text-red-400 mt-4 animate-pulse-slow">
          NO GODS • NO MANAGERS • JUST NOISE
        </p>
      </div>
    </section>
  );
}