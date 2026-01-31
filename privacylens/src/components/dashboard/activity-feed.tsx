'use client';

import { formatRelativeTime } from '@/lib/utils';
import { FileSearch, AlertTriangle, TrendingUp, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Activity {
  id: string;
  type: 'analysis' | 'vulnerability' | 'improvement' | 'fixed';
  programName: string;
  description: string;
  timestamp: string;
}

interface ActivityFeedProps {
  activities: Activity[];
}

const activityConfig = {
  analysis: {
    icon: FileSearch,
    color: 'text-blue-500',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
  },
  vulnerability: {
    icon: AlertTriangle,
    color: 'text-red-500',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
  },
  improvement: {
    icon: TrendingUp,
    color: 'text-green-500',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
  },
  fixed: {
    icon: CheckCircle,
    color: 'text-green-500',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
  },
};

export function ActivityFeed({ activities }: ActivityFeedProps) {
  return (
    <div className="space-y-4">
      {activities.map((activity, index) => {
        const config = activityConfig[activity.type];
        const Icon = config.icon;

        return (
          <div key={activity.id} className="flex gap-3">
            <div
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                config.bgColor
              )}
            >
              <Icon className={cn('h-4 w-4', config.color)} />
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-sm">
                <span className="font-medium">{activity.programName}</span>
              </p>
              <p className="text-sm text-muted-foreground">{activity.description}</p>
              <p className="text-xs text-muted-foreground">
                {formatRelativeTime(activity.timestamp)}
              </p>
            </div>
          </div>
        );
      })}

      {activities.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No recent activity
        </p>
      )}
    </div>
  );
}
