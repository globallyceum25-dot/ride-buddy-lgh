import { Calendar, Play, CheckCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CalendarStatsBarProps {
  stats: {
    tripsToday: number;
    inProgress: number;
    completed: number;
    upcomingThisWeek: number;
  } | undefined;
}

interface StatItemProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  color?: string;
}

function StatItem({ label, value, icon, color }: StatItemProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-card border shadow-sm">
      <div className={cn(
        'flex items-center justify-center w-10 h-10 rounded-lg',
        color || 'bg-muted'
      )}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold leading-none">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      </div>
    </div>
  );
}

export function CalendarStatsBar({ stats }: CalendarStatsBarProps) {
  if (!stats) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-[72px] rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <StatItem
        label="Today"
        value={stats.tripsToday}
        icon={<Calendar className="h-5 w-5 text-foreground" />}
        color="bg-accent"
      />
      <StatItem
        label="In Progress"
        value={stats.inProgress}
        icon={<Play className="h-5 w-5 text-primary" />}
        color="bg-primary/10"
      />
      <StatItem
        label="Completed"
        value={stats.completed}
        icon={<CheckCircle className="h-5 w-5 text-success" />}
        color="bg-success/10"
      />
      <StatItem
        label="This Week"
        value={stats.upcomingThisWeek}
        icon={<Clock className="h-5 w-5 text-info" />}
        color="bg-info/10"
      />
    </div>
  );
}
