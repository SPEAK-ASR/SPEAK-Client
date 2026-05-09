import { Loader2, Send, ShieldAlert, SkipForward } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";

interface ActionBarProps {
  submitting: boolean;
  loading: boolean;
  hasData: boolean;
  onUnsuitableClick: () => void;
  onSkip: () => void;
}

export function ActionBar({
  submitting,
  loading,
  hasData,
  onUnsuitableClick,
  onSkip,
}: ActionBarProps) {
  const disabled = !hasData || loading || submitting;

  return (
    <Card className="mt-4 sticky bottom-4 md:bottom-0 md:rounded-xl md:relative">
      <CardContent className="pt-4 pb-4 flex flex-wrap items-center gap-2 justify-between">
        <Button
          variant="ghost"
          onClick={onUnsuitableClick}
          disabled={disabled}
        >
          <ShieldAlert className="size-4" />
          This audio is not suitable
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={onSkip} disabled={disabled}>
            <SkipForward className="size-4" />
            Skip
          </Button>
          <Button type="submit" disabled={disabled}>
            {submitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
            Submit transcription
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
