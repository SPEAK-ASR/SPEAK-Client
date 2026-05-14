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
  type AsrReferencePreferenceStats,
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

  const genderPie = aggregateGenderPie(meta?.speaker_gender ?? []);

  const noisePie = ynukSlices(
    meta?.noise.with_noise ?? 0,
    meta?.noise.without_noise ?? 0,
    meta?.noise.unknown ?? 0,
  );

  const codeMixPie = ynukSlices(
    meta?.code_mixing.code_mixed ?? 0,
    meta?.code_mixing.not_mixed ?? 0,
    meta?.code_mixing.unknown ?? 0,
  );

  const overlapPie = ynukSlices(
    meta?.speaker_overlapping.with_overlap ?? 0,
    meta?.speaker_overlapping.without_overlap ?? 0,
    meta?.speaker_overlapping.unknown ?? 0,
  );

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
        description="Speaker gender and Yes / No / Unknown for noise, code-mixing, and overlap."
      >
        <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2 xl:grid-cols-4 xl:items-start items-center justify-center">
          <MetadataMiniPie
            title="Speaker gender"
            data={genderPie}
            emptyHint="No gender data"
            getColor={(_, i) => CHART_COLORS.cat[i % CHART_COLORS.cat.length]}
          />
          <MetadataMiniPie
            title="Has noise"
            data={noisePie}
            getColor={(name) => YNU_COLORS[name] ?? CHART_COLORS.muted}
          />
          <MetadataMiniPie
            title="Code-mixed"
            data={codeMixPie}
            getColor={(name) => YNU_COLORS[name] ?? CHART_COLORS.muted}
          />
          <MetadataMiniPie
            title="Overlap"
            data={overlapPie}
            getColor={(name) => YNU_COLORS[name] ?? CHART_COLORS.muted}
          />
        </div>
      </ChartCard>

      {asr && (
        <ChartCard
          title="ASR reference preference"
          description="Share of decisive choices between Google and SPEAK references (excludes neutral)."
          height={140}
        >
          <AsrPreferenceBar asr={asr} />
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

const YNU_COLORS: Record<string, string> = {
  Yes: CHART_COLORS.success,
  No: CHART_COLORS.destructive,
  Unknown: CHART_COLORS.muted,
};

const GENDER_LABEL_OVERRIDES: Record<string, string> = {
  cannotrecognised: "Cannot recognise",
  cannotrecognized: "Cannot recognise",
};

function formatGenderLabel(gender: string): string {
  const raw = gender.trim();
  if (!raw) return "Unknown";
  const key = raw.toLowerCase().replace(/[\s_-]+/g, "");
  const mapped = GENDER_LABEL_OVERRIDES[key];
  if (mapped) return mapped;
  return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase().replace(/_/g, " ");
}

function ynukSlices(yes: number, no: number, unknown: number) {
  return [
    { name: "Yes" as const, value: yes },
    { name: "No" as const, value: no },
    { name: "Unknown" as const, value: unknown },
  ].filter((d) => d.value > 0);
}

function aggregateGenderPie(
  rows: { gender: string; count: number }[],
): { name: string; value: number }[] {
  const byLabel = new Map<string, number>();
  for (const row of rows) {
    if (row.count <= 0) continue;
    const label = formatGenderLabel(row.gender);
    byLabel.set(label, (byLabel.get(label) ?? 0) + row.count);
  }
  return Array.from(byLabel.entries()).map(([name, value]) => ({ name, value }));
}

function MetadataMiniPie({
  title,
  data,
  getColor,
  emptyHint,
}: {
  title: string;
  data: { name: string; value: number }[];
  getColor: (name: string, index: number) => string;
  emptyHint?: string;
}) {
  const hasData = data.length > 0 && data.some((d) => d.value > 0);
  const legendItems = data
    .map((d, i) => ({ d, i }))
    .filter(({ d }) => d.value > 0);

  const chartPx = 168;
  const emptyMinH = chartPx + 52;

  return (
    <div className="flex h-full min-h-0 flex-col items-center">
      <p className="mb-2 w-full shrink-0 text-center text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
        {title}
      </p>
      <div className="flex w-full max-w-[228px] flex-1 flex-col items-center">
        {!hasData ? (
          <div
            style={{ minHeight: emptyMinH }}
            className="flex w-full items-center justify-center rounded-md border border-dashed border-border bg-muted/20 px-3 text-center text-xs text-muted-foreground"
          >
            {emptyHint ?? "No data"}
          </div>
        ) : (
          <>
            <div className="w-full shrink-0" style={{ height: chartPx }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
                  <Tooltip {...TOOLTIP_STYLES} />
                  <Pie
                    data={data}
                    dataKey="value"
                    nameKey="name"
                    innerRadius="54%"
                    outerRadius="92%"
                    paddingAngle={1}
                    stroke="hsl(0 0% 7%)"
                  >
                    {data.map((d, i) => (
                      <Cell key={`${d.name}-${i}`} fill={getColor(d.name, i)} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul
              className="mt-3 flex min-h-[2.75rem] w-full flex-wrap items-start justify-center gap-x-4 gap-y-1.5 px-0 text-[10px] leading-tight text-muted-foreground"
              aria-label={`${title} legend`}
            >
              {legendItems.map(({ d, i }) => (
                <li
                  key={`${d.name}-${i}`}
                  className="flex max-w-[9.5rem] items-center gap-1.5 text-left"
                >
                  <span
                    className="mt-px size-2 shrink-0 rounded-[2px]"
                    style={{ backgroundColor: getColor(d.name, i) }}
                    aria-hidden
                  />
                  <span className="min-w-0 break-words text-foreground">{d.name}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}

function AsrPreferenceBar({ asr }: { asr: AsrReferencePreferenceStats }) {
  const google = asr.google_chosen;
  const speak = asr.speak_chosen;
  const decisive = asr.decisive_total;

  const googlePct =
    asr.google_share_percent != null
      ? Math.round(asr.google_share_percent)
      : decisive > 0
        ? Math.round((google / decisive) * 100)
        : null;
  const speakPct = googlePct != null ? 100 - googlePct : null;

  if (decisive <= 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-2 text-center">
        <p className="text-sm text-muted-foreground">
          No decisive Google vs SPEAK choices in this period.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col justify-center gap-4 py-0.5">
      <div
        className="flex h-3.5 w-full overflow-hidden rounded-full border border-border bg-muted/60"
        role="img"
        aria-label={`Reference preference: Google ${googlePct}%, SPEAK ${speakPct}%`}
      >
        {googlePct != null && googlePct > 0 && (
          <div className="h-full shrink-0 bg-info" style={{ width: `${googlePct}%` }} />
        )}
        {speakPct != null && speakPct > 0 && (
          <div className="h-full shrink-0 bg-success" style={{ width: `${speakPct}%` }} />
        )}
      </div>
      <div className="grid grid-cols-2 gap-6 sm:flex sm:justify-center sm:gap-16">
        <div className="text-center sm:text-right">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-info">Google</p>
          <p className="text-xl font-semibold tabular-nums">{formatNumber(google)}</p>
          <p className="text-xs tabular-nums text-muted-foreground">{googlePct}% of decisive</p>
        </div>
        <div className="text-center sm:text-left">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-success">SPEAK</p>
          <p className="text-xl font-semibold tabular-nums">{formatNumber(speak)}</p>
          <p className="text-xs tabular-nums text-muted-foreground">{speakPct}% of decisive</p>
        </div>
      </div>
    </div>
  );
}

function ChartsSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-[520px] w-full" />
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-72 w-full" />
        ))}
      </div>
      <Skeleton className="h-72 w-full" />
    </div>
  );
}
