import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import DownloadIcon from "@mui/icons-material/Download";
import EditIcon from "@mui/icons-material/Edit";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import KeyboardIcon from "@mui/icons-material/Keyboard";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import "../styles/transcription.css";

/* ─────────────────────────── types ─────────────────────────── */

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

/* ─────────────────────────── CSV helpers ────────────────────── */

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (line[i] === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += line[i];
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

/* ─────────────────────────── word-level diff ────────────────── */

function tokenise(text: string): string[] {
  // keep Sinhala word boundaries; split on whitespace but preserve tokens
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

/* ─────────────────────────── DiffView ───────────────────────── */

function DiffView({
  tokens,
  maxLines = 2,
}: {
  tokens: DiffToken[];
  maxLines?: number;
}) {
  return (
    <Box
      component="span"
      sx={{
        fontSize: "0.82rem",
        lineHeight: 1.6,
        display: "-webkit-box",
        WebkitLineClamp: maxLines,
        WebkitBoxOrient: "vertical",
        overflow: "hidden",
        wordBreak: "break-word",
      }}
    >
      {tokens.map((tok, idx) => {
        if (/^\s+$/.test(tok.text)) {
          return <span key={idx}>{tok.text}</span>;
        }
        const bg =
          tok.type === "removed"
            ? "rgba(255,80,80,0.28)"
            : tok.type === "added"
              ? "rgba(80,200,120,0.28)"
              : undefined;
        const outline =
          tok.type === "removed"
            ? "1px solid rgba(255,80,80,0.5)"
            : tok.type === "added"
              ? "1px solid rgba(80,200,120,0.5)"
              : undefined;
        return (
          <Box
            key={idx}
            component="span"
            sx={{
              background: bg,
              outline,
              borderRadius: "3px",
              px: tok.type !== "equal" ? "1px" : undefined,
            }}
          >
            {tok.text}
          </Box>
        );
      })}
    </Box>
  );
}

/* ─────────────────────────── global IME manager ─────────────── */

interface ImeManager {
  controllerRef: React.MutableRefObject<SinhalaImeController | null>;
  imeDomRef: React.MutableRefObject<{
    toggle: HTMLInputElement | null;
    chip: HTMLButtonElement | null;
  }>;
  imeEnabled: boolean;
  attachTo: (textarea: HTMLTextAreaElement) => void;
  detachCurrent: () => void;
}

function useImeManager(imeEnabled: boolean): ImeManager {
  const controllerRef = useRef<SinhalaImeController | null>(null);
  const imeDomRef = useRef<{
    toggle: HTMLInputElement | null;
    chip: HTMLButtonElement | null;
  }>({ toggle: null, chip: null });

  const detachCurrent = useCallback(() => {
    controllerRef.current?.detach();
    controllerRef.current = null;
  }, []);

  const attachTo = useCallback(
    (textarea: HTMLTextAreaElement) => {
      detachCurrent();
      const controller = window.SinPhoneticIME?.attach(textarea, {
        toggle: imeDomRef.current.toggle ?? undefined,
        chip: imeDomRef.current.chip ?? undefined,
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

  // Update enabled state on existing controller when imeEnabled changes
  useEffect(() => {
    if (controllerRef.current) {
      try {
        controllerRef.current.enabled = imeEnabled;
      } catch {
        // ignore
      }
    }
  }, [imeEnabled]);

  return { controllerRef, imeDomRef, imeEnabled, attachTo, detachCurrent };
}

/* ─────────────────────────── Row component ──────────────────── */

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
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const wasEditingRef = useRef(false);

  const diff = useMemo(
    () => computeDiff(row.text, row.tn_text),
    [row.text, row.tn_text],
  );

  const changed = diff.left.some((t) => t.type !== "equal");

  // Only reset and attach IME when transitioning INTO edit mode, not on every re-render.
  useEffect(() => {
    const justStartedEditing = isEditing && !wasEditingRef.current;
    wasEditingRef.current = isEditing;
    if (justStartedEditing && textareaRef.current) {
      textareaRef.current.value = row.tn_text;
      textareaRef.current.focus();
      imeManager.attachTo(textareaRef.current);
    }
  }, [isEditing, imeManager, row.tn_text]);

  // Always read the live DOM value — the IME may write directly to the textarea
  // without firing React's synthetic onChange, so a ref or state would be stale.
  const handleSave = useCallback(() => {
    onSave(row.id, textareaRef.current?.value ?? "");
  }, [onSave, row.id]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Escape") {
        onCancel(row.id);
      }
      // Ctrl+Enter to save
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleSave();
      }
    },
    [onCancel, row.id, handleSave],
  );

  return (
    <TableRow
      hover
      sx={{
        verticalAlign: "top",
        bgcolor: row.reviewed
          ? "rgba(80,200,120,0.06)"
          : changed
            ? undefined
            : "rgba(255,255,255,0.02)",
        "&:hover": { bgcolor: "rgba(255,255,255,0.05)" },
      }}
    >
      {/* Index */}
      <TableCell
        sx={{
          width: 40,
          py: 0.75,
          px: 1,
          color: "text.secondary",
          fontSize: "0.75rem",
          borderRight: "1px solid",
          borderColor: "divider",
        }}
      >
        <Stack alignItems="center" spacing={0.25}>
          <span>{index + 1}</span>
          {row.reviewed && (
            <CheckIcon sx={{ fontSize: 12, color: "success.main" }} />
          )}
          {!changed && (
            <Chip
              label="="
              size="small"
              sx={{
                height: 14,
                fontSize: "0.6rem",
                bgcolor: "rgba(255,255,255,0.08)",
              }}
            />
          )}
        </Stack>
      </TableCell>

      {/* text column */}
      <TableCell
        sx={{
          py: 0.75,
          px: 1,
          width: "43%",
          borderRight: "1px solid",
          borderColor: "divider",
          verticalAlign: "top",
        }}
      >
        <DiffView tokens={diff.left} maxLines={3} />
      </TableCell>

      {/* tn_text column */}
      <TableCell sx={{ py: 0.75, px: 1, verticalAlign: "top" }}>
        {isEditing ? (
          <Stack spacing={0.5}>
            <Box className="ime-container">
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
                style={{
                  width: "100%",
                  resize: "vertical",
                  padding: "6px 8px",
                  borderRadius: 6,
                  border: "1px solid #4F8EFF",
                  backgroundColor: "#1F1F1F",
                  color: "#FAFAFA",
                  fontSize: "0.82rem",
                  fontFamily: "inherit",
                  boxSizing: "border-box",
                }}
              />
            </Box>
            <Stack direction="row" spacing={0.5}>
              <Button
                size="small"
                variant="contained"
                color="success"
                onClick={handleSave}
                startIcon={<CheckIcon />}
                sx={{ py: 0.25, px: 1, fontSize: "0.72rem" }}
              >
                Save (Ctrl+↵)
              </Button>
              <Button
                size="small"
                variant="outlined"
                color="inherit"
                onClick={() => onCancel(row.id)}
                startIcon={<CloseIcon />}
                sx={{ py: 0.25, px: 1, fontSize: "0.72rem" }}
              >
                Cancel (Esc)
              </Button>
            </Stack>
          </Stack>
        ) : (
          <Stack direction="row" alignItems="flex-start" spacing={0.5}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <DiffView tokens={diff.right} maxLines={3} />
            </Box>
            <Tooltip title="Edit tn_text">
              <IconButton
                size="small"
                onClick={() => onStartEdit(row.id)}
                sx={{
                  p: 0.25,
                  opacity: 0.5,
                  "&:hover": { opacity: 1 },
                  flexShrink: 0,
                }}
              >
                <EditIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </Tooltip>
          </Stack>
        )}
      </TableCell>
    </TableRow>
  );
});

/* ─────────────────────────── main page ─────────────────────── */

export function CsvNormalizationPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const globalToggleRef = useRef<HTMLInputElement | null>(null);
  const globalChipRef = useRef<HTMLButtonElement | null>(null);

  const [rows, setRows] = useState<CsvRow[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [imeEnabled, setImeEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filename, setFilename] = useState("output.csv");

  const imeManager = useImeManager(imeEnabled);

  // Wire the global toggle / chip refs into the manager so the chip floats on edit textarea
  useEffect(() => {
    imeManager.imeDomRef.current.toggle = globalToggleRef.current;
    imeManager.imeDomRef.current.chip = globalChipRef.current;
  });

  /* ── CSV upload ── */
  const handleFileChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
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
      } catch {
        setError("Failed to parse CSV file.");
      }
    };
    reader.readAsText(file, "utf-8");
    // reset so same file can be re-uploaded
    e.target.value = "";
  }, []);

  /* ── CSV download ── */
  const handleDownload = useCallback(() => {
    const csv = buildCsv(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, [rows, filename]);

  /* ── editing callbacks ── */
  const handleStartEdit = useCallback((id: number) => {
    setEditingId(id);
  }, []);

  const handleSave = useCallback((id: number, newTnText: string) => {
    setRows((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, tn_text: newTnText, reviewed: true } : r,
      ),
    );
    setEditingId(null);
  }, []);

  const handleCancel = useCallback((_id: number) => {
    setEditingId(null);
  }, []);

  /* ── keyboard shortcut: Ctrl+Shift+S to toggle IME ── */
  useEffect(() => {
    const handler = (e: globalThis.KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "S") {
        e.preventDefault();
        setImeEnabled((prev) => {
          const next = !prev;
          if (globalToggleRef.current) {
            globalToggleRef.current.checked = next;
          }
          return next;
        });
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  /* ── stats ── */
  const stats = useMemo(() => {
    const total = rows.length;
    const reviewed = rows.filter((r) => r.reviewed).length;
    const changed = rows.filter((r) => {
      const { left } = computeDiff(r.text, r.tn_text);
      return left.some((t) => t.type !== "equal");
    }).length;
    return { total, reviewed, changed };
  }, [rows]);

  return (
    <Box sx={{ p: 2, maxWidth: 1400, mx: "auto" }}>
      {/* ── Header ── */}
      <Stack
        direction="row"
        alignItems="center"
        spacing={2}
        flexWrap="wrap"
        sx={{ mb: 1.5 }}
      >
        <Typography variant="h5" fontWeight={600} sx={{ mr: 1 }}>
          CSV Normalization Validator
        </Typography>

        {/* Upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
        <Button
          variant="outlined"
          size="small"
          startIcon={<UploadFileIcon />}
          onClick={() => fileInputRef.current?.click()}
        >
          Upload CSV
        </Button>

        {/* Download */}
        {rows.length > 0 && (
          <Button
            variant="contained"
            size="small"
            startIcon={<DownloadIcon />}
            onClick={handleDownload}
            color="success"
          >
            Download CSV
          </Button>
        )}

        <Box sx={{ flex: 1 }} />

        {/* Stats */}
        {rows.length > 0 && (
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip
              label={`${stats.total} rows`}
              size="small"
              variant="outlined"
            />
            <Chip
              label={`${stats.changed} changed`}
              size="small"
              color="warning"
              variant="outlined"
            />
            <Chip
              label={`${stats.reviewed} reviewed`}
              size="small"
              color="success"
              variant="outlined"
            />
          </Stack>
        )}

        {/* IME toggle */}
        <Stack direction="row" alignItems="center" spacing={0.75}>
          <KeyboardIcon sx={{ fontSize: 16, color: "text.secondary" }} />
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ userSelect: "none" }}
          >
            Sinhala IME
          </Typography>
          <Tooltip title="Toggle Sinhala IME (Ctrl+Shift+S)">
            <label className="toggle-switch">
              <input
                type="checkbox"
                ref={globalToggleRef}
                className="toggle-input"
                checked={imeEnabled}
                onChange={(e) => setImeEnabled(e.target.checked)}
              />
              <span className="toggle-slider">
                <span className="toggle-text off">EN</span>
                <span className="toggle-text on">සි</span>
              </span>
            </label>
          </Tooltip>
        </Stack>
      </Stack>

      {/* Diff legend */}
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
        <Stack direction="row" spacing={0.5} alignItems="center">
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: "2px",
              bgcolor: "rgba(255,80,80,0.28)",
              border: "1px solid rgba(255,80,80,0.5)",
            }}
          />
          <Typography variant="caption" color="text.secondary">
            removed from text
          </Typography>
        </Stack>
        <Stack direction="row" spacing={0.5} alignItems="center">
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: "2px",
              bgcolor: "rgba(80,200,120,0.28)",
              border: "1px solid rgba(80,200,120,0.5)",
            }}
          />
          <Typography variant="caption" color="text.secondary">
            added in tn_text
          </Typography>
        </Stack>
        <SwapHorizIcon sx={{ fontSize: 14, color: "text.disabled" }} />
        <Typography variant="caption" color="text.disabled">
          Click <EditIcon sx={{ fontSize: 11, verticalAlign: "middle" }} /> to
          edit · Ctrl+↵ save · Esc cancel · Ctrl+Shift+S toggle IME
        </Typography>
      </Stack>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 1.5 }}>
          {error}
        </Alert>
      )}

      {rows.length === 0 && !error && (
        <Paper
          variant="outlined"
          sx={{
            p: 6,
            textAlign: "center",
            borderStyle: "dashed",
            cursor: "pointer",
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          <UploadFileIcon
            sx={{ fontSize: 48, color: "text.secondary", mb: 1 }}
          />
          <Typography color="text.secondary">
            Click to upload a CSV file with <code>text</code> and{" "}
            <code>tn_text</code> columns
          </Typography>
          <Typography variant="caption" color="text.disabled">
            The tn_text column should contain number-normalized Sinhala text
          </Typography>
        </Paper>
      )}

      {rows.length > 0 && (
        <TableContainer
          component={Paper}
          variant="outlined"
          sx={{ maxHeight: "calc(100vh - 200px)", overflow: "auto" }}
        >
          <Table size="small" stickyHeader sx={{ tableLayout: "fixed" }}>
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{
                    width: 40,
                    py: 0.5,
                    px: 1,
                    fontSize: "0.75rem",
                    bgcolor: "background.paper",
                    borderRight: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  #
                </TableCell>
                <TableCell
                  sx={{
                    width: "43%",
                    py: 0.5,
                    px: 1,
                    fontSize: "0.75rem",
                    bgcolor: "background.paper",
                    borderRight: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  text{" "}
                  <Typography
                    component="span"
                    variant="caption"
                    color="text.disabled"
                  >
                    (original)
                  </Typography>
                </TableCell>
                <TableCell
                  sx={{
                    py: 0.5,
                    px: 1,
                    fontSize: "0.75rem",
                    bgcolor: "background.paper",
                  }}
                >
                  tn_text{" "}
                  <Typography
                    component="span"
                    variant="caption"
                    color="text.disabled"
                  >
                    (normalized — editable)
                  </Typography>
                </TableCell>
              </TableRow>
            </TableHead>
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
        </TableContainer>
      )}

      {/* Hidden global IME chip — floats over whatever textarea is active */}
      <button
        type="button"
        ref={globalChipRef}
        className="ime-chip"
        style={{ display: "none" }}
      >
        සි | en
      </button>
    </Box>
  );
}
