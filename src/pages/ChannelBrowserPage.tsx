import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Loader2,
  RefreshCw,
  Search,
  Trash2,
  Youtube,
} from "lucide-react";
import { motion } from "framer-motion";
import { PageHeader } from "../components/layout/PageHeader";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
} from "../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Skeleton } from "../components/ui/skeleton";
import { toast } from "../components/ui/toast";
import { useChannelCards } from "../hooks/useChannelCards";
import { fadeUp, stagger } from "../lib/motion";
import { cn } from "../lib/utils";
import type { ChannelCard as ChannelCardData } from "../types/channel";

export function ChannelBrowserPage() {
  const { channels, loading, error, reload, deleteChannel } = useChannelCards();
  const [query, setQuery] = useState("");
  const [pendingDelete, setPendingDelete] =
    useState<ChannelCardData | null>(null);
  const [deleting, setDeleting] = useState(false);

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? channels.filter(
          (c) =>
            (c.channelTitle ?? "").toLowerCase().includes(q) ||
            c.domain.toLowerCase().includes(q),
        )
      : channels;

    const map = new Map<string, ChannelCardData[]>();
    for (const c of filtered) {
      const k = c.domain || "uncategorized";
      const arr = map.get(k) ?? [];
      arr.push(c);
      map.set(k, arr);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [channels, query]);

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deleteChannel(pendingDelete.channelId);
      toast.success("Channel removed", {
        description:
          pendingDelete.channelTitle ?? pendingDelete.channelId,
      });
      setPendingDelete(null);
    } catch (err) {
      toast.error("Could not delete channel", {
        description: (err as Error)?.message,
      });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Admin"
        title="Sinhala YouTube Channels"
        description="Browse and shortlist channels feeding the audio scraper."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search channels…"
                className="pl-8 w-56"
              />
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => reload()}
              disabled={loading}
              aria-label="Reload"
            >
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <RefreshCw className="size-4" />
              )}
            </Button>
          </div>
        }
      />

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>
            Could not load channels: {error}
          </AlertDescription>
        </Alert>
      )}

      {loading ? (
        <ChannelsSkeleton />
      ) : grouped.length === 0 ? (
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-12 pb-10 flex flex-col items-center text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-3">
              <Youtube className="size-5" />
            </span>
            <p className="text-base font-semibold">No channels found</p>
            <p className="text-sm text-muted-foreground mt-1">
              {query
                ? "Try a different search."
                : "Add some channels to get started."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <motion.div
          variants={stagger(0.05)}
          initial="hidden"
          animate="show"
          className="space-y-6"
        >
          {grouped.map(([domain, items]) => (
            <CategorySection
              key={domain}
              domain={domain}
              items={items}
              onDelete={setPendingDelete}
            />
          ))}
        </motion.div>
      )}

      <Dialog
        open={!!pendingDelete}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete channel?</DialogTitle>
            <DialogDescription>
              {pendingDelete?.channelTitle ?? pendingDelete?.channelId} will be
              removed from the scraper feed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setPendingDelete(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleting}
            >
              {deleting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function CategorySection({
  domain,
  items,
  onDelete,
}: {
  domain: string;
  items: ChannelCardData[];
  onDelete: (channel: ChannelCardData) => void;
}) {
  let scrollRef: HTMLDivElement | null = null;

  function scroll(dir: -1 | 1) {
    if (!scrollRef) return;
    scrollRef.scrollBy({
      left: dir * Math.min(scrollRef.clientWidth * 0.8, 600),
      behavior: "smooth",
    });
  }

  return (
    <motion.section variants={fadeUp}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-base font-semibold capitalize">
            {domain.replace(/_/g, " ")}
          </h2>
          <p className="text-xs text-muted-foreground">
            {items.length} channel{items.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => scroll(-1)}
            aria-label="Scroll left"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => scroll(1)}
            aria-label="Scroll right"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
      <div
        ref={(el) => {
          scrollRef = el;
        }}
        className="flex gap-3 overflow-x-auto pb-3 snap-x snap-mandatory -mx-4 px-4 md:mx-0 md:px-0"
        style={{ scrollbarWidth: "thin" }}
      >
        {items.map((c) => (
          <ChannelCardItem
            key={c.channelId}
            channel={c}
            onDelete={() => onDelete(c)}
          />
        ))}
      </div>
    </motion.section>
  );
}

function ChannelCardItem({
  channel,
  onDelete,
}: {
  channel: ChannelCardData;
  onDelete: () => void;
}) {
  const url = `https://www.youtube.com/channel/${channel.channelId}`;
  return (
    <div
      className={cn(
        "snap-start group relative shrink-0 w-[180px] sm:w-[200px] rounded-xl border border-border bg-card overflow-hidden transition-all",
        "hover:border-primary/40 hover:shadow-lg hover:shadow-black/40",
      )}
    >
      <div className="aspect-square w-full bg-muted overflow-hidden">
        {channel.thumbnailUrl ? (
          <img
            src={channel.thumbnailUrl}
            alt={channel.channelTitle ?? channel.channelId}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <Youtube className="size-6" />
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="text-sm font-medium truncate">
          {channel.channelTitle ?? channel.channelId}
        </p>
      </div>
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity flex items-center justify-center gap-2">
        <Button asChild size="icon-sm" variant="default">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open ${channel.channelTitle ?? channel.channelId} on YouTube`}
          >
            <ExternalLink className="size-4" />
          </a>
        </Button>
        <Button
          size="icon-sm"
          variant="destructive"
          onClick={onDelete}
          aria-label="Delete channel"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function ChannelsSkeleton() {
  return (
    <div className="space-y-8">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i}>
          <Skeleton className="h-5 w-32 mb-3" />
          <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 6 }).map((_, j) => (
              <Skeleton key={j} className="w-[180px] sm:w-[200px] aspect-[3/4] shrink-0" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
