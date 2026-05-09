import { CheckCircle2, Loader2, Play, Square, XCircle } from "lucide-react";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Progress } from "../../components/ui/progress";
import { CONCURRENT_VIDEO_LIMIT } from "../../types/queue";

interface RunControlBarProps {
  isProcessing: boolean;
  hasVideosToProcess: boolean;
  overallProgress: number;
  counts: { pending: number; processing: number; complete: number; error: number };
  onStart: () => void;
  onStop: () => void;
}

export function RunControlBar({
  isProcessing,
  hasVideosToProcess,
  overallProgress,
  counts,
  onStart,
  onStop,
}: RunControlBarProps) {
  return (
    <Card className="mb-3">
      <CardContent className="pt-4 pb-4">
        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={isProcessing ? onStop : onStart}
            variant={isProcessing ? "destructive" : "default"}
            disabled={!hasVideosToProcess && !isProcessing}
            className="min-w-[10rem]"
          >
            {isProcessing ? (
              <>
                <Square className="size-4" />
                Stop
              </>
            ) : (
              <>
                <Play className="size-4" />
                Start processing
              </>
            )}
          </Button>

          <div className="flex-1 min-w-[12rem]">
            {isProcessing && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">
                  Overall progress · {overallProgress}%
                </p>
                <Progress value={overallProgress} />
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {isProcessing && (
              <Badge variant="info" className="gap-1.5">
                <Loader2 className="size-3 animate-spin" />
                {counts.processing}/{CONCURRENT_VIDEO_LIMIT} slots
              </Badge>
            )}
            <Badge variant="outline">{counts.pending} pending</Badge>
            <Badge variant="success" className="gap-1.5">
              <CheckCircle2 className="size-3" />
              {counts.complete} done
            </Badge>
            {counts.error > 0 && (
              <Badge variant="destructive" className="gap-1.5">
                <XCircle className="size-3" />
                {counts.error} failed
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
