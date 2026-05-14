import { useLocation } from "react-router-dom";
import { NAV_ITEMS } from "./NavConfig";
import { MobileMenuButton } from "./MobileNav";
import { ServiceStatusPill } from "./ServiceStatusPill";
import { AdminAvatarMenu } from "./AdminAvatarMenu";

function getPageTitle(pathname: string) {
  const match = NAV_ITEMS.find((i) =>
    i.path === "/" ? pathname === "/" : pathname.startsWith(i.path),
  );
  return match?.label ?? "SPEAK";
}

export function TopBar() {
  const { pathname } = useLocation();
  const title = getPageTitle(pathname);

  return (
    <header className="sticky top-0 z-30 h-14 border-b border-border bg-background/80 backdrop-blur">
      <div className="flex h-full items-center gap-3 px-4 md:px-6">
        <MobileMenuButton />
        <h1 className="text-sm font-semibold tracking-tight truncate">
          {title}
        </h1>
        <div className="ml-auto flex items-center gap-2">
          <ServiceStatusPill />
          <AdminAvatarMenu />
        </div>
      </div>
    </header>
  );
}
