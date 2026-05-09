import { useEffect, useState } from "react";
import { Loader2, Send, Settings2, Youtube } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../../components/ui/accordion";
import { Alert, AlertDescription } from "../../components/ui/alert";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Slider } from "../../components/ui/slider";
import { audioApi, extractApiError } from "../../lib/api";
import type { ClipData, VideoMetadata } from "../../lib/api";
import { VIDEO_DOMAINS } from "../../lib/domains";

const YT_REGEX = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;

interface UrlFormProps {
  onSubmit: () => void;
  onClipsGenerated: (
    videoId: string,
    metadata: VideoMetadata,
    clips: ClipData[],
  ) => void;
  onError: (message: string) => void;
  initialError?: string | null;
}

export function UrlForm({
  onSubmit,
  onClipsGenerated,
  onError,
  initialError,
}: UrlFormProps) {
  const [url, setUrl] = useState("");
  const [domain, setDomain] = useState("");
  const [vad, setVad] = useState(0.5);
  const [startPad, setStartPad] = useState(1);
  const [endPad, setEndPad] = useState(0.5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [warning, setWarning] = useState<string | null>(null);

  useEffect(() => {
    setError(initialError ?? null);
  }, [initialError]);

  const urlInvalid = url.length > 0 && !YT_REGEX.test(url);
  const canSubmit = url.trim() !== "" && !urlInvalid && domain && !loading;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    setWarning(null);
    onSubmit();
    try {
      const res = await audioApi.splitAudio(url, domain, vad, startPad, endPad);
      if (res.success) {
        onClipsGenerated(res.video_id, res.video_metadata, res.clips);
      } else {
        const msg = "Failed to process the YouTube video.";
        setError(msg);
        onError(msg);
      }
    } catch (err) {
      const ax = extractApiError(err);
      if (ax.isWarning) {
        setWarning(ax.message);
      } else {
        setError(ax.message);
      }
      onError(ax.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-md bg-destructive/15 text-destructive shrink-0">
            <Youtube className="size-4" />
          </span>
          <div>
            <CardTitle>Process a YouTube video</CardTitle>
            <CardDescription>
              Audio will be split using voice activity detection.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="yt-url">YouTube URL</Label>
            <Input
              id="yt-url"
              type="url"
              placeholder="https://www.youtube.com/watch?v=…"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (error) setError(null);
              }}
              aria-invalid={urlInvalid || undefined}
              disabled={loading}
            />
            {urlInvalid && (
              <p className="text-xs text-destructive">
                Please enter a valid YouTube URL.
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="yt-domain">
              Category <span className="text-destructive">*</span>
            </Label>
            <Select
              value={domain}
              onValueChange={(v) => {
                setDomain(v);
                if (error) setError(null);
              }}
              disabled={loading}
            >
              <SelectTrigger id="yt-domain">
                <SelectValue placeholder="Select category…" />
              </SelectTrigger>
              <SelectContent>
                {VIDEO_DOMAINS.map((d) => (
                  <SelectItem key={d.value} value={d.value}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>VAD threshold</Label>
              <span className="text-xs tabular-nums text-muted-foreground">
                {vad.toFixed(2)}
              </span>
            </div>
            <Slider
              value={[vad]}
              min={0}
              max={1}
              step={0.01}
              onValueChange={(v) => setVad(v[0])}
              disabled={loading}
              aria-label="VAD threshold"
            />
          </div>

          <Accordion type="single" collapsible>
            <AccordionItem value="advanced" className="border rounded-md px-3">
              <AccordionTrigger className="hover:no-underline">
                <span className="flex items-center gap-2">
                  <Settings2 className="size-4 text-muted-foreground" />
                  Advanced options
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Start padding</Label>
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {startPad.toFixed(1)}s
                      </span>
                    </div>
                    <Slider
                      value={[startPad]}
                      min={0}
                      max={5}
                      step={0.1}
                      onValueChange={(v) => setStartPad(v[0])}
                      disabled={loading}
                      aria-label="Start padding"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">End padding</Label>
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {endPad.toFixed(1)}s
                      </span>
                    </div>
                    <Slider
                      value={[endPad]}
                      min={0}
                      max={5}
                      step={0.1}
                      onValueChange={(v) => setEndPad(v[0])}
                      disabled={loading}
                      aria-label="End padding"
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {warning && (
            <Alert variant="warning">
              <AlertDescription>{warning}</AlertDescription>
            </Alert>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            <Button type="submit" disabled={!canSubmit}>
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
              {loading ? "Processing…" : "Process video"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
