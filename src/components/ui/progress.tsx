import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "../../lib/utils";

interface ProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  indeterminate?: boolean;
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, indeterminate, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-2 w-full overflow-hidden rounded-full bg-muted",
      className,
    )}
    {...props}
  >
    {indeterminate ? (
      <div
        className="h-full w-1/3 rounded-full bg-primary"
        style={{
          animation: "shimmer-slide 1.4s infinite ease-in-out",
        }}
      />
    ) : (
      <ProgressPrimitive.Indicator
        className="h-full bg-primary transition-transform duration-300 ease-out"
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    )}
    <style>
      {`@keyframes shimmer-slide { 0% { transform: translateX(-100%);} 50% { transform: translateX(150%);} 100% { transform: translateX(300%);} }`}
    </style>
  </ProgressPrimitive.Root>
));
Progress.displayName = "Progress";

export { Progress };
