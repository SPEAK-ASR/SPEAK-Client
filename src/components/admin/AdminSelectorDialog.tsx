import { LogOut } from "lucide-react";
import { useAdmin } from "../../context/useAdmin";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { Kbd } from "../ui/kbd";
import { cn } from "../../lib/utils";

export function AdminSelectorDialog() {
  const { profiles, admin, isSelectorOpen, closeSelector, selectAdmin, clearAdmin } =
    useAdmin();

  return (
    <Dialog
      open={isSelectorOpen}
      onOpenChange={(open) => !open && closeSelector()}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Who's transcribing?</DialogTitle>
          <DialogDescription>
            Pick a profile to attribute your work. Press{" "}
            <Kbd>Ctrl</Kbd> + <Kbd>`</Kbd> any time to switch.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {profiles.map((p) => {
            const active = admin === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => selectAdmin(p.id)}
                className={cn(
                  "group flex flex-col items-center gap-2 rounded-lg border border-border bg-card p-4 transition-all",
                  "hover:border-primary/50 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active && "border-primary ring-1 ring-primary",
                )}
              >
                <Avatar className="size-16 transition-transform group-hover:scale-105">
                  <AvatarImage src={p.imagePath} alt={p.displayName} />
                  <AvatarFallback>
                    {p.displayName.slice(0, 1)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{p.displayName}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-border mt-2">
          <p className="text-xs text-muted-foreground">
            Your selection is saved locally.
          </p>
          {admin && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                clearAdmin();
                closeSelector();
              }}
            >
              <LogOut className="size-4" />
              Sign out
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
