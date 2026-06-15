'use client';

import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useAdminApp } from '@/components/dashboard/admin-app-provider';
import { AppPicker } from '@/components/dashboard/app-picker';
import { Button } from '@/components/ui/button';
import { buildAdminAppApiPath } from '@/lib/admin-app-selection';
import { KunanyeshaAdminNotificationItem, KunanyeshaAdminNotificationsResponse } from '@/lib/kunanyesha-admin-types';

export default function NotificationsPage() {
  const { selectedApp, selectedAppKey } = useAdminApp()
  const [notifications, setNotifications] = useState<KunanyeshaAdminNotificationItem[]>([])

  useEffect(() => {
    if (!selectedAppKey) return

    void fetch(buildAdminAppApiPath('notifications'), { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: KunanyeshaAdminNotificationsResponse | null) => {
        setNotifications(data?.items || [])
      })
  }, [selectedAppKey])

  return (
    <div className="space-y-6 p-4 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold text-foreground">Notifications</h1>
          <p className="text-muted-foreground mt-1">
            Recent alerts and updates for {selectedApp?.name || 'the selected application'}
          </p>
        </div>
        <Button variant="outline">Mark All as Read</Button>
      </div>

      <AppPicker className="mb-6" />

      <div className="space-y-3">
        {notifications.map((notif) => (
          <div
            key={notif.id}
            className={`bg-card border ${notif.severity === 'info' ? 'border-border' : 'border-primary/50 bg-primary/5'} rounded-2xl p-4 flex items-start justify-between hover:border-primary/30 transition-colors`}
          >
            <div className="flex items-start gap-3 flex-1">
              <div className="text-2xl mt-1">
                {notif.severity === 'critical' ? '⚠️' : notif.severity === 'warning' ? '⏳' : '✅'}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground">{notif.title}</p>
                <p className="text-sm text-muted-foreground mt-1">{notif.message}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {new Date(notif.timestamp).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
            <button className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
