import { cn } from "@/lib/utils";

export function BabyElephantMascot({
  mood = "happy",
  className,
}: {
  mood?: "happy" | "thinking" | "celebrate";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative mx-auto aspect-square w-32 overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary/20 via-background to-accent/20 p-3 shadow-sm",
        className,
      )}
      aria-hidden="true"
    >
      <svg viewBox="0 0 180 180" className="size-full">
        <circle cx="90" cy="96" r="52" fill="currentColor" className="text-slate-300 dark:text-slate-600" />
        <circle cx="48" cy="92" r="31" fill="currentColor" className="text-slate-300 dark:text-slate-600" />
        <circle cx="132" cy="92" r="31" fill="currentColor" className="text-slate-300 dark:text-slate-600" />
        <circle cx="66" cy="86" r="5" fill="currentColor" className="text-slate-900 dark:text-white" />
        <circle cx="114" cy="86" r="5" fill="currentColor" className="text-slate-900 dark:text-white" />
        <path
          d="M84 98c5 8 7 18 5 31-2 13-9 20-18 22"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="16"
          className="text-slate-300 dark:text-slate-600"
        />
        <path
          d={
            mood === "thinking"
              ? "M77 107c8 5 18 5 26 0"
              : mood === "celebrate"
                ? "M76 106c9 13 23 13 32 0"
                : "M78 108c8 9 20 9 28 0"
          }
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="5"
          className="text-slate-900 dark:text-white"
        />
        <path d="M49 48l10 16M131 48l-10 16" stroke="currentColor" strokeLinecap="round" strokeWidth="6" className="text-primary" />
        {mood === "celebrate" ? (
          <>
            <circle cx="38" cy="38" r="4" className="fill-primary" />
            <circle cx="142" cy="36" r="4" className="fill-amber-400" />
            <circle cx="154" cy="70" r="3" className="fill-emerald-400" />
          </>
        ) : null}
      </svg>
    </div>
  );
}
