'use client';

import { motion } from 'framer-motion';
import { ArrowDown, ArrowUp } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  delay?: number;
}

export function StatCard({ title, value, change, icon, trend = 'neutral', delay = 0 }: StatCardProps) {
  const isPositive = trend === 'up' || (change !== undefined && change > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3, ease: 'easeOut' }}
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      className="bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-colors duration-200 cursor-default"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 select-none">
            {title}
          </p>
          <p
            className="text-2xl lg:text-3xl font-bold text-foreground tabular-nums truncate"
            style={{ fontFamily: 'var(--font-space-grotesk)' }}
          >
            {value}
          </p>
          {change !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              {isPositive ? (
                <ArrowUp size={13} className="text-primary shrink-0" />
              ) : (
                <ArrowDown size={13} className="text-destructive shrink-0" />
              )}
              <span className={`text-xs font-semibold ${isPositive ? 'text-primary' : 'text-destructive'}`}>
                {isPositive ? '+' : ''}{change}%
              </span>
              <span className="text-xs text-muted-foreground">vs last month</span>
            </div>
          )}
        </div>

        {icon && (
          <div className="shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            {icon}
          </div>
        )}
      </div>
    </motion.div>
  );
}
