interface ActivityItem {
  id: string;
  icon: string;
  title: string;
  description: string;
  timestamp: string;
  status: 'success' | 'warning' | 'error' | string;
}

interface ActivityFeedProps {
  items: ActivityItem[];
}

function getStatusColor(status: string) {
  switch (status) {
    case 'success':
      return 'text-emerald-500 bg-emerald-500/10';
    case 'warning':
      return 'text-amber-500 bg-amber-500/10';
    case 'error':
      return 'text-red-500 bg-red-500/10';
    default:
      return 'text-blue-500 bg-blue-500/10';
  }
}

function getTimeAgo(timestamp: string) {
  const date = new Date(timestamp);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export function ActivityFeed({ items }: ActivityFeedProps) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-start gap-3 p-3 rounded-xl hover:bg-muted transition-colors"
        >
          <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm ${getStatusColor(item.status)}`}>
            {item.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">{item.title}</p>
            <p className="text-xs text-muted-foreground truncate">{item.description}</p>
          </div>
          <span className="text-xs text-muted-foreground flex-shrink-0">{getTimeAgo(item.timestamp)}</span>
        </div>
      ))}
    </div>
  );
}
