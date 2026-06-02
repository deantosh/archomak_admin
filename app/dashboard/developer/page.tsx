'use client';

import { Copy, Eye, EyeOff, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

const apiKeys = [
  {
    id: 'key-001',
    name: 'Production API Key',
    key: 'sk_live_51234567890abcdefghijklmnop',
    created: '2024-01-15',
    lastUsed: '2024-05-27',
    requests: 1234567,
  },
  {
    id: 'key-002',
    name: 'Development API Key',
    key: 'sk_test_87654321abcdefghijklmnop',
    created: '2024-02-20',
    lastUsed: '2024-05-26',
    requests: 45678,
  },
];

const webhooks = [
  {
    id: 'webhook-001',
    url: 'https://api.example.com/webhooks/events',
    events: ['payment.completed', 'user.created', 'deployment.finished'],
    status: 'active',
    lastFired: '2024-05-27T02:45:00Z',
  },
];

export default function DeveloperPage() {
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

  return (
    <div className="space-y-6 p-4 lg:p-8">
      <div>
        <h1 className="text-3xl lg:text-4xl font-bold text-foreground">Developer</h1>
        <p className="text-muted-foreground mt-1">API keys, webhooks, and integration tools</p>
      </div>

      {/* API Keys Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">API Keys</h2>
          <Button size="sm">
            <Plus size={16} className="mr-2" />
            Create Key
          </Button>
        </div>

        <div className="space-y-3">
          {apiKeys.map((apiKey) => (
            <div key={apiKey.id} className="bg-card border border-border rounded-2xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-foreground">{apiKey.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">Created {apiKey.created}</p>
                </div>
                <button className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground">
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="bg-muted rounded-lg p-3 mb-4 flex items-center justify-between">
                <code className="text-xs font-mono text-foreground">
                  {showKeys[apiKey.id] ? apiKey.key : apiKey.key.slice(0, 10) + '•'.repeat(20)}
                </code>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowKeys(prev => ({ ...prev, [apiKey.id]: !prev[apiKey.id] }))}
                    className="p-1 hover:bg-background rounded transition-colors"
                  >
                    {showKeys[apiKey.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  <button className="p-1 hover:bg-background rounded transition-colors">
                    <Copy size={16} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Requests</p>
                  <p className="font-semibold text-foreground">{(apiKey.requests / 1000).toFixed(1)}K</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Last Used</p>
                  <p className="font-semibold text-foreground">{apiKey.lastUsed}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Status</p>
                  <p className="font-semibold text-emerald-500">Active</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Webhooks Section */}
      <div className="space-y-4 pt-4 border-t border-border">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">Webhooks</h2>
          <Button size="sm">
            <Plus size={16} className="mr-2" />
            Create Webhook
          </Button>
        </div>

        <div className="space-y-3">
          {webhooks.map((webhook) => (
            <div key={webhook.id} className="bg-card border border-border rounded-2xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground font-mono text-sm break-all">{webhook.url}</h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {webhook.events.map((event) => (
                      <span key={event} className="text-xs bg-muted px-2 py-1 rounded text-muted-foreground">
                        {event}
                      </span>
                    ))}
                  </div>
                </div>
                <button className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground">
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div>
                  <span className="inline-block w-2 h-2 bg-emerald-500 rounded-full mr-2" />
                  <span className="text-emerald-500 font-medium">Active</span>
                </div>
                <p className="text-muted-foreground text-xs">Last fired: 2024-05-27 02:45 UTC</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rate Limits */}
      <div className="bg-card border border-border rounded-2xl p-6 border-t border-border pt-4">
        <h2 className="text-xl font-bold text-foreground mb-4">Rate Limits</h2>
        <div className="space-y-4">
          {[
            { name: 'API Requests', current: 245000, limit: 1000000, unit: 'requests/hour' },
            { name: 'Webhook Deliveries', current: 12340, limit: 50000, unit: 'webhooks/hour' },
          ].map((limit) => (
            <div key={limit.name}>
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium text-foreground">{limit.name}</p>
                <span className="text-sm text-muted-foreground">{limit.current.toLocaleString()} / {limit.limit.toLocaleString()}</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary"
                  style={{ width: `${(limit.current / limit.limit) * 100}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">{limit.unit}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
