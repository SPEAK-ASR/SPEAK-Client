import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { ChevronsLeft, ChevronsRight } from "lucide-react";
import { useAdmin } from "../../context/useAdmin";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { NAV_ITEMS } from "./NavConfig";

const STORAGE_KEY = "speak-sidebar-pinned";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const { isAdmin } = useAdmin();
  const [pinned, setPinned] = useState(false);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setPinned(window.localStorage.getItem(STORAGE_KEY) === "1");
  }, []);

  const togglePinned = () => {
    setPinned((p) => {
      const next = !p;
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      }
      return next;
    });
  };

  const expanded = pinned || hovered;
  const items = NAV_ITEMS.filter((i) => !i.adminOnly || isAdmin);

  return (
    <TooltipProvider delayDuration={150}>
      <aside
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={cn(
          "hidden md:flex shrink-0 sticky top-0 h-screen flex-col border-r border-border bg-card/30 transition-[width] duration-200",
          expanded ? "w-60" : "w-16",
          className,
        )}
      >
        {/* Brand row */}
        <div className="flex items-center gap-3 h-14 px-4 border-b border-border">
          <div className="flex size-8 items-center justify-center rounded-md bg-primary/15 text-primary font-semibold text-sm shrink-0">
            S
          </div>
          {expanded && (
            <span className="text-sm font-semibold tracking-tight truncate">
              SPEAK
            </span>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            className={cn("ml-auto", !expanded && "hidden")}
            onClick={togglePinned}
            aria-label={pinned ? "Unpin sidebar" : "Pin sidebar"}
          >
            {pinned ? (
              <ChevronsLeft className="size-4" />
            ) : (
              <ChevronsRight className="size-4" />
            )}
          </Button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3">
          <ul className="space-y-0.5 px-2">
            {items.map((item) => {
              const Icon = item.icon;
              const inner = (
                <NavLink
                  to={item.path}
                  end={item.path === "/"}
                  className={({ isActive }) =>
                    cn(
                      "group relative flex items-center gap-3 rounded-md px-3 h-9 text-sm font-medium transition-colors",
                      "hover:bg-accent",
                      isActive
                        ? "text-foreground bg-accent"
                        : "text-muted-foreground",
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span
                        className={cn(
                          "absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full transition-opacity",
                          isActive
                            ? "bg-primary opacity-100"
                            : "opacity-0",
                        )}
                      />
                      <Icon
                        className={cn(
                          "size-4 shrink-0",
                          isActive && "text-primary",
                        )}
                      />
                      {expanded && (
                        <span className="truncate">{item.label}</span>
                      )}
                    </>
                  )}
                </NavLink>
              );

              return (
                <li key={item.path}>
                  {expanded ? (
                    inner
                  ) : (
                    <Tooltip>
                      <TooltipTrigger asChild>{inner}</TooltipTrigger>
                      <TooltipContent side="right">{item.label}</TooltipContent>
                    </Tooltip>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </TooltipProvider>
  );
}
