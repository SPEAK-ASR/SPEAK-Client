import { ChevronDown, Info } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent } from "../ui/card";
import { Kbd } from "../ui/kbd";
import { cn } from "../../lib/utils";

interface GuidelinesCardProps {
  collapsed: boolean;
  onToggle: () => void;
}

const GUIDELINES = [
  "Type exactly what you hear, in Sinhala script.",
  "Use the phonetic IME — toggle with Ctrl+Space.",
  "Do not normalise or translate the speech.",
  "Mark speaker gender; if unsure, pick 'Cannot recognise'.",
  "Tick noise / code-mixing / overlap when relevant.",
  "If audio is unintelligible, use the 'Not suitable' button.",
];

export function GuidelinesCard({ collapsed, onToggle }: GuidelinesCardProps) {
  return (
    <Card>
      <CardContent className="pt-4 pb-3">
        <button
          type="button"
          onClick={onToggle}
          className="flex w-full items-center justify-between gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
          aria-expanded={!collapsed}
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="flex size-8 items-center justify-center rounded-md bg-info/10 text-info shrink-0">
              <Info className="size-4" />
            </span>
            <div>
              <p className="text-sm font-medium">Guidelines</p>
              <p className="text-xs text-muted-foreground">
                Phonetic IME · <Kbd>Ctrl</Kbd>+<Kbd>Space</Kbd> to toggle
              </p>
            </div>
          </div>
          <ChevronDown
            className={cn(
              "size-4 shrink-0 text-muted-foreground transition-transform",
              !collapsed && "rotate-180",
            )}
          />
        </button>

        <motion.div
          initial={false}
          animate={{
            height: collapsed ? 0 : "auto",
            opacity: collapsed ? 0 : 1,
          }}
          transition={{ duration: 0.18 }}
          className="overflow-hidden"
        >
          <ul className="text-xs text-muted-foreground space-y-1.5 pt-3 pl-1">
            {GUIDELINES.map((g) => (
              <li key={g} className="flex gap-2">
                <span className="text-primary mt-1">•</span>
                {g}
              </li>
            ))}
          </ul>
        </motion.div>
      </CardContent>
    </Card>
  );
}
