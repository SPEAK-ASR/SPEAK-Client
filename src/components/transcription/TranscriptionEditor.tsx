import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Languages, Pencil } from "lucide-react";
import { useSinhalaIme } from "../../hooks/useSinhalaIme";
import { Badge } from "../ui/badge";
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
  const imeControllerRef = useRef<SinhalaImeController | null>(null);
  const [imeOn, setImeOn] = useState(true);
  /** si/en while master IME is on — from sin-phonetic-ime.js (Ctrl+Space, chip). */
  const [scriptMode, setScriptMode] = useState<"si" | "en">("si");
  const [text, setText] = useState("");

  useSinhalaIme({
    textareaRef,
    toggleRef,
    chipRef,
    controllerRef: imeControllerRef,
  });

  const applyModeFromController = useCallback(() => {
    const c = imeControllerRef.current;
    const on = toggleRef.current?.checked ?? false;
    if (on && c) setScriptMode(c.mode);
    else setScriptMode("en");
  }, []);

  useLayoutEffect(() => {
    const input = toggleRef.current;
    if (!input) return;
    const syncFromToggle = () => {
      setImeOn(input.checked);
      queueMicrotask(applyModeFromController);
    };
    syncFromToggle();
    input.addEventListener("change", syncFromToggle);
    return () => input.removeEventListener("change", syncFromToggle);
  }, [applyModeFromController]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && !e.shiftKey && !e.altKey && e.code === "Space") {
        queueMicrotask(applyModeFromController);
      }
    };
    ta.addEventListener("keydown", onKeyDown);
    return () => ta.removeEventListener("keydown", onKeyDown);
  }, [textareaRef, applyModeFromController]);

  useEffect(() => {
    const chip = chipRef.current;
    if (!chip) return;
    const onChipClick = () => queueMicrotask(applyModeFromController);
    chip.addEventListener("click", onChipClick);
    return () => chip.removeEventListener("click", onChipClick);
  }, [applyModeFromController]);

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
      {/* Hidden IME helpers consumed by sin-phonetic-ime.js — before header so refs exist early */}
      <input ref={toggleRef} type="checkbox" defaultChecked className="hidden" />
      <button ref={chipRef} type="button" className="hidden ime-chip">
        IME
      </button>
      <CardHeader className="pb-3 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary shrink-0">
              <Pencil className="size-4" aria-hidden />
            </span>
            <div className="min-w-0">
              <CardTitle>Transcription</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Type in Sinhala script. Use the switch for phonetic IME vs English
                keyboard.
              </p>
            </div>
          </div>
          <label
            className={cn(
              "flex items-center gap-2 cursor-pointer select-none rounded-md px-2 py-1.5 shrink-0",
              "hover:bg-accent",
            )}
            aria-label={
              imeOn
                ? "Sinhala IME enabled, switch off for plain Latin keyboard"
                : "Sinhala IME disabled, switch on for phonetic input"
            }
          >
            <Languages className="size-4 text-muted-foreground" aria-hidden />
            <span className="text-xs whitespace-nowrap">Sinhala IME</span>
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
                queueMicrotask(applyModeFromController);
              }}
            />
          </label>
        </div>
        <div
          className="flex flex-wrap items-center gap-2"
          aria-live="polite"
          aria-atomic="true"
        >
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Active input
          </span>
          <Badge
            variant={
              imeOn && scriptMode === "si" ? "default" : "secondary"
            }
            className={cn(
              "font-normal gap-1 border-transparent",
              imeOn &&
                scriptMode === "si" &&
                "shadow-[0_0_0_1px_hsl(220_70%_60%/0.25)]",
            )}
          >
            {!imeOn ? (
              <>
                <span className="font-semibold tracking-tight">EN</span>
                <span className="text-muted-foreground font-normal">·</span>
                <span>Latin keyboard</span>
              </>
            ) : scriptMode === "si" ? (
              <>
                <span className="text-sm leading-none" lang="si">
                  සිංහල
                </span>
                <span className="text-muted-foreground font-normal">·</span>
                <span>Phonetic typing</span>
              </>
            ) : (
              <>
                <span className="font-semibold tracking-tight">EN</span>
                <span className="text-muted-foreground font-normal">·</span>
                <span>Latin (IME on)</span>
              </>
            )}
          </Badge>
          <span className="text-[10px] text-muted-foreground">
            Ctrl+Space in field toggles සිංහල ↔ EN
          </span>
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
