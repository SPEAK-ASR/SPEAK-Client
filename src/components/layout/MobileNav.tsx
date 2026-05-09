import { Menu, X } from "lucide-react";
import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useAdmin } from "../../context/useAdmin";
import { Button } from "../ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";
import { cn } from "../../lib/utils";
import { NAV_ITEMS } from "./NavConfig";

export function MobileMenuButton() {
  const { isAdmin } = useAdmin();
  const [open, setOpen] = useState(false);
  const items = NAV_ITEMS.filter((i) => !i.adminOnly || isAdmin);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Open navigation menu"
          className="md:hidden"
        >
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 flex flex-col" showClose={false}>
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-md bg-primary/15 text-primary font-semibold text-xs">
                S
              </span>
              SPEAK
            </SheetTitle>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
            >
              <X className="size-4" />
            </Button>
          </div>
        </SheetHeader>
        <nav className="flex-1 overflow-y-auto px-3 pb-3">
          <ul className="space-y-1">
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    end={item.path === "/"}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 rounded-md px-3 h-10 text-sm font-medium transition-colors",
                        "hover:bg-accent",
                        isActive
                          ? "bg-accent text-foreground"
                          : "text-muted-foreground",
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon
                          className={cn(
                            "size-4",
                            isActive && "text-primary",
                          )}
                        />
                        {item.label}
                      </>
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>
      </SheetContent>
    </Sheet>
  );
}

export function BottomNav() {
  const { isAdmin } = useAdmin();
  const items = NAV_ITEMS.filter(
    (i) => i.mobile && (!i.adminOnly || isAdmin),
  ).slice(0, 5);

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-30 border-t border-border bg-background/95 backdrop-blur"
      aria-label="Primary"
    >
      <ul
        className="grid"
        style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)` }}
      >
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.path}>
              <NavLink
                to={item.path}
                end={item.path === "/"}
                className={({ isActive }) =>
                  cn(
                    "flex flex-col items-center justify-center gap-0.5 h-14 text-[10px] font-medium transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground",
                  )
                }
              >
                <Icon className="size-4" />
                <span className="truncate max-w-full px-1">{item.label}</span>
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
