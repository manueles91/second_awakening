import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      {/* Glow effect background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/3 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-lg">
        {/* Title */}
        <h1 className="mb-2 text-6xl font-extrabold tracking-tighter">
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
            ARISE
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mb-2 text-lg font-medium text-muted-foreground">
          Solo Leveling Life Coach
        </p>

        {/* Tagline */}
        <p className="mb-8 text-sm leading-relaxed text-muted-foreground/80">
          You have been chosen by the System. Complete real-life quests framed as
          fantasy missions. Level up your stats. Earn gear. Build your Shadow
          Army. Transform your life through a 12-month gamified program.
        </p>

        {/* CTA */}
        <div className="flex flex-col items-center gap-3">
          <Link href="/login">
            <Button size="lg" className="text-base font-semibold px-8">
              Begin Your Awakening
            </Button>
          </Link>
          <p className="text-xs text-muted-foreground">
            Free to play. Powered by AI.
          </p>
        </div>

        {/* Features */}
        <div className="mt-12 grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="mb-1 text-2xl font-bold text-primary">&#9876;</div>
            <div className="text-xs font-medium text-muted-foreground">
              AI Quests
            </div>
          </div>
          <div>
            <div className="mb-1 text-2xl font-bold text-primary">&#9889;</div>
            <div className="text-xs font-medium text-muted-foreground">
              Level Up
            </div>
          </div>
          <div>
            <div className="mb-1 text-2xl font-bold text-primary">&#9733;</div>
            <div className="text-xs font-medium text-muted-foreground">
              Rank S
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
