"use client"

import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface TransactionProgressBarProps {
  currentStep: number
  totalSteps: number
  type?: "deposit" | "withdrawal"
  className?: string
}

export function TransactionProgressBar({
  currentStep,
  totalSteps,
  type, // reserved for future styling differences
  className,
}: TransactionProgressBarProps) {
  const safeTotal = Math.max(totalSteps, 1)
  const clampedStep = Math.min(Math.max(currentStep, 1), safeTotal)
  const progress = (clampedStep / safeTotal) * 100
  const stepsArray = Array.from({ length: safeTotal }, (_, i) => i + 1)

  return (
    <div className={cn("w-full", className)}>
      {/* Steps Row */}
      <div className="flex items-center justify-between mb-4">
        {stepsArray.map((stepNumber) => {
          const isCompleted = stepNumber < clampedStep
          const isCurrent = stepNumber === clampedStep

          return (
            <div key={stepNumber} className="flex flex-col items-center">
              <div
                className={cn(
                  "w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 flex items-center justify-center transition-all duration-300",
                  isCompleted && "bg-primary text-primary-foreground border-primary",
                  isCurrent &&
                    "bg-primary text-primary-foreground border-primary ring-2 ring-primary/30",
                  !isCompleted &&
                    !isCurrent &&
                    "bg-background text-muted-foreground border-border",
                )}
              >
                {isCompleted ? (
                  <Check className="h-3 w-3 sm:h-4 sm:w-4" />
                ) : (
                  <span className="text-xs sm:text-sm font-semibold">{stepNumber}</span>
                )}
              </div>

              {/* Current step text & percentage */}
              {isCurrent && (
                <div className="mt-2 text-center">
                  <p className="text-xs sm:text-sm font-medium text-foreground">
                    Étape {clampedStep}
                  </p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    {`${Math.round(progress)}% complété`}
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Horizontal Progress Bar with pulse overlay */}
      <div className="relative h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
        {progress > 0 && progress < 100 && (
          <div
            className="absolute top-0 h-2 bg-primary/50 rounded-full animate-pulse"
            style={{ width: `${progress}%` }}
          />
        )}
      </div>
    </div>
  )
}
