import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Award, Loader2, ShieldAlert } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";

interface UnsuitableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (note?: string) => Promise<void> | void;
}

export function UnsuitableDialog({
  open,
  onOpenChange,
  onConfirm,
}: UnsuitableDialogProps) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleConfirm() {
    setBusy(true);
    try {
      await onConfirm(note.trim() || undefined);
      setNote("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-md bg-warning/15 text-warning shrink-0">
              <ShieldAlert className="size-4" />
            </span>
            <div>
              <DialogTitle>Mark audio as unsuitable</DialogTitle>
              <DialogDescription>
                Use this when the clip is unintelligible, silent, or otherwise
                cannot be transcribed.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="space-y-2 mt-2">
          <Label htmlFor="unsuitable-note">Optional note</Label>
          <Textarea
            id="unsuitable-note"
            placeholder="Why is this audio unsuitable? (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            disabled={busy}
          />
        </div>
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={busy}
          >
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={busy}>
            {busy ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ShieldAlert className="size-4" />
            )}
            Mark unsuitable
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface PointCelebrationDialogProps {
  open: boolean;
  asrSystem?: "google" | "speak" | null;
  onOpenChange: (open: boolean) => void;
}

export function PointCelebrationDialog({
  open,
  asrSystem,
  onOpenChange,
}: PointCelebrationDialogProps) {
  const label =
    asrSystem === "google"
      ? "Google Speech-to-Text"
      : asrSystem === "speak"
        ? "SPEAK Sinhala ASR"
        : "Reference";

  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => {
      onOpenChange(false);
    }, 2000);
    return () => window.clearTimeout(id);
  }, [open, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showClose={false}
        className="max-w-sm text-center pt-8 pb-7"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center"
        >
          <span className="flex size-16 items-center justify-center rounded-full bg-success/15 text-success mb-4">
            <Award className="size-8" />
          </span>
          <DialogTitle className="text-lg">+1 point awarded</DialogTitle>
          <DialogDescription className="mt-1.5">
            {label} just earned a point. Loading the next clip…
          </DialogDescription>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
