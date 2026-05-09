import { useEffect, useState } from "react";
import {
  Activity,
  Clock,
  Database,
  Loader2,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Area,
  AreaChart,
} from "recharts";
import { PageHeader } from "../components/layout/PageHeader";
import {
  CHART_COLORS,
  ChartCard,
  TOOLTIP_STYLES,
} from "../components/stats/ChartCard";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
} from "../components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Skeleton } from "../components/ui/skeleton";
import {
  statisticsApi,
  type StatisticsResponse,
} from "../lib/statisticsApi";
import { formatNumber } from "../lib/utils";
import { useAdmin } from "../context/useAdmin";

const PERIODS = [
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
  { value: "180", label: "Last 6 months" },
  { value: "365", label: "Last year" },
];

export function StatisticsPage() {
  const [period, setPeriod] = useState("30");
  const [data, setData] = useState<StatisticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { profiles } = useAdmin();

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await statisticsApi.getAllStatistics(parseInt(period, 10));
      setData(res);
    } catch (err) {
      console.error(err);
      setError("Failed to load statistics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  return (
    <>
      <PageHeader
        eyebrow="Admin"
        title="Statistics"
        description="Database analytics dashboard."
        actions={
          <div className="flex items-center gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[10rem]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERIODS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={load}
              disabled={loading}
              aria-label="Refresh"
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
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <KpiGrid loading={loading} data={data} />

      {loading && !data ? (
        <ChartsSkeleton />
      ) : data ? (
        <Charts data={data} profiles={profiles} />
      ) : null}
    </>
  );
}

function KpiGrid({
  loading,
  data,
}: {
  loading: boolean;
  data: StatisticsResponse | null;
}) {
  const summary = data?.summary;

  const items = [
    {
      label: "Total transcriptions",
      value: summary?.total_transcriptions,
      icon: Activity,
    },
    {
      label: "Total duration",
      value: summary?.total_duration_hours,
      suffix: " hr",
      icon: Clock,
      decimals: 1,
    },
    {
      label: "Audio clips",
      value: summary?.total_audio_clips,
      icon: Database,
    },
    {
      label: "Transcription rate",
      value:
        data?.transcription_status?.transcription_rate !== undefined
          ? Math.round(
              (data.transcription_status.transcription_rate ?? 0) * 100,
            )
          : undefined,
      suffix: "%",
      icon: TrendingUp,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
      {items.map((it) => {
        const Icon = it.icon;
        return (
          <Card key={it.label}>
            <CardContent className="pt-5">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    {it.label}
                  </p>
                  <p className="text-2xl font-semibold tabular-nums mt-1">
                    {loading || it.value === undefined ? (
                      <Skeleton className="h-7 w-20 inline-block" />
                    ) : (
                      <>
                        {typeof it.value === "number"
                          ? it.decimals
                            ? it.value.toFixed(it.decimals)
                            : formatNumber(it.value)
                          : it.value}
                        {it.suffix}
                      </>
                    )}
                  </p>
                </div>
                <span className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Icon className="size-4" />
                </span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function Charts({
  data,
  profiles,
}: {
  data: StatisticsResponse;
  profiles: { id: string; displayName: string }[];
}) {
  const meta = data.transcription_metadata;

  const stackedMeta = [
    {
      name: "Suitable",
      yes: meta?.audio_suitability.suitable ?? 0,
      no: meta?.audio_suitability.unsuitable ?? 0,
      unknown: meta?.audio_suitability.unknown ?? 0,
    },
    {
      name: "Has noise",
      yes: meta?.noise.with_noise ?? 0,
      no: meta?.noise.without_noise ?? 0,
      unknown: meta?.noise.unknown ?? 0,
    },
    {
      name: "Code-mixed",
      yes: meta?.code_mixing.code_mixed ?? 0,
      no: meta?.code_mixing.not_mixed ?? 0,
      unknown: meta?.code_mixing.unknown ?? 0,
    },
    {
      name: "Overlap",
      yes: meta?.speaker_overlapping.with_overlap ?? 0,
      no: meta?.speaker_overlapping.without_overlap ?? 0,
      unknown: meta?.speaker_overlapping.unknown ?? 0,
    },
  ];

  const transcriptionStatus = [
    {
      name: "Transcribed",
      value: data.transcription_status.transcribed_count,
    },
    {
      name: "Pending",
      value: data.transcription_status.non_transcribed_count,
    },
  ];

  const adminContrib = data.admin_contributions.map((a) => ({
    name:
      profiles.find((p) => p.id === a.admin.toLowerCase())?.displayName ??
      a.admin,
    transcriptions: a.transcription_count,
    hours: Number(a.total_duration_hours.toFixed(1)),
  }));

  const categories = data.category_durations
    .map((c) => ({
      name: c.category.replace(/_/g, " "),
      hours: Number(c.total_duration_hours.toFixed(1)),
      clips: c.clip_count,
    }))
    .sort((a, b) => b.hours - a.hours)
    .slice(0, 12);

  const audioDist = data.audio_distribution.map((a) => ({
    range: a.range,
    count: a.count,
    pct: Math.round(a.percentage),
  }));

  const daily = data.daily_transcriptions.map((d) => ({
    date: d.date.length > 5 ? d.date.slice(5) : d.date,
    transcriptions: d.transcription_count,
    audio: d.audio_count,
    hours: Number(d.total_duration_hours.toFixed(2)),
  }));

  const asr = data.asr_reference_preference;

  return (
    <div className="space-y-4">
      <ChartCard
        title="Transcription metadata"
        description="Yes / No / Unknown distribution across submission flags."
      >
        <ResponsiveContainer>
          <BarChart data={stackedMeta} margin={{ top: 5, right: 8, left: -12, bottom: 0 }}>
            <CartesianGrid stroke={CHART_COLORS.muted} strokeOpacity={0.15} vertical={false} />
            <XAxis dataKey="name" stroke={CHART_COLORS.muted} fontSize={11} />
            <YAxis stroke={CHART_COLORS.muted} fontSize={11} />
            <Tooltip {...TOOLTIP_STYLES} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="yes" name="Yes" stackId="a" fill={CHART_COLORS.success} radius={[0, 0, 0, 0]} />
            <Bar dataKey="no" name="No" stackId="a" fill={CHART_COLORS.destructive} />
            <Bar dataKey="unknown" name="Unknown" stackId="a" fill={CHART_COLORS.muted} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {asr && (
        <ChartCard
          title="ASR reference preference"
          description="Which machine reference admins prefer when transcribing."
          height={140}
        >
          <div className="grid grid-cols-3 gap-3 h-full">
            <PrefStat label="Google" value={asr.google_chosen} accent="info" />
            <PrefStat label="SPEAK" value={asr.speak_chosen} accent="success" />
            <PrefStat label="Neutral" value={asr.neutral} accent="muted" />
          </div>
        </ChartCard>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Transcription status"
          description="Transcribed vs. pending audio clips."
        >
          <ResponsiveContainer>
            <PieChart>
              <Tooltip {...TOOLTIP_STYLES} />
              <Pie
                data={transcriptionStatus}
                dataKey="value"
                nameKey="name"
                innerRadius={50}
                outerRadius={90}
                paddingAngle={2}
                stroke="hsl(0 0% 7%)"
              >
                <Cell fill={CHART_COLORS.success} />
                <Cell fill={CHART_COLORS.muted} />
              </Pie>
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Audio duration distribution"
          description="Clip count per duration range."
        >
          <ResponsiveContainer>
            <BarChart data={audioDist} margin={{ top: 5, right: 8, left: -12, bottom: 0 }}>
              <CartesianGrid stroke={CHART_COLORS.muted} strokeOpacity={0.15} vertical={false} />
              <XAxis dataKey="range" stroke={CHART_COLORS.muted} fontSize={11} />
              <YAxis stroke={CHART_COLORS.muted} fontSize={11} />
              <Tooltip {...TOOLTIP_STYLES} />
              <Bar dataKey="count" name="Clips" fill={CHART_COLORS.primary} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Category durations"
          description="Total hours of audio per category (top 12)."
          height={Math.max(280, categories.length * 24)}
        >
          <ResponsiveContainer>
            <BarChart
              data={categories}
              layout="vertical"
              margin={{ top: 5, right: 16, left: 8, bottom: 0 }}
            >
              <CartesianGrid stroke={CHART_COLORS.muted} strokeOpacity={0.15} horizontal={false} />
              <XAxis type="number" stroke={CHART_COLORS.muted} fontSize={11} />
              <YAxis
                type="category"
                dataKey="name"
                stroke={CHART_COLORS.muted}
                fontSize={11}
                width={120}
              />
              <Tooltip {...TOOLTIP_STYLES} />
              <Bar dataKey="hours" name="Hours" fill={CHART_COLORS.info} radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Admin contributions"
          description="Transcriptions submitted per admin."
        >
          <ResponsiveContainer>
            <BarChart
              data={adminContrib}
              margin={{ top: 5, right: 8, left: -12, bottom: 0 }}
            >
              <CartesianGrid stroke={CHART_COLORS.muted} strokeOpacity={0.15} vertical={false} />
              <XAxis dataKey="name" stroke={CHART_COLORS.muted} fontSize={11} />
              <YAxis stroke={CHART_COLORS.muted} fontSize={11} />
              <Tooltip {...TOOLTIP_STYLES} />
              <Bar dataKey="transcriptions" name="Transcriptions" fill={CHART_COLORS.primary} radius={[6, 6, 0, 0]}>
                {adminContrib.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS.cat[i % CHART_COLORS.cat.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <ChartCard
        title="Daily transcriptions"
        description={`Transcription, audio, and hour counts over the period.`}
        height={300}
      >
        <ResponsiveContainer>
          <AreaChart data={daily} margin={{ top: 5, right: 8, left: -12, bottom: 0 }}>
            <defs>
              <linearGradient id="g-tx" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CHART_COLORS.primary} stopOpacity={0.5} />
                <stop offset="100%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="g-au" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CHART_COLORS.info} stopOpacity={0.4} />
                <stop offset="100%" stopColor={CHART_COLORS.info} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={CHART_COLORS.muted} strokeOpacity={0.15} vertical={false} />
            <XAxis dataKey="date" stroke={CHART_COLORS.muted} fontSize={11} />
            <YAxis stroke={CHART_COLORS.muted} fontSize={11} />
            <Tooltip {...TOOLTIP_STYLES} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Area
              type="monotone"
              dataKey="audio"
              name="Audio"
              stroke={CHART_COLORS.info}
              fill="url(#g-au)"
            />
            <Area
              type="monotone"
              dataKey="transcriptions"
              name="Transcriptions"
              stroke={CHART_COLORS.primary}
              fill="url(#g-tx)"
            />
            <Line
              type="monotone"
              dataKey="hours"
              name="Hours"
              stroke={CHART_COLORS.warning}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

function PrefStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: "info" | "success" | "muted";
}) {
  const accentClass =
    accent === "info"
      ? "text-info"
      : accent === "success"
        ? "text-success"
        : "text-muted-foreground";
  return (
    <div className="flex flex-col items-center justify-center rounded-md border border-border bg-background/40 py-3">
      <p className={`text-[11px] uppercase tracking-[0.18em] ${accentClass}`}>
        {label}
      </p>
      <p className="text-2xl font-semibold tabular-nums">
        {formatNumber(value)}
      </p>
    </div>
  );
}

function ChartsSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-72 w-full" />
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-72 w-full" />
        ))}
      </div>
      <Skeleton className="h-72 w-full" />
    </div>
  );
}
