import { useEffect, useState } from "react";

const steps = [
  { at: 0, label: "Finder adressen..." },
  { at: 1500, label: "Søger efter skoler og transport..." },
  { at: 4000, label: "Beregner områdescore..." },
] as const;

/**
 * Animated loading state that narrates progress while surroundings data loads.
 * Steps advance on a timer — not tied to real progress, but gives the user
 * clear feedback that something is happening.
 */
export function SurroundingsLoadingState() {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const timers = steps.slice(1).map((step, i) =>
      setTimeout(() => setCurrentStep(i + 1), step.at),
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex flex-col gap-3">
          {steps.map((step, i) => (
            <StepIndicator
              key={i}
              label={step.label}
              state={
                i < currentStep
                  ? "done"
                  : i === currentStep
                    ? "active"
                    : "pending"
              }
            />
          ))}
        </div>
      </div>
      <div className="h-[400px] animate-pulse rounded-xl bg-muted" />
    </div>
  );
}

function StepIndicator({
  label,
  state,
}: {
  label: string;
  state: "pending" | "active" | "done";
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full transition-colors duration-300 ${
          state === "done"
            ? "bg-primary text-primary-foreground"
            : state === "active"
              ? "bg-primary/20 text-primary"
              : "bg-muted text-muted-foreground"
        }`}
      >
        {state === "done" ? (
          <CheckIcon />
        ) : state === "active" ? (
          <Spinner />
        ) : (
          <EmptyDot />
        )}
      </div>
      <span
        className={`text-sm transition-colors duration-300 ${
          state === "pending"
            ? "text-muted-foreground"
            : "text-foreground"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      className="animate-spin"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

function EmptyDot() {
  return (
    <div className="h-2 w-2 rounded-full bg-current opacity-40" />
  );
}
