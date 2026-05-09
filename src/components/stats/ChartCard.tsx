import * as React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../ui/card";
import { cn } from "../../lib/utils";

interface ChartCardProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
  height?: number | string;
}

export function ChartCard({
  title,
  description,
  actions,
  className,
  children,
  height = 280,
}: ChartCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2 flex flex-row items-start justify-between gap-3">
        <div className="min-w-0">
          <CardTitle className="text-sm">{title}</CardTitle>
          {description && (
            <CardDescription className="text-xs mt-0.5">
              {description}
            </CardDescription>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2 shrink-0">{actions}</div>
        )}
      </CardHeader>
      <CardContent>
        <div style={{ height }} className="w-full">
          {children}
        </div>
      </CardContent>
    </Card>
  );
}

export const CHART_COLORS = {
  primary: "hsl(220 70% 60%)",
  success: "hsl(142 60% 45%)",
  warning: "hsl(38 92% 55%)",
  destructive: "hsl(0 70% 55%)",
  info: "hsl(200 80% 55%)",
  muted: "hsl(0 0% 64%)",
  // categorical palette
  cat: [
    "hsl(220 70% 60%)",
    "hsl(280 65% 60%)",
    "hsl(160 60% 50%)",
    "hsl(38 92% 55%)",
    "hsl(0 70% 60%)",
    "hsl(195 80% 55%)",
    "hsl(330 60% 60%)",
    "hsl(80 60% 55%)",
  ],
};

export const TOOLTIP_STYLES = {
  contentStyle: {
    background: "hsl(0 0% 9%)",
    border: "1px solid hsl(0 0% 16%)",
    borderRadius: 8,
    fontSize: 12,
    color: "hsl(0 0% 98%)",
  },
  labelStyle: { color: "hsl(0 0% 64%)", fontSize: 11 },
  itemStyle: { color: "hsl(0 0% 98%)" },
  cursor: { fill: "hsl(0 0% 16%)", opacity: 0.4 },
};
