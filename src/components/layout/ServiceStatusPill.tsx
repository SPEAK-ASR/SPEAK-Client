import { RefreshCw } from "lucide-react";
import { useServiceStatus } from "../../hooks/useServiceStatus";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../ui/popover";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";

export function ServiceStatusPill() {
  const { services, refresh, allOnline, anyOffline, loading } =
    useServiceStatus();

  const dotClass = cn(
    "size-2 rounded-full",
    loading
      ? "bg-warning animate-pulse"
      : allOnline
        ? "bg-success"
        : anyOffline
          ? "bg-destructive"
          : "bg-muted-foreground",
  );

  const label = loading
    ? "Checking…"
    : allOnline
      ? "Online"
      : anyOffline
        ? "Issues"
        : "Unknown";

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 h-8 px-2.5 rounded-full text-xs"
        >
          <span className={dotClass} />
          <span className="hidden sm:inline">{label}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium">Backend services</p>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => refresh()}
            disabled={loading}
            aria-label="Refresh service status"
          >
            <RefreshCw
              className={cn("size-3.5", loading && "animate-spin")}
            />
          </Button>
        </div>
        <ul className="space-y-2">
          {services.map((s) => (
            <li
              key={s.name}
              className="flex items-center justify-between gap-3 rounded-md border border-border bg-background/30 px-3 py-2"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{s.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {s.url}
                </p>
              </div>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 text-xs font-medium",
                  s.isOnline ? "text-success" : "text-destructive",
                )}
              >
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    s.isOnline ? "bg-success" : "bg-destructive",
                  )}
                />
                {s.isOnline ? "Online" : "Offline"}
              </span>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
