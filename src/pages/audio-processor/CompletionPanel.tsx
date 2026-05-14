import { CheckCircle2, RefreshCcw } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { fadeUp, stagger } from "../../lib/motion";

interface CompletionPanelProps {
  totalClips: number;
  transcriptionCount: number;
  onReset: () => void;
}

export function CompletionPanel({
  totalClips,
  transcriptionCount,
  onReset,
}: CompletionPanelProps) {
  const successPct =
    totalClips > 0
      ? Math.round((transcriptionCount / totalClips) * 100)
      : 0;

  const stats = [
    { label: "Total clips", value: totalClips },
    { label: "Transcribed", value: transcriptionCount },
    { label: "Success rate", value: `${successPct}%` },
  ];

  return (
    <motion.div
      variants={stagger(0.06)}
      initial="hidden"
      animate="show"
      className="max-w-2xl mx-auto"
    >
      <Card>
        <CardContent className="pt-12 pb-10 flex flex-col items-center text-center">
          <motion.span
            variants={fadeUp}
            className="flex size-14 items-center justify-center rounded-full bg-success/15 text-success mb-4"
          >
            <CheckCircle2 className="size-7" />
          </motion.span>

          <motion.h2 variants={fadeUp} className="text-xl font-semibold">
            Processing complete
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="text-sm text-muted-foreground mt-1"
          >
            Audio clips and transcriptions are saved.
          </motion.p>

          <motion.div
            variants={fadeUp}
            className="grid grid-cols-3 gap-3 w-full max-w-md mt-8"
          >
            {stats.map((s) => (
              <div
                key={s.label}
                className="rounded-lg border border-border bg-background/40 p-4"
              >
                <p className="text-2xl font-semibold tabular-nums">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </motion.div>

          <motion.div variants={fadeUp} className="mt-8">
            <Button onClick={onReset}>
              <RefreshCcw className="size-4" />
              Process another video
            </Button>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
