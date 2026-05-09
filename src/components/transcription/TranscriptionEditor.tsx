import { useEffect, useRef, useState } from "react";
import { Languages, Pencil } from "lucide-react";
import { useSinhalaIme } from "../../hooks/useSinhalaIme";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Switch } from "../ui/switch";
import { Textarea } from "../ui/textarea";
import { cn } from "../../lib/utils";
import {
  SPEAKER_OPTIONS,
  type TranscriptionMetadata,
} from "../../types/transcription";

interface TranscriptionEditorProps {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  metadata: TranscriptionMetadata;
  onMetadataChange: (
    key: keyof TranscriptionMetadata,
    value: boolean | string,
  ) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function TranscriptionEditor({
  textareaRef,
  metadata,
  onMetadataChange,
  placeholder = "Type what you hear…",
  disabled,
}: TranscriptionEditorProps) {
  const toggleRef = useRef<HTMLInputElement>(null);
  const chipRef = useRef<HTMLButtonElement>(null);
  const [imeOn, setImeOn] = useState(true);
  const [text, setText] = useState("");

  useSinhalaIme({ textareaRef, toggleRef, chipRef });

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    const onInput = () => setText(el.value);
    el.addEventListener("input", onInput);
    setText(el.value);
    return () => {
      el.removeEventListener("input", onInput);
    };
  }, [textareaRef]);

  const charCount = text.length;
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <Card className="lg:sticky lg:top-20 self-start">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary shrink-0">
              <Pencil className="size-4" />
            </span>
            <div>
              <CardTitle>Transcription</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Output language: Sinhala
              </p>
            </div>
          </div>
          <label
            className={cn(
              "flex items-center gap-2 cursor-pointer select-none rounded-md px-2 py-1.5",
              "hover:bg-accent",
            )}
          >
            <Languages className="size-4 text-muted-foreground" />
            <span className="text-xs">Sinhala IME</span>
            <Switch
              checked={imeOn}
              onCheckedChange={(v) => {
                setImeOn(v);
                if (toggleRef.current) {
                  toggleRef.current.checked = v;
                  toggleRef.current.dispatchEvent(
                    new Event("change", { bubbles: true }),
                  );
                }
              }}
            />
          </label>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Textarea
            ref={textareaRef}
            placeholder={placeholder}
            disabled={disabled}
            className="min-h-[220px] text-base leading-relaxed"
            onChange={(e) => setText(e.target.value)}
          />
          <div className="absolute bottom-2 right-3 text-[10px] uppercase tracking-wider text-muted-foreground pointer-events-none">
            {wordCount} words · {charCount} chars
          </div>
        </div>

        {/* Hidden IME helpers consumed by sin-phonetic-ime.js */}
        <input ref={toggleRef} type="checkbox" defaultChecked className="hidden" />
        <button ref={chipRef} type="button" className="hidden ime-chip">
          IME
        </button>

        <div className="space-y-1.5">
          <Label htmlFor="speaker-gender">Speaker gender</Label>
          <Select
            value={metadata.speakerGender || ""}
            onValueChange={(v) => onMetadataChange("speakerGender", v)}
            disabled={disabled}
          >
            <SelectTrigger id="speaker-gender">
              <SelectValue placeholder="Select…" />
            </SelectTrigger>
            <SelectContent>
              {SPEAKER_OPTIONS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <MetaCheckbox
            label="Background noise"
            description="Audible background sounds, music, etc."
            checked={metadata.hasNoise}
            onChange={(v) => onMetadataChange("hasNoise", v)}
            disabled={disabled}
          />
          <MetaCheckbox
            label="Code-mixing"
            description="Speaker mixes English / Tamil into Sinhala."
            checked={metadata.isCodeMixed}
            onChange={(v) => onMetadataChange("isCodeMixed", v)}
            disabled={disabled}
          />
          <MetaCheckbox
            label="Multiple speakers"
            description="More than one speaker, including overlapping speech."
            checked={metadata.isOverlap}
            onChange={(v) => onMetadataChange("isOverlap", v)}
            disabled={disabled}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function MetaCheckbox({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className="flex items-start gap-3 rounded-md border border-border bg-background/40 p-3 cursor-pointer hover:bg-accent transition-colors">
      <Checkbox
        checked={checked}
        onCheckedChange={(v) => onChange(Boolean(v))}
        disabled={disabled}
        className="mt-0.5"
      />
      <span>
        <span className="block text-sm font-medium">{label}</span>
        <span className="block text-xs text-muted-foreground">
          {description}
        </span>
      </span>
    </label>
  );
}
