import { Lock } from "lucide-react";
import type { ReactNode } from "react";
import { useAdmin } from "../../context/useAdmin";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";

interface AdminGateProps {
  children: ReactNode;
}

export function AdminGate({ children }: AdminGateProps) {
  const { isAdmin, openSelector } = useAdmin();

  if (isAdmin) return <>{children}</>;

  return (
    <Card className="max-w-md mx-auto mt-12">
      <CardContent className="pt-6 flex flex-col items-center text-center gap-3">
        <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Lock className="size-5" />
        </span>
        <div>
          <h2 className="text-base font-semibold">Admin only</h2>
          <p className="text-sm text-muted-foreground mt-1">
            This page is available to signed-in admins.
          </p>
        </div>
        <Button onClick={openSelector} size="sm">
          Sign in
        </Button>
      </CardContent>
    </Card>
  );
}
