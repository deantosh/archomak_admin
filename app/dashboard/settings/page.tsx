'use client';

import { useState } from 'react';
import { Save, Lock, Bell, Palette, Users, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type TabType = 'general' | 'security' | 'integrations' | 'notifications' | 'billing';

const settingTabs = [
  { id: 'general', label: 'General', icon: '⚙️' },
  { id: 'security', label: 'Security', icon: '🔐' },
  { id: 'integrations', label: 'Integrations', icon: '🔌' },
  { id: 'notifications', label: 'Notifications', icon: '🔔' },
  { id: 'billing', label: 'Billing', icon: '💳' },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('general');

  return (
    <div className="space-y-6 p-4 lg:p-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl lg:text-4xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account and platform preferences</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border overflow-x-auto">
        {settingTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* General Settings */}
      {activeTab === 'general' && (
        <div className="space-y-6 max-w-2xl">
          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Organization Info</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Organization Name</label>
                <input
                  type="text"
                  defaultValue="Archomak"
                  className="w-full bg-muted border border-border rounded-lg px-4 py-2 text-foreground outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                <input
                  type="email"
                  defaultValue="contact@archomak.com"
                  className="w-full bg-muted border border-border rounded-lg px-4 py-2 text-foreground outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Description</label>
                <textarea
                  defaultValue="Digital products for Africa and the world"
                  className="w-full bg-muted border border-border rounded-lg px-4 py-2 text-foreground outline-none focus:border-primary transition-colors"
                  rows={3}
                />
              </div>
              <Button className="w-full sm:w-auto">
                <Save size={16} className="mr-2" />
                Save Changes
              </Button>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Theme</h2>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <input type="radio" id="dark" name="theme" defaultChecked />
                <label htmlFor="dark" className="text-sm text-foreground cursor-pointer">Dark Mode (Current)</label>
              </div>
              <div className="flex items-center gap-2">
                <input type="radio" id="light" name="theme" />
                <label htmlFor="light" className="text-sm text-foreground cursor-pointer">Light Mode</label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Security Settings */}
      {activeTab === 'security' && (
        <div className="space-y-6 max-w-2xl">
          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Password</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Current Password</label>
                <input
                  type="password"
                  className="w-full bg-muted border border-border rounded-lg px-4 py-2 text-foreground outline-none focus:border-primary transition-colors"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">New Password</label>
                <input
                  type="password"
                  className="w-full bg-muted border border-border rounded-lg px-4 py-2 text-foreground outline-none focus:border-primary transition-colors"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Confirm Password</label>
                <input
                  type="password"
                  className="w-full bg-muted border border-border rounded-lg px-4 py-2 text-foreground outline-none focus:border-primary transition-colors"
                  placeholder="••••••••"
                />
              </div>
              <Button className="w-full sm:w-auto">Update Password</Button>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Two-Factor Authentication</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground">Status</p>
                <Badge className="mt-2 bg-emerald-500/10 text-emerald-500">Enabled</Badge>
              </div>
              <Button variant="outline">Manage</Button>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Active Sessions</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="text-sm">
                  <p className="font-medium text-foreground">Chrome on macOS</p>
                  <p className="text-xs text-muted-foreground">Last active: now</p>
                </div>
                <Badge className="bg-emerald-500/10 text-emerald-500">Current</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="text-sm">
                  <p className="font-medium text-foreground">Safari on iPhone</p>
                  <p className="text-xs text-muted-foreground">Last active: 2 hours ago</p>
                </div>
                <button className="text-sm text-destructive hover:text-destructive/80">Sign out</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Integrations */}
      {activeTab === 'integrations' && (
        <div className="space-y-6 max-w-2xl">
          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Connected Services</h2>
            <div className="space-y-3">
              {[
                { name: 'Stripe', icon: '💳', connected: true },
                { name: 'GitHub', icon: '🐙', connected: true },
                { name: 'Slack', icon: '💬', connected: false },
                { name: 'Google Analytics', icon: '📊', connected: false },
              ].map((service) => (
                <div key={service.name} className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{service.icon}</span>
                    <div>
                      <p className="font-medium text-foreground">{service.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {service.connected ? 'Connected' : 'Not connected'}
                      </p>
                    </div>
                  </div>
                  <Button variant={service.connected ? 'outline' : 'default'} size="sm">
                    {service.connected ? 'Disconnect' : 'Connect'}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Notifications */}
      {activeTab === 'notifications' && (
        <div className="space-y-6 max-w-2xl">
          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Email Notifications</h2>
            <div className="space-y-4">
              {[
                { label: 'Deployment notifications', checked: true },
                { label: 'Error alerts', checked: true },
                { label: 'Weekly reports', checked: false },
                { label: 'Marketing emails', checked: false },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id={item.label}
                    defaultChecked={item.checked}
                    className="w-4 h-4 rounded accent-primary"
                  />
                  <label htmlFor={item.label} className="text-sm text-foreground cursor-pointer">
                    {item.label}
                  </label>
                </div>
              ))}
            </div>
            <Button className="mt-4 w-full sm:w-auto">Save Preferences</Button>
          </div>
        </div>
      )}

      {/* Billing */}
      {activeTab === 'billing' && (
        <div className="space-y-6 max-w-2xl">
          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Current Plan</h2>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-3xl font-bold text-foreground">Professional</p>
                <p className="text-sm text-muted-foreground mt-1">$99/month</p>
              </div>
              <Badge className="bg-emerald-500/10 text-emerald-500">Active</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-4">Your next billing date is June 27, 2024</p>
            <Button variant="outline" className="w-full sm:w-auto">Manage Subscription</Button>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Payment Method</h2>
            <div className="flex items-center justify-between p-4 border border-border rounded-lg mb-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">💳</span>
                <div>
                  <p className="font-medium text-foreground">Visa ending in 4242</p>
                  <p className="text-xs text-muted-foreground">Expires 12/2026</p>
                </div>
              </div>
              <Button variant="outline" size="sm">Update</Button>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Billing History</h2>
            <div className="space-y-2 text-sm">
              {[
                { date: 'May 27, 2024', amount: '$99.00', status: 'Paid' },
                { date: 'Apr 27, 2024', amount: '$99.00', status: 'Paid' },
                { date: 'Mar 27, 2024', amount: '$99.00', status: 'Paid' },
              ].map((invoice, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div>
                    <p className="text-foreground">{invoice.date}</p>
                    <p className="text-xs text-muted-foreground">{invoice.amount}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-emerald-500/10 text-emerald-500 text-xs">{invoice.status}</Badge>
                    <button className="text-primary text-sm hover:underline">Download</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
