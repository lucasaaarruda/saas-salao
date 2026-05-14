import type { HTMLAttributes } from "react"
import { cn } from "@/lib/utils"

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn("shimmer rounded-md", className)} />
}

type SkeletonPreset = "card" | "tabela" | "lista" | "formulario" | "metrica"

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  preset?: SkeletonPreset
  lines?: number
}

function Skeleton({ className, preset, lines = 3, ...props }: SkeletonProps) {
  if (preset === "metrica") {
    return (
      <div className={cn("rounded-lg border border-border bg-card p-5 space-y-3", className)} {...props}>
        <SkeletonBlock className="h-3 w-20" />
        <SkeletonBlock className="h-8 w-28" />
        <SkeletonBlock className="h-3 w-16" />
      </div>
    )
  }

  if (preset === "card") {
    return (
      <div className={cn("rounded-lg border border-border bg-card p-5 space-y-4", className)} {...props}>
        <div className="flex items-center gap-3">
          <SkeletonBlock className="h-9 w-9 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <SkeletonBlock className="h-3 w-32" />
            <SkeletonBlock className="h-3 w-20" />
          </div>
        </div>
        <SkeletonBlock className="h-3 w-full" />
        <SkeletonBlock className="h-3 w-4/5" />
        <SkeletonBlock className="h-3 w-3/5" />
      </div>
    )
  }

  if (preset === "lista") {
    return (
      <div className={cn("space-y-2", className)} {...props}>
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
            <SkeletonBlock className="h-8 w-8 rounded-full shrink-0" />
            <div className="flex-1 space-y-1.5">
              <SkeletonBlock className="h-3 w-36" />
              <SkeletonBlock className="h-3 w-24" />
            </div>
            <SkeletonBlock className="h-5 w-16 rounded-full" />
          </div>
        ))}
      </div>
    )
  }

  if (preset === "tabela") {
    return (
      <div className={cn("space-y-px", className)} {...props}>
        <div className="flex gap-4 px-4 py-2">
          {[40, 28, 20, 12].map((w, i) => (
            <SkeletonBlock key={i} className={`h-2.5 w-${w}`} />
          ))}
        </div>
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="flex gap-4 px-4 py-3 border-t border-border">
            {[40, 28, 20, 12].map((w, j) => (
              <SkeletonBlock key={j} className={`h-3 w-${w}`} />
            ))}
          </div>
        ))}
      </div>
    )
  }

  if (preset === "formulario") {
    return (
      <div className={cn("space-y-4", className)} {...props}>
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <SkeletonBlock className="h-3 w-24" />
            <SkeletonBlock className="h-10 w-full rounded-md" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={cn("shimmer rounded-md", className)} {...props} />
  )
}

export { Skeleton }
