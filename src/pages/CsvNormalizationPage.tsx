import * as React from "react";
import {
  Check,
  Download,
  Edit3,
  Keyboard,
  UploadCloud,
  X,
} from "lucide-react";
import { PageHeader } from "../components/layout/PageHeader";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Switch } from "../components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";
import { toast } from "../components/ui/toast";
import { cn } from "../lib/utils";

interface CsvRow {
  id: number;
  text: string;
  tn_text: string;
  reviewed: boolean;
}

interface DiffToken {
  text: string;
  type: "equal" | "added" | "removed";
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

function parseCsv(raw: string): Record<string, string>[] {
  const lines = raw.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const headers = parseCsvLine(lines[0]).map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    return Object.fromEntries(
      headers.map((h, i) => [h, values[i]?.trim() ?? ""]),
    );
  });
}

function escapeCsvField(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function buildCsv(rows: CsvRow[]): string {
  const header = "text,tn_text";
  const body = rows
    .map((r) => `${escapeCsvField(r.text)},${escapeCsvField(r.tn_text)}`)
    .join("\n");
  return `${header}\n${body}`;
}

function tokenise(text: string): string[] {
  return text.split(/(\s+)/).filter(Boolean);
}

function lcs(a: string[], b: string[]): number[][] {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array(n + 1).fill(0),
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1] + 1
          : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp;
}

function computeDiff(
  original: string,
  normalized: string,
): { left: DiffToken[]; right: DiffToken[] } {
  const aWords = tokenise(original);
  const bWords = tokenise(normalized);
  const dp = lcs(aWords, bWords);

  const left: DiffToken[] = [];
  const right: DiffToken[] = [];

  let i = aWords.length;
  let j = bWords.length;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && aWords[i - 1] === bWords[j - 1]) {
      left.unshift({ text: aWords[i - 1], type: "equal" });
      right.unshift({ text: bWords[j - 1], type: "equal" });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      right.unshift({ text: bWords[j - 1], type: "added" });
      j--;
    } else {
      left.unshift({ text: aWords[i - 1], type: "removed" });
      i--;
    }
  }
  return { left, right };
}

function DiffView({
  tokens,
  maxLines = 3,
}: {
  tokens: DiffToken[];
  maxLines?: number;
}) {
  return (
    <span
      className="text-[0.82rem] leading-relaxed break-words"
      style={{
        display: "-webkit-box",
        WebkitLineClamp: maxLines,
        WebkitBoxOrient: "vertical",
        overflow: "hidden",
      }}
    >
      {tokens.map((tok, idx) => {
        if (/^\s+$/.test(tok.text)) {
          return <span key={idx}>{tok.text}</span>;
        }
        if (tok.type === "equal") {
          return <span key={idx}>{tok.text}</span>;
        }
        return (
          <span
            key={idx}
            className={cn(
              "rounded px-0.5 mx-px ring-1",
              tok.type === "removed"
                ? "bg-destructive/25 ring-destructive/40 text-foreground"
                : "bg-success/25 ring-success/40 text-foreground",
            )}
          >
            {tok.text}
          </span>
        );
      })}
    </span>
  );
}

interface ImeManager {
  toggleRef: React.MutableRefObject<HTMLInputElement | null>;
  chipRef: React.MutableRefObject<HTMLButtonElement | null>;
  imeEnabled: boolean;
  attachTo: (textarea: HTMLTextAreaElement) => void;
  detachCurrent: () => void;
}

function useImeManager(imeEnabled: boolean): ImeManager {
  const toggleRef = React.useRef<HTMLInputElement | null>(null);
  const chipRef = React.useRef<HTMLButtonElement | null>(null);
  const controllerRef = React.useRef<SinhalaImeController | null>(null);

  const detachCurrent = React.useCallback(() => {
    controllerRef.current?.detach();
    controllerRef.current = null;
  }, []);

  const attachTo = React.useCallback(
    (textarea: HTMLTextAreaElement) => {
      detachCurrent();
      const controller = window.SinPhoneticIME?.attach(textarea, {
        toggle: toggleRef.current ?? undefined,
        chip: chipRef.current ?? undefined,
      });
      if (controller) {
        try {
          controller.mode = "si";
          controller.enabled = imeEnabled;
        } catch {
          // ignore
        }
        controllerRef.current = controller;
      }
    },
    [detachCurrent, imeEnabled],
  );

  React.useEffect(() => {
    if (controllerRef.current) {
      try {
        controllerRef.current.enabled = imeEnabled;
      } catch {
        // ignore
      }
    }
  }, [imeEnabled]);

  return { toggleRef, chipRef, imeEnabled, attachTo, detachCurrent };
}

interface RowProps {
  row: CsvRow;
  index: number;
  isEditing: boolean;
  onStartEdit: (id: number) => void;
  onSave: (id: number, newTnText: string) => void;
  onCancel: (id: number) => void;
  imeManager: ImeManager;
}

const RowComponent = React.memo(function RowComponent({
  row,
  index,
  isEditing,
  onStartEdit,
  onSave,
  onCancel,
  imeManager,
}: RowProps) {
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);
  const wasEditingRef = React.useRef(false);

  const diff = React.useMemo(
    () => computeDiff(row.text, row.tn_text),
    [row.text, row.tn_text],
  );
  const changed = diff.left.some((t) => t.type !== "equal");

  React.useEffect(() => {
    const justStarted = isEditing && !wasEditingRef.current;
    wasEditingRef.current = isEditing;
    if (justStarted && textareaRef.current) {
      textareaRef.current.value = row.tn_text;
      textareaRef.current.focus();
      imeManager.attachTo(textareaRef.current);
    }
  }, [isEditing, imeManager, row.tn_text]);

  const handleSave = React.useCallback(() => {
    onSave(row.id, textareaRef.current?.value ?? "");
  }, [onSave, row.id]);

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Escape") {
        onCancel(row.id);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleSave();
      }
    },
    [onCancel, row.id, handleSave],
  );

  return (
    <TableRow
      className={cn(
        "align-top border-b border-border",
        row.reviewed
          ? "bg-success/5"
          : changed
            ? ""
            : "bg-muted/20",
      )}
    >
      <TableCell className="w-12 align-top px-2 py-2 border-r border-border">
        <div className="flex flex-col items-center gap-1 text-muted-foreground text-xs">
          <span>{index + 1}</span>
          {row.reviewed && (
            <Check className="size-3 text-success" aria-label="Reviewed" />
          )}
          {!changed && (
            <span className="rounded-full bg-muted text-[10px] px-1.5">
              =
            </span>
          )}
        </div>
      </TableCell>

      <TableCell className="w-[42%] align-top px-3 py-2 border-r border-border">
        <DiffView tokens={diff.left} maxLines={3} />
      </TableCell>

      <TableCell className="align-top px-3 py-2">
        {isEditing ? (
          <div className="space-y-2">
            <div className="ime-container relative">
              <textarea
                ref={textareaRef}
                defaultValue={row.tn_text}
                rows={3}
                onKeyDown={handleKeyDown}
                onFocus={() => {
                  if (textareaRef.current) {
                    imeManager.attachTo(textareaRef.current);
                  }
                }}
                className="w-full resize-y rounded-md border border-primary bg-input px-2.5 py-1.5 text-[0.85rem] text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="flex gap-1.5">
              <Button
                size="sm"
                variant="success"
                onClick={handleSave}
                className="h-7 text-xs px-2.5"
              >
                <Check className="size-3.5" />
                Save (Ctrl+↵)
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onCancel(row.id)}
                className="h-7 text-xs px-2.5"
              >
                <X className="size-3.5" />
                Cancel (Esc)
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-2">
            <div className="flex-1 min-w-0">
              <DiffView tokens={diff.right} maxLines={3} />
            </div>
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    onClick={() => onStartEdit(row.id)}
                    className="opacity-50 hover:opacity-100 shrink-0"
                    aria-label="Edit normalized text"
                  >
                    <Edit3 className="size-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Edit tn_text</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
      </TableCell>
    </TableRow>
  );
});

export function CsvNormalizationPage() {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const globalChipRef = React.useRef<HTMLButtonElement | null>(null);
  const hiddenToggleRef = React.useRef<HTMLInputElement | null>(null);

  const [rows, setRows] = React.useState<CsvRow[]>([]);
  const [editingId, setEditingId] = React.useState<number | null>(null);
  const [imeEnabled, setImeEnabled] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [filename, setFilename] = React.useState("output.csv");

  const imeManager = useImeManager(imeEnabled);

  React.useEffect(() => {
    imeManager.toggleRef.current = hiddenToggleRef.current;
    imeManager.chipRef.current = globalChipRef.current;
  });

  React.useEffect(() => {
    if (hiddenToggleRef.current) {
      hiddenToggleRef.current.checked = imeEnabled;
    }
  }, [imeEnabled]);

  const handleFileChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setFilename(file.name.replace(/\.csv$/i, "_validated.csv"));
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const raw = evt.target?.result as string;
          const parsed = parseCsv(raw);
          if (parsed.length === 0) {
            setError("No rows found. Make sure the file has a header row.");
            return;
          }
          if (!("text" in parsed[0]) || !("tn_text" in parsed[0])) {
            setError("CSV must have columns: text, tn_text");
            return;
          }
          setError(null);
          setEditingId(null);
          setRows(
            parsed.map((r, i) => ({
              id: i,
              text: r.text ?? "",
              tn_text: r.tn_text ?? "",
              reviewed: false,
            })),
          );
          toast.success("CSV loaded", {
            description: `${parsed.length} rows ready for review`,
          });
        } catch {
          setError("Failed to parse CSV file.");
        }
      };
      reader.readAsText(file, "utf-8");
      e.target.value = "";
    },
    [],
  );

  const handleDownload = React.useCallback(() => {
    const csv = buildCsv(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV downloaded", { description: filename });
  }, [rows, filename]);

  const handleStartEdit = React.useCallback((id: number) => {
    setEditingId(id);
  }, []);

  const handleSave = React.useCallback((id: number, newTnText: string) => {
    setRows((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, tn_text: newTnText, reviewed: true } : r,
      ),
    );
    setEditingId(null);
  }, []);

  const handleCancel = React.useCallback(() => {
    setEditingId(null);
  }, []);

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && (e.key === "S" || e.key === "s")) {
        e.preventDefault();
        setImeEnabled((p) => !p);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const stats = React.useMemo(() => {
    const total = rows.length;
    const reviewed = rows.filter((r) => r.reviewed).length;
    const changed = rows.filter((r) => {
      const { left } = computeDiff(r.text, r.tn_text);
      return left.some((t) => t.type !== "equal");
    }).length;
    return { total, reviewed, changed };
  }, [rows]);

  return (
    <>
      <PageHeader
        title="CSV Normalization Validator"
        description="Compare original Sinhala text against the number-normalized version and edit inline."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <UploadCloud className="size-4" />
              Upload CSV
            </Button>
            {rows.length > 0 && (
              <Button size="sm" variant="success" onClick={handleDownload}>
                <Download className="size-4" />
                Download
              </Button>
            )}
            <div className="flex items-center gap-2 pl-1 ml-1 border-l border-border h-8">
              <Keyboard className="size-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Sinhala IME</span>
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Switch
                      checked={imeEnabled}
                      onCheckedChange={setImeEnabled}
                      aria-label="Toggle Sinhala IME"
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    Toggle Sinhala IME (Ctrl+Shift+S)
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-3 mb-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span className="size-3 rounded-sm bg-destructive/25 ring-1 ring-destructive/40" />
          removed from text
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-3 rounded-sm bg-success/25 ring-1 ring-success/40" />
          added in tn_text
        </div>
        <span className="hidden sm:inline">
          Click edit · Ctrl+↵ save · Esc cancel · Ctrl+Shift+S toggle IME
        </span>
        {rows.length > 0 && (
          <div className="ml-auto flex items-center gap-1.5">
            <Badge variant="outline">{stats.total} rows</Badge>
            <Badge variant="warning">{stats.changed} changed</Badge>
            <Badge variant="success">{stats.reviewed} reviewed</Badge>
          </div>
        )}
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription className="flex items-center justify-between gap-3">
            <span>{error}</span>
            <Button
              size="icon-sm"
              variant="ghost"
              onClick={() => setError(null)}
              aria-label="Dismiss error"
            >
              <X className="size-3.5" />
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {rows.length === 0 && !error ? (
        <Card
          onClick={() => fileInputRef.current?.click()}
          className="border-dashed cursor-pointer hover:border-primary/50 transition-colors"
        >
          <CardContent className="py-14 flex flex-col items-center text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-3">
              <UploadCloud className="size-5" />
            </span>
            <p className="text-base font-semibold">Click to upload a CSV file</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-md">
              The CSV must have columns <code className="text-foreground">text</code> and{" "}
              <code className="text-foreground">tn_text</code>. The{" "}
              <code className="text-foreground">tn_text</code> column should
              contain number-normalized Sinhala text.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {rows.length > 0 && (
        <Card className="overflow-hidden p-0">
          <div
            className="relative w-full overflow-auto"
            style={{ maxHeight: "calc(100vh - 280px)" }}
          >
            <Table className="text-sm" style={{ tableLayout: "fixed" }}>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 px-2 border-r border-border">
                    #
                  </TableHead>
                  <TableHead className="w-[42%] border-r border-border">
                    text{" "}
                    <span className="normal-case font-normal text-muted-foreground/70">
                      (original)
                    </span>
                  </TableHead>
                  <TableHead>
                    tn_text{" "}
                    <span className="normal-case font-normal text-muted-foreground/70">
                      (normalized — editable)
                    </span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row, index) => (
                  <RowComponent
                    key={row.id}
                    row={row}
                    index={index}
                    isEditing={editingId === row.id}
                    onStartEdit={handleStartEdit}
                    onSave={handleSave}
                    onCancel={handleCancel}
                    imeManager={imeManager}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Hidden IME plumbing — chip floats over active textarea */}
      <input
        ref={hiddenToggleRef}
        type="checkbox"
        defaultChecked={imeEnabled}
        className="hidden"
      />
      <button
        type="button"
        ref={globalChipRef}
        className="ime-chip"
        style={{ display: "none" }}
      >
        සි | en
      </button>
    </>
  );
}
