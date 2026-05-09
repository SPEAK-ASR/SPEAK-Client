import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { BottomNav } from "./MobileNav";
import { AdminSelectorDialog } from "../admin/AdminSelectorDialog";
import { Toaster } from "../ui/toast";
import { routeFade } from "../../lib/motion";
import { cn } from "../../lib/utils";

const isFullWidthRoute = (pathname: string) => pathname === "/";

export function AppLayout() {
  const location = useLocation();
  const fullWidth = isFullWidthRoute(location.pathname);

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <TopBar />
        <main className="flex-1 min-w-0 pb-20 md:pb-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              variants={routeFade}
              initial="hidden"
              animate="show"
              exit="exit"
              className={cn(
                "w-full min-w-0",
                fullWidth
                  ? "py-6"
                  : "px-4 md:px-6 py-6 max-w-screen-2xl mx-auto",
              )}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
        <BottomNav />
      </div>
      <AdminSelectorDialog />
      <Toaster />
    </div>
  );
}
