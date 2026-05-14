import { useCallback, useEffect, useMemo, useRef, type PointerEvent } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import {
  ArrowRight,
  AudioLines,
  BadgeCheck,
  BarChart3,
  FileSpreadsheet,
  Keyboard,
  ListOrdered,
  Mic,
  Sparkles,
  Trophy,
  Youtube,
  type LucideIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { useAdmin } from "../context/useAdmin";
import {
  fadeUp,
  landingFadeUp,
  landingFadeUpBlur,
  landingScaleIn,
  landingSpringTransition,
  stagger,
} from "../lib/motion";
import { cn } from "../lib/utils";

/* ─── Reactive backdrop ─── */

function LandingReactiveBackdrop({
  smoothNormX,
  smoothNormY,
  glowX,
  glowY,
  reduced,
}: {
  smoothNormX: MotionValue<number>;
  smoothNormY: MotionValue<number>;
  glowX: MotionValue<number>;
  glowY: MotionValue<number>;
  reduced: boolean;
}) {
  const gridX = useTransform(smoothNormX, [0, 1], [-14, 14]);
  const gridY = useTransform(smoothNormY, [0, 1], [-10, 10]);

  const orbAX = useTransform(smoothNormX, [0, 1], [-52, 52]);
  const orbAY = useTransform(smoothNormY, [0, 1], [-36, 36]);
  const orbBX = useTransform(smoothNormX, [0, 1], [40, -40]);
  const orbBY = useTransform(smoothNormY, [0, 1], [28, -28]);
  const orbCX = useTransform(smoothNormX, [0, 1], [-28, 28]);
  const orbCY = useTransform(smoothNormY, [0, 1], [44, -44]);

  const ringX = useTransform(smoothNormX, [0, 1], [-20, 20]);
  const ringY = useTransform(smoothNormY, [0, 1], [-16, 16]);

  const particles = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => ({
        id: i,
        left: `${((i * 47) % 88) + 6}%`,
        top: `${((i * 31) % 82) + 8}%`,
        delay: (i % 7) * 0.35,
        duration: 3.2 + (i % 6) * 0.45,
      })),
    [],
  );

  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      aria-hidden
    >
      {/* Cursor-follow glow */}
      {!reduced && (
        <motion.div
          className="absolute w-[min(90vw,520px)] h-[min(90vw,520px)] rounded-full -translate-x-1/2 -translate-y-1/2"
          style={{
            left: glowX,
            top: glowY,
            background:
              "radial-gradient(circle, hsl(220 70% 58% / 0.14) 0%, hsl(220 70% 45% / 0.04) 42%, transparent 68%)",
          }}
        />
      )}

      {/* Soft orbs — parallax + slow breathe */}
      <motion.div
        className="absolute w-[min(58vw,440px)] h-[min(58vw,440px)] rounded-full bg-primary/[0.085] blur-[72px]"
        style={{ left: "8%", top: "5%", x: orbAX, y: orbAY }}
        animate={
          reduced
            ? { scale: 1, opacity: 0.55 }
            : { scale: [1, 1.07, 1], opacity: [0.55, 0.75, 0.55] }
        }
        transition={{
          duration: 11,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute w-[min(48vw,360px)] h-[min(48vw,360px)] rounded-full bg-info/[0.06] blur-[64px]"
        style={{ right: "4%", top: "28%", x: orbBX, y: orbBY }}
        animate={
          reduced
            ? { scale: 1, opacity: 0.48 }
            : { scale: [1.04, 1, 1.04], opacity: [0.45, 0.62, 0.45] }
        }
        transition={{
          duration: 13,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1.2,
        }}
      />
      <motion.div
        className="absolute w-[min(42vw,320px)] h-[min(42vw,320px)] rounded-full bg-muted-foreground/[0.07] blur-[56px]"
        style={{ left: "38%", bottom: "6%", x: orbCX, y: orbCY }}
        animate={
          reduced
            ? { scale: 1, opacity: 0.4 }
            : { scale: [1, 1.09, 1], opacity: [0.35, 0.5, 0.35] }
        }
        transition={{
          duration: 9,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.6,
        }}
      />

      {/* Slow rotating frame */}
      <motion.div
        className="absolute left-1/2 top-[10%] -translate-x-1/2 w-[min(88vw,720px)] aspect-[4/3] rounded-[38%]"
        style={{
          border: "1px solid hsl(220 70% 60% / 0.09)",
          x: ringX,
          y: ringY,
        }}
        animate={reduced ? undefined : { rotate: [0, 360] }}
        transition={{
          duration: 140,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      {/* Dot field + parallax */}
      <motion.div
        className="absolute inset-0 opacity-[0.42]"
        style={{
          x: gridX,
          y: gridY,
          backgroundImage:
            "radial-gradient(circle at 1px 1px, hsl(0 0% 24%) 1px, transparent 0)",
          backgroundSize: "36px 36px",
        }}
      />

      {/* Twinkling particles */}
      {!reduced &&
        particles.map((p) => (
          <motion.span
            key={p.id}
            className="absolute size-1 rounded-full bg-primary/50 shadow-[0_0_8px_hsl(220_70%_60%/0.35)]"
            style={{ left: p.left, top: p.top }}
            animate={{
              opacity: [0.15, 0.55, 0.15],
              scale: [0.85, 1.25, 0.85],
            }}
            transition={{
              duration: p.duration,
              repeat: Infinity,
              delay: p.delay,
              ease: "easeInOut",
            }}
          />
        ))}
    </div>
  );
}

/* ─── Sections ─── */

interface TileProps {
  to: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

function FeatureTile({ to, title, description, icon: Icon }: TileProps) {
  const reduced = useReducedMotion() === true;

  return (
    <motion.div
      variants={landingFadeUp}
      whileHover={
        reduced
          ? undefined
          : { y: -8, transition: landingSpringTransition }
      }
      whileTap={{ scale: 0.985 }}
    >
      <Link to={to} className="group block h-full">
        <Card
          className={cn(
            "h-full border-border bg-card/50 transition-colors duration-300",
            "group-hover:border-primary/40 group-hover:bg-card",
            "group-hover:shadow-[0_0_0_1px_hsl(220_70%_60%/0.12),0_20px_50px_-24px_rgba(0,0,0,0.55)]",
            "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background",
          )}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-3">
              <motion.span
                className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary"
                whileHover={reduced ? undefined : { scale: 1.06, rotate: 5 }}
                transition={landingSpringTransition}
              >
                <Icon className="size-5" aria-hidden />
              </motion.span>
              <motion.span
                className="inline-flex"
                initial={false}
                whileHover={{ x: 4 }}
                transition={landingSpringTransition}
              >
                <ArrowRight
                  className="size-4 text-muted-foreground opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-hover:text-primary"
                  aria-hidden
                />
              </motion.span>
            </div>
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription className="line-clamp-2">
              {description}
            </CardDescription>
          </CardHeader>
        </Card>
      </Link>
    </motion.div>
  );
}

export function LandingPage() {
  const { isAdmin } = useAdmin();
  /** Only skip motion when OS explicitly requests it — `null` during first paint must stay “full experience”. */
  const reducedMotionPref = useReducedMotion();
  const reduced = reducedMotionPref === true;
  const containerRef = useRef<HTMLDivElement>(null);

  const mouseNormX = useMotionValue(0.5);
  const mouseNormY = useMotionValue(0.5);
  const glowX = useMotionValue(0);
  const glowY = useMotionValue(0);

  const smoothNormX = useSpring(mouseNormX, {
    stiffness: 38,
    damping: 22,
    mass: 0.9,
  });
  const smoothNormY = useSpring(mouseNormY, {
    stiffness: 38,
    damping: 22,
    mass: 0.9,
  });
  const springGlowX = useSpring(glowX, { stiffness: 80, damping: 26 });
  const springGlowY = useSpring(glowY, { stiffness: 80, damping: 26 });

  const centerGlow = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    glowX.set(width / 2);
    glowY.set(height / 2);
    mouseNormX.set(0.5);
    mouseNormY.set(0.5);
  }, [glowX, glowY, mouseNormX, mouseNormY]);

  useEffect(() => {
    centerGlow();
  }, [centerGlow]);

  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      if (reduced) return;
      const t = e.currentTarget;
      const r = t.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width;
      const ny = (e.clientY - r.top) / r.height;
      mouseNormX.set(nx);
      mouseNormY.set(ny);
      glowX.set(e.clientX - r.left);
      glowY.set(e.clientY - r.top);
    },
    [reduced, glowX, glowY, mouseNormX, mouseNormY],
  );

  const onPointerLeave = useCallback(() => {
    centerGlow();
  }, [centerGlow]);

  const highlights = (
    [
      { k: "Pipeline", v: "Split → transcribe → save" },
      { k: "Sinhala IME", v: "Ctrl+Space while typing" },
      { k: "Admins", v: "Leaderboard & analytics" },
    ] as const
  );

  return (
    <div
      ref={containerRef}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      className="relative isolate w-full min-w-0 min-h-[calc(100dvh-3.5rem)] md:min-h-[calc(100dvh-4rem)]"
    >
      <LandingReactiveBackdrop
        smoothNormX={smoothNormX}
        smoothNormY={smoothNormY}
        glowX={springGlowX}
        glowY={springGlowY}
        reduced={reduced}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-4 md:px-6 pt-2 pb-10 md:pb-14">
        <motion.div
          initial="hidden"
          animate="show"
          variants={stagger(0.055)}
          className="space-y-14 md:space-y-16"
        >
          <motion.header
            variants={fadeUp}
            className="text-center space-y-6 relative"
          >
            <motion.div
              variants={landingScaleIn}
              className="inline-flex"
            >
              <motion.div
                animate={
                  reduced
                    ? undefined
                    : { boxShadow: ["0 0 0 0 hsl(220 70% 60% / 0)", "0 0 0 6px hsl(220 70% 60% / 0.06)", "0 0 0 0 hsl(220 70% 60% / 0)"] }
                }
                transition={{
                  duration: 3.2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur-sm"
              >
                <motion.span
                  animate={reduced ? undefined : { rotate: [0, 12, -8, 0] }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <Sparkles className="size-3.5 text-primary" aria-hidden />
                </motion.span>
                Sinhala speech data workspace
              </motion.div>
            </motion.div>

            <motion.h2
              variants={landingFadeUpBlur}
              className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-foreground leading-[1.1]"
            >
              Collect, transcribe, and validate —{" "}
              <motion.span
                className="text-primary inline-block"
                animate={
                  reduced
                    ? undefined
                    : { backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }
                }
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "linear",
                }}
                style={
                  reduced
                    ? undefined
                    : {
                        backgroundImage:
                          "linear-gradient(90deg, hsl(220 70% 60%), hsl(200  80% 65%), hsl(220 70% 60%))",
                        backgroundSize: "200% auto",
                        WebkitBackgroundClip: "text",
                        backgroundClip: "text",
                        color: "transparent",
                      }
                }
              >
                {!reduced ? (
                  "in one calm console."
                ) : (
                  <span className="text-primary">in one calm console.</span>
                )}
              </motion.span>
            </motion.h2>

            <motion.p
              variants={landingFadeUp}
              className="mx-auto max-w-2xl text-base md:text-lg text-muted-foreground leading-relaxed"
            >
              Run the YouTube audio pipeline, queue batch jobs, contribute
              transcriptions with phonetic IME, and keep quality high with admin
              tools — all tuned for responsive layouts from phone to desktop.
            </motion.p>

            <motion.div
              variants={landingFadeUp}
              className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2"
            >
              <motion.div
                whileHover={reduced ? undefined : { scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                transition={landingSpringTransition}
              >
                <Button asChild size="lg" className="min-w-[200px] gap-2">
                  <Link to="/audio-processor">
                    <AudioLines className="size-4" aria-hidden />
                    Audio processor
                  </Link>
                </Button>
              </motion.div>
              <motion.div
                whileHover={reduced ? undefined : { scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                transition={landingSpringTransition}
              >
                <Button asChild variant="outline" size="lg" className="min-w-[200px] gap-2">
                  <Link to="/transcription">
                    <Mic className="size-4" aria-hidden />
                    Start transcribing
                  </Link>
                </Button>
              </motion.div>
            </motion.div>
          </motion.header>

          <motion.section
            variants={stagger(0.08)}
            className="grid sm:grid-cols-3 gap-4 text-center"
          >
            {highlights.map((row) => (
              <motion.div
                key={row.k}
                variants={landingFadeUp}
                whileHover={
                  reduced
                    ? undefined
                    : { y: -4, transition: landingSpringTransition }
                }
                className="rounded-xl border border-border bg-card/45 px-4 py-5 backdrop-blur-[2px]"
              >
                <p className="text-xs font-medium uppercase tracking-wider text-primary">
                  {row.k}
                </p>
                <p className="mt-1.5 text-sm text-muted-foreground">{row.v}</p>
              </motion.div>
            ))}
          </motion.section>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            variants={stagger(0.06)}
          >
            <motion.div variants={landingFadeUp} className="mb-6">
              <h3 className="text-lg font-semibold tracking-tight">
                Workflows
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Jump straight into the tools you use most.
              </p>
            </motion.div>

            <motion.div
              variants={stagger(0.06)}
              className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
            >
              <FeatureTile
                to="/audio-processor"
                title="Audio processor"
                description="Ingest a video, tune VAD, split clips, and push to the cloud."
                icon={AudioLines}
              />
              <FeatureTile
                to="/queue-processor"
                title="Queue processor"
                description="Batch URLs, playlists, or JSON — run many videos with shared settings."
                icon={ListOrdered}
              />
              <FeatureTile
                to="/transcription"
                title="Transcription"
                description="Random clips, references, metadata, and unsuitable marking."
                icon={Mic}
              />
              <FeatureTile
                to="/csv-normalization"
                title="CSV normalizer"
                description="Review text vs tn_text diffs and export validated CSV."
                icon={FileSpreadsheet}
              />
            </motion.div>
          </motion.div>

          {isAdmin ? (
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-60px" }}
              variants={stagger(0.06)}
            >
              <motion.div variants={landingFadeUp} className="mb-6">
                <h3 className="text-lg font-semibold tracking-tight">
                  Admin
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Quality control, visibility, and channel sourcing.
                </p>
              </motion.div>
              <motion.div
                variants={stagger(0.055)}
                className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
              >
                <FeatureTile
                  to="/validation"
                  title="Validation"
                  description="Play clips, confirm video suitability, skip or flag."
                  icon={BadgeCheck}
                />
                <FeatureTile
                  to="/leaderboard"
                  title="Leaderboard"
                  description="See who is contributing most by time range."
                  icon={Trophy}
                />
                <FeatureTile
                  to="/statistics"
                  title="Statistics"
                  description="Dashboards for transcriptions, audio, and admins."
                  icon={BarChart3}
                />
                <FeatureTile
                  to="/channels"
                  title="Channels"
                  description="Browse shortlisted YouTube channels by category."
                  icon={Youtube}
                />
              </motion.div>
            </motion.div>
          ) : null}

          <motion.footer variants={landingFadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 rounded-xl border border-dashed border-border bg-muted/25 px-4 py-4 text-center text-xs text-muted-foreground backdrop-blur-[1px]">
            <span className="inline-flex items-center gap-1.5">
              <Keyboard className="size-3.5 shrink-0" aria-hidden />
              Press{" "}
              <kbd className="rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] text-foreground">
                Ctrl
              </kbd>
              <kbd className="rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] text-foreground">
                `
              </kbd>{" "}
              to switch admin ·{" "}
              <kbd className="rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] text-foreground">
                Ctrl+Shift+S
              </kbd>{" "}
              IME in CSV tool
            </span>
          </motion.footer>
        </motion.div>
      </div>
    </div>
  );
}
