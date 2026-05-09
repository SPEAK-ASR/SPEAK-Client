import { useRef, useState } from "react";
import { FileJson, Loader2, ListPlus, Plus, Youtube } from "lucide-react";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";

interface QueueInputCardProps {
  onAddUrl: (url: string) => void;
  onLoadPlaylist: (url: string, limit?: number) => Promise<void>;
  onLoadJson: (
    videos: Array<{ video_link: string; domain: string }>,
  ) => void;
  isLoadingPlaylist: boolean;
  disabled?: boolean;
}

export function QueueInputCard({
  onAddUrl,
  onLoadPlaylist,
  onLoadJson,
  isLoadingPlaylist,
  disabled,
}: QueueInputCardProps) {
  const [singleUrl, setSingleUrl] = useState("");
  const [playlistUrl, setPlaylistUrl] = useState("");
  const [playlistLimit, setPlaylistLimit] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function tryAddSingle() {
    const trimmed = singleUrl.trim();
    if (!trimmed) return;
    onAddUrl(trimmed);
    setSingleUrl("");
    setError(null);
  }

  async function tryLoadPlaylist() {
    const trimmed = playlistUrl.trim();
    if (!trimmed) return;
    setError(null);
    try {
      const limit = playlistLimit ? parseInt(playlistLimit, 10) : undefined;
      await onLoadPlaylist(trimmed, Number.isFinite(limit) ? limit : undefined);
      setPlaylistUrl("");
      setPlaylistLimit("");
    } catch (err) {
      setError((err as Error)?.message ?? "Failed to load playlist");
    }
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onerror = () => setError("Failed to read file");
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        if (!Array.isArray(data)) {
          throw new Error('Expected an array of { "video_link", "domain" }.');
        }
        const videos = data.filter(
          (v) =>
            v && typeof v === "object" && typeof v.video_link === "string",
        );
        onLoadJson(videos);
        setError(null);
      } catch (err) {
        setError((err as Error)?.message ?? "Invalid JSON file");
      }
    };
    reader.readAsText(f);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Add videos</CardTitle>
        <CardDescription>
          Single URL, playlist, or upload a JSON list.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="single">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="single">
              <Youtube className="size-3.5" />
              <span className="ml-1.5">URL</span>
            </TabsTrigger>
            <TabsTrigger value="playlist">
              <ListPlus className="size-3.5" />
              <span className="ml-1.5">Playlist</span>
            </TabsTrigger>
            <TabsTrigger value="json">
              <FileJson className="size-3.5" />
              <span className="ml-1.5">JSON</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="single" className="space-y-2">
            <Label htmlFor="q-url">Single video URL</Label>
            <div className="flex gap-2">
              <Input
                id="q-url"
                placeholder="https://www.youtube.com/watch?v=…"
                value={singleUrl}
                onChange={(e) => setSingleUrl(e.target.value)}
                disabled={disabled}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    tryAddSingle();
                  }
                }}
              />
              <Button onClick={tryAddSingle} disabled={disabled || !singleUrl.trim()}>
                <Plus className="size-4" />
                Add
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="playlist" className="space-y-2">
            <Label htmlFor="q-playlist">Playlist URL</Label>
            <Input
              id="q-playlist"
              placeholder="https://www.youtube.com/playlist?list=…"
              value={playlistUrl}
              onChange={(e) => setPlaylistUrl(e.target.value)}
              disabled={disabled || isLoadingPlaylist}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  tryLoadPlaylist();
                }
              }}
            />
            <div className="flex gap-2">
              <Input
                placeholder="Limit (optional)"
                type="number"
                min={1}
                value={playlistLimit}
                onChange={(e) => setPlaylistLimit(e.target.value)}
                disabled={disabled || isLoadingPlaylist}
                className="max-w-[8rem]"
              />
              <Button
                onClick={tryLoadPlaylist}
                disabled={disabled || isLoadingPlaylist || !playlistUrl.trim()}
              >
                {isLoadingPlaylist ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <ListPlus className="size-4" />
                )}
                Load
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="json" className="space-y-2">
            <Label htmlFor="q-json">JSON file</Label>
            <p className="text-xs text-muted-foreground">
              Expected shape:{" "}
              <code className="font-mono text-xs">
                [{"{"}"video_link": "…", "domain": "…"{"}"}, …]
              </code>
            </p>
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                id="q-json"
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={handleFile}
                disabled={disabled}
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
              >
                <FileJson className="size-4" />
                Choose JSON file
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {error && (
          <Alert variant="destructive" className="mt-3">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
