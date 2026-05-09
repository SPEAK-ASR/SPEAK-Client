import { Settings2 } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../../components/ui/accordion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Label } from "../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Slider } from "../../components/ui/slider";
import { Switch } from "../../components/ui/switch";
import { VIDEO_DOMAINS } from "../../lib/domains";
import type { VideoSettings } from "../../types/queue";

interface BatchSettingsCardProps {
  settings: VideoSettings;
  onChange: (s: VideoSettings) => void;
  disabled?: boolean;
}

export function BatchSettingsCard({
  settings,
  onChange,
  disabled,
}: BatchSettingsCardProps) {
  const set = <K extends keyof VideoSettings>(k: K, v: VideoSettings[K]) =>
    onChange({ ...settings, [k]: v });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-md bg-muted text-muted-foreground shrink-0">
            <Settings2 className="size-4" />
          </span>
          <div>
            <CardTitle className="text-base">Batch defaults</CardTitle>
            <CardDescription>
              Applied to new videos. Overridable per row.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="b-domain">
            Default category <span className="text-destructive">*</span>
          </Label>
          <Select
            value={settings.domain}
            onValueChange={(v) => set("domain", v)}
            disabled={disabled}
          >
            <SelectTrigger id="b-domain">
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
              {settings.vadThreshold.toFixed(2)}
            </span>
          </div>
          <Slider
            value={[settings.vadThreshold]}
            min={0}
            max={1}
            step={0.01}
            onValueChange={(v) => set("vadThreshold", v[0])}
            disabled={disabled}
            aria-label="Default VAD threshold"
          />
        </div>

        <Accordion type="single" collapsible>
          <AccordionItem value="adv" className="border rounded-md px-3">
            <AccordionTrigger className="hover:no-underline">
              Additional defaults
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-1">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Start padding</Label>
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {settings.startPadding.toFixed(1)}s
                      </span>
                    </div>
                    <Slider
                      value={[settings.startPadding]}
                      min={0}
                      max={5}
                      step={0.1}
                      onValueChange={(v) => set("startPadding", v[0])}
                      disabled={disabled}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">End padding</Label>
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {settings.endPadding.toFixed(1)}s
                      </span>
                    </div>
                    <Slider
                      value={[settings.endPadding]}
                      min={0}
                      max={5}
                      step={0.1}
                      onValueChange={(v) => set("endPadding", v[0])}
                      disabled={disabled}
                    />
                  </div>
                </div>

                <label
                  className="flex items-center justify-between rounded-md border border-border bg-background/30 px-3 py-2 cursor-pointer"
                >
                  <div>
                    <p className="text-sm font-medium">
                      Auto-clean failed transcriptions
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Remove clips that fail to transcribe before saving.
                    </p>
                  </div>
                  <Switch
                    checked={settings.autoCleanNullTranscriptions}
                    onCheckedChange={(v) =>
                      set("autoCleanNullTranscriptions", v)
                    }
                    disabled={disabled}
                  />
                </label>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
