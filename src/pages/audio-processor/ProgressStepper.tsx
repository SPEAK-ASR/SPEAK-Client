import {
  Check,
  CloudUpload,
  FileAudio,
  Link as LinkIcon,
  Loader2,
  Mic,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import type { ProcessingStep } from "../AudioProcessorPage";
import { cn } from "../../lib/utils";

interface StepDef {
  key: ProcessingStep;
  label: string;
  icon: LucideIcon;
}

const STEPS: StepDef[] = [
  { key: "input", label: "Input", icon: LinkIcon },
  { key: "processing", label: "Splitting", icon: FileAudio },
  { key: "clips", label: "Clips", icon: Mic },
  { key: "transcription", label: "Transcribe", icon: Sparkles },
  { key: "storage", label: "Save", icon: CloudUpload },
  { key: "complete", label: "Done", icon: Check },
];

interface ProgressStepperProps {
  currentStep: ProcessingStep;
  isProcessing?: boolean;
}

export function ProgressStepper({
  currentStep,
  isProcessing,
}: ProgressStepperProps) {
  const currentIndex = STEPS.findIndex((s) => s.key === currentStep);

  return (
    <div className="rounded-xl border border-border bg-card/30 p-4 mb-6">
      <ol className="flex items-center gap-2">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          const completed = i < currentIndex;
          const active = i === currentIndex;
          const showSpinner = active && isProcessing;

          return (
            <li
              key={step.key}
              className="flex items-center gap-2 min-w-0 flex-1"
            >
              <div
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full border transition-colors",
                  completed && "bg-primary border-primary text-primary-foreground",
                  active && !completed && "border-primary text-primary",
                  !completed && !active && "border-border text-muted-foreground",
                )}
              >
                {showSpinner ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : completed ? (
                  <Check className="size-4" strokeWidth={3} />
                ) : (
                  <Icon className="size-4" />
                )}
              </div>
              <span
                className={cn(
                  "text-xs font-medium hidden sm:inline truncate",
                  active && "text-foreground",
                  !active && !completed && "text-muted-foreground",
                  completed && "text-foreground/80",
                )}
              >
                {step.label}
              </span>
              {i < STEPS.length - 1 && (
                <span
                  className={cn(
                    "flex-1 h-px transition-colors",
                    completed ? "bg-primary" : "bg-border",
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
