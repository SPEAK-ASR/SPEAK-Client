import { LogIn, LogOut, UserCog } from "lucide-react";
import { useAdmin } from "../../context/useAdmin";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

export function AdminAvatarMenu() {
  const { admin, profiles, openSelector, clearAdmin } = useAdmin();
  const profile = admin ? profiles.find((p) => p.id === admin) : null;

  if (!profile) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={openSelector}
        className="gap-2"
      >
        <LogIn className="size-4" />
        <span className="hidden sm:inline">Sign in</span>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          aria-label={`Profile menu for ${profile.displayName}`}
        >
          <Avatar className="size-8">
            <AvatarImage src={profile.imagePath} alt={profile.displayName} />
            <AvatarFallback>{profile.displayName.slice(0, 1)}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Signed in as</DropdownMenuLabel>
        <div className="px-2 pb-2">
          <p className="text-sm font-medium">{profile.displayName}</p>
          <p className="text-xs text-muted-foreground">Admin</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => openSelector()}>
          <UserCog className="size-4" />
          Switch admin
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => clearAdmin()}>
          <LogOut className="size-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
