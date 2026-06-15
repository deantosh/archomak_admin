import { MoreVertical, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/dashboard/status-badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface AppCardProps {
  id: string;
  name: string;
  logoUrl?: string | null;
  status: 'operational' | 'warning' | 'critical';
  environment: 'production' | 'staging';
  users: number;
  apiHealth: number;
  requests: number;
  revenue: number;
  lastDeployment?: string | null;
  activeUsers: number;
  syncLoading?: boolean;
  onSync?: (appId: string) => void;
  onViewDetails?: (appId: string) => void;
}

const statusConfig = {
  operational: { label: 'Operational', color: 'bg-emerald-500/10 text-emerald-500' },
  warning: { label: 'Warning', color: 'bg-amber-500/10 text-amber-500' },
  critical: { label: 'Critical', color: 'bg-red-500/10 text-red-500' },
};

function getTimeAgo(timestamp?: string | null) {
  if (!timestamp) return '—';
  const date = new Date(timestamp);
  const now = new Date();
  const hours = Math.floor((now.getTime() - date.getTime()) / 3600000);

  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function AppLogo({ name, logoUrl }: { name: string; logoUrl?: string | null }) {
  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={logoUrl} alt={`${name} logo`} className="h-full w-full object-contain p-1" />
    );
  }
  return (
    <span className="text-lg font-bold text-muted-foreground select-none">
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

export function AppCard({
  id,
  name,
  logoUrl,
  status,
  environment,
  users,
  apiHealth,
  requests,
  revenue,
  lastDeployment,
  activeUsers,
  syncLoading = false,
  onSync,
  onViewDetails,
}: AppCardProps) {
  return (
    <div className="bg-card border border-border rounded-2xl p-6 hover:border-primary/50 transition-all duration-200 hover:shadow-lg hover:-translate-y-1">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted shrink-0">
            <AppLogo name={name} logoUrl={logoUrl} />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{name}</h3>
            <div className="mt-2">
              <StatusBadge status={status} />
            </div>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1 hover:bg-muted rounded-lg transition-colors">
              <MoreVertical size={16} className="text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onViewDetails?.(id)}>View Details</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSync?.(id)} disabled={syncLoading}>
              {syncLoading ? 'Syncing…' : 'Sync now'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Env Badge */}
      <div className="mb-4">
        <Badge variant={environment === 'production' ? 'default' : 'secondary'}>
          {environment.charAt(0).toUpperCase() + environment.slice(1)}
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Users</p>
          <p className="text-lg font-semibold text-foreground">{users.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">API Health</p>
          <span className={`text-lg font-semibold ${apiHealth > 98 ? 'text-emerald-500' : 'text-amber-500'}`}>
            {apiHealth}%
          </span>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Daily Requests</p>
          <p className="text-sm text-foreground">{requests.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Revenue</p>
          <p className="text-sm font-semibold text-primary">${revenue.toLocaleString()}</p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs border-t border-border pt-3">
        <div className="flex items-center gap-1 text-muted-foreground">
          <Users size={14} />
          <span>{activeUsers.toLocaleString()} active</span>
        </div>
        <span className="text-muted-foreground">Deployed {getTimeAgo(lastDeployment)}</span>
      </div>
    </div>
  );
}
