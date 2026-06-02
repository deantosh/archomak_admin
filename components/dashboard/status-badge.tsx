import { motion } from 'framer-motion';

type StatusType = 'operational' | 'warning' | 'critical' | 'inactive';

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  showDot?: boolean;
  animated?: boolean;
}

const statusConfig = {
  operational: {
    color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    dotColor: 'bg-emerald-500',
    label: 'Operational',
  },
  warning: {
    color: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    dotColor: 'bg-amber-500',
    label: 'Warning',
  },
  critical: {
    color: 'bg-red-500/10 text-red-500 border-red-500/20',
    dotColor: 'bg-red-500',
    label: 'Critical',
  },
  inactive: {
    color: 'bg-muted text-muted-foreground border-border',
    dotColor: 'bg-muted-foreground',
    label: 'Inactive',
  },
};

export function StatusBadge({
  status,
  label,
  showDot = true,
  animated = true,
}: StatusBadgeProps) {
  const config = statusConfig[status];
  const displayLabel = label || config.label;

  const dotVariants = animated ? {
    initial: { scale: 1, opacity: 1 },
    animate: { scale: [1, 1.2, 1], opacity: [1, 0.8, 1] },
  } : undefined;

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border ${config.color}`}>
      {showDot && (
        <motion.div
          className={`w-2 h-2 rounded-full ${config.dotColor}`}
          variants={dotVariants}
          initial="initial"
          animate={animated && status === 'operational' ? 'animate' : 'initial'}
          transition={animated ? { duration: 2, repeat: Infinity } : undefined}
        />
      )}
      {displayLabel}
    </div>
  );
}
