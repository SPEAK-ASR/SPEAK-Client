import { Loader2 } from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";

interface LoadingPanelProps {
  title: string;
  description?: string;
}

export function LoadingPanel({ title, description }: LoadingPanelProps) {
  return (
    <Card>
      <CardContent className="pt-12 pb-12 flex flex-col items-center text-center">
        <span className="relative flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
          <Loader2 className="size-6 animate-spin" />
          <span className="absolute inset-0 rounded-full bg-primary/10 animate-ping" />
        </span>
        <h3 className="text-base font-semibold">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground mt-1 max-w-md">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
