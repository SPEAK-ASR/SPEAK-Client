import { useState } from "react";
import { ChevronDown, ChevronUp, Copy, FileText, Send } from "lucide-react";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";

interface ReferenceCardProps {
  title: string;
  text: string;
  description?: string;
  onCopy: () => void;
  onCopyNoScore: () => void;
}

export function ReferenceCard({
  title,
  text,
  description,
  onCopy,
  onCopyNoScore,
}: ReferenceCardProps) {
  const [open, setOpen] = useState(text.length < 240);

  return (
    <TooltipProvider delayDuration={200}>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <span className="flex size-8 items-center justify-center rounded-md bg-info/10 text-info shrink-0">
                <FileText className="size-4" />
              </span>
              <div className="min-w-0">
                <CardTitle className="text-sm truncate">{title}</CardTitle>
                {description && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {description}
                  </p>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setOpen((o) => !o)}
              aria-label={open ? "Collapse" : "Expand"}
            >
              {open ? (
                <ChevronUp className="size-4" />
              ) : (
                <ChevronDown className="size-4" />
              )}
            </Button>
          </div>
        </CardHeader>
        {open && (
          <CardContent className="pt-0 space-y-3">
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words rounded-md bg-background/50 border border-border p-3">
              {text}
            </p>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" onClick={onCopyNoScore}>
                    <Copy className="size-3.5" />
                    Copy
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Copies text only — no scoring.</TooltipContent>
              </Tooltip>
              <Button size="sm" onClick={onCopy}>
                <Send className="size-3.5" />
                Copy into editor
              </Button>
            </div>
          </CardContent>
        )}
      </Card>
    </TooltipProvider>
  );
}
