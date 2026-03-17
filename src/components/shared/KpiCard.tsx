import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string;
  icon?: LucideIcon;
  iconClassName?: string;
  delta?: { value: string; positive?: boolean };
  description?: string;
  className?: string;
}

export function KpiCard({
  title,
  value,
  icon: Icon,
  iconClassName,
  delta,
  description,
  className,
}: KpiCardProps) {
  return (
    <Card className={cn("shadow-sm border-border", className)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">
              {title}
            </p>
            <p className="text-2xl font-bold tracking-tight truncate">{value}</p>
            {delta && (
              <div
                className={cn(
                  "flex items-center gap-1 text-xs font-medium",
                  delta.positive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                )}
              >
                {delta.positive ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {delta.value}
              </div>
            )}
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          {Icon && (
            <div
              className={cn(
                "flex-shrink-0 rounded-lg p-2.5",
                iconClassName ?? "bg-primary/10 text-primary"
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
