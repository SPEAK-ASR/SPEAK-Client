import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Crown, Medal, Trophy, TrendingUp } from "lucide-react";
import { PageHeader } from "../components/layout/PageHeader";
import { useAdmin } from "../context/useAdmin";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Skeleton } from "../components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import {
  speakServerApi,
  type AdminLeaderboardEntry,
  type LeaderboardRange,
} from "../lib/speakServerApi";
import { cn, formatNumber } from "../lib/utils";
import { fadeUp, stagger } from "../lib/motion";

const RANGE_LABELS: Record<LeaderboardRange, string> = {
  all: "All time",
  week: "This week",
  month: "This month",
};

interface State {
  leaders: AdminLeaderboardEntry[];
  total: number;
}

export function LeaderboardPage() {
  const [range, setRange] = useState<LeaderboardRange>("all");
  const [state, setState] = useState<State | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { profiles } = useAdmin();

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    speakServerApi
      .fetchLeaderboard(range)
      .then((data) => {
        if (!mounted) return;
        setState({ leaders: data.leaders, total: data.total });
      })
      .catch((err) => {
        console.error(err);
        if (mounted) {
          setError("Failed to load leaderboard.");
          setState(null);
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [range]);

  const getProfile = (id: string) =>
    profiles.find((p) => p.id === id.toLowerCase());

  const topThree = state?.leaders.slice(0, 3) ?? [];
  const remainder = state?.leaders.slice(3) ?? [];

  return (
    <>
      <PageHeader
        eyebrow="Admin"
        title="Leaderboard"
        description="Top contributors to the transcription database."
        actions={
          state && (
            <div className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5">
              <TrendingUp className="size-4 text-primary" />
              <span className="text-xs">
                <span className="font-semibold tabular-nums">
                  {formatNumber(state.total)}
                </span>{" "}
                <span className="text-muted-foreground">
                  contribution{state.total === 1 ? "" : "s"}
                </span>
              </span>
            </div>
          )
        }
      />

      <Tabs
        value={range}
        onValueChange={(v) => setRange(v as LeaderboardRange)}
        className="mb-5"
      >
        <TabsList className="w-full sm:w-auto grid grid-cols-3 sm:inline-grid">
          {(Object.keys(RANGE_LABELS) as LeaderboardRange[]).map((k) => (
            <TabsTrigger key={k} value={k}>
              {RANGE_LABELS[k]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <LeaderboardSkeleton />
      ) : !state || state.leaders.length === 0 ? (
        <Alert variant="info">
          <AlertDescription>
            {error ?? "No admin transcriptions yet for this range."}
          </AlertDescription>
        </Alert>
      ) : (
        <motion.div
          variants={stagger(0.06)}
          initial="hidden"
          animate="show"
          className="space-y-6"
        >
          <Podium
            entries={topThree}
            getProfile={(id) => getProfile(id) ?? null}
          />
          {remainder.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Remaining ranks</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Rank</TableHead>
                      <TableHead>Admin</TableHead>
                      <TableHead className="text-right">
                        Contributions
                      </TableHead>
                      <TableHead className="text-right w-32">Badge</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {remainder.map((entry, i) => {
                      const rank = i + 4;
                      const profile = getProfile(entry.admin);
                      return (
                        <TableRow key={entry.admin}>
                          <TableCell className="font-mono text-sm text-muted-foreground tabular-nums">
                            #{rank}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="size-8">
                                {profile?.imagePath && (
                                  <AvatarImage
                                    src={profile.imagePath}
                                    alt={entry.admin}
                                  />
                                )}
                                <AvatarFallback>
                                  {entry.admin.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium capitalize">
                                {profile?.displayName ?? entry.admin}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right tabular-nums font-semibold">
                            {formatNumber(entry.count)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant="muted">Contributor</Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </motion.div>
      )}
    </>
  );
}

function Podium({
  entries,
  getProfile,
}: {
  entries: AdminLeaderboardEntry[];
  getProfile: (id: string) => { displayName?: string; imagePath?: string } | null;
}) {
  if (entries.length === 0) return null;

  const order: Array<{ rank: 1 | 2 | 3; entry?: AdminLeaderboardEntry }> = [
    { rank: 2, entry: entries[1] },
    { rank: 1, entry: entries[0] },
    { rank: 3, entry: entries[2] },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
      {order.map(({ rank, entry }) => (
        <PodiumCard
          key={rank}
          rank={rank}
          entry={entry}
          profile={entry ? getProfile(entry.admin) : null}
        />
      ))}
    </div>
  );
}

function PodiumCard({
  rank,
  entry,
  profile,
}: {
  rank: 1 | 2 | 3;
  entry?: AdminLeaderboardEntry;
  profile: { displayName?: string; imagePath?: string } | null;
}) {
  if (!entry) {
    return (
      <Card
        className={cn(
          "opacity-30",
          rank !== 1 && "md:translate-y-2",
        )}
      >
        <CardContent className="pt-8 pb-6 text-center">
          <span className="text-xs text-muted-foreground">No entry</span>
        </CardContent>
      </Card>
    );
  }

  const accents = {
    1: {
      ring: "ring-amber-400/60",
      bg: "bg-amber-400/10",
      icon: Crown,
      label: "1st",
      text: "text-amber-400",
    },
    2: {
      ring: "ring-zinc-300/40",
      bg: "bg-zinc-400/10",
      icon: Medal,
      label: "2nd",
      text: "text-zinc-300",
    },
    3: {
      ring: "ring-orange-700/40",
      bg: "bg-orange-600/10",
      icon: Trophy,
      label: "3rd",
      text: "text-orange-500",
    },
  } as const;

  const a = accents[rank];
  const Icon = a.icon;

  return (
    <motion.div variants={fadeUp}>
      <Card
        className={cn(
          "relative overflow-hidden transition-transform hover:-translate-y-0.5",
          rank !== 1 && "md:translate-y-3",
        )}
      >
        <div className={cn("absolute inset-x-0 top-0 h-0.5", a.bg)} />
        <CardContent className="pt-7 pb-6 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <Avatar
                className={cn(
                  "ring-2 ring-offset-4 ring-offset-card",
                  a.ring,
                  rank === 1 ? "size-24" : "size-20",
                )}
              >
                {profile?.imagePath && (
                  <AvatarImage
                    src={profile.imagePath}
                    alt={entry.admin}
                  />
                )}
                <AvatarFallback className={cn("text-2xl font-semibold", a.text)}>
                  {entry.admin.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span
                className={cn(
                  "absolute -bottom-1 -right-1 flex size-7 items-center justify-center rounded-full bg-background border border-border",
                  a.text,
                )}
              >
                <Icon className="size-3.5" strokeWidth={2.4} />
              </span>
            </div>

            <div>
              <p
                className={cn(
                  "text-[11px] uppercase tracking-[0.18em]",
                  a.text,
                )}
              >
                {a.label}
              </p>
              <p className="text-base font-semibold capitalize mt-1">
                {profile?.displayName ?? entry.admin}
              </p>
            </div>

            <div className="rounded-md border border-border bg-background/40 px-3 py-2 w-full">
              <p className="text-2xl font-semibold tabular-nums">
                {formatNumber(entry.count)}
              </p>
              <p className="text-xs text-muted-foreground">
                contribution{entry.count === 1 ? "" : "s"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function LeaderboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
        {[2, 1, 3].map((rank) => (
          <Card
            key={rank}
            className={cn(rank !== 1 && "md:translate-y-3")}
          >
            <CardContent className="pt-7 pb-6 flex flex-col items-center gap-3">
              <Skeleton
                className={rank === 1 ? "size-24 rounded-full" : "size-20 rounded-full"}
              />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-12 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="space-y-3 pt-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-4 w-10" />
              <Skeleton className="size-8 rounded-full" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
