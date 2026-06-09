'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search, Download } from 'lucide-react';
import { useAdminApp } from '@/components/dashboard/admin-app-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { buildAdminAppApiPath } from '@/lib/admin-app-selection';
import {
  KunanyeshaAdminPaymentItem,
  KunanyeshaAdminPaymentsResponse,
  KunanyeshaAdminPaymentsSummaryResponse,
} from '@/lib/kunanyesha-admin-types';

export default function PaymentsPage() {
  const { selectedApp, selectedAppKey } = useAdminApp()
  const [summary, setSummary] = useState<KunanyeshaAdminPaymentsSummaryResponse | null>(null)
  const [payments, setPayments] = useState<KunanyeshaAdminPaymentItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (!selectedAppKey) return

    void Promise.all([
      fetch(buildAdminAppApiPath('payments/summary'), { cache: 'no-store' }),
      fetch(buildAdminAppApiPath('payments'), { cache: 'no-store' }),
    ]).then(async ([summaryRes, paymentsRes]) => {
      if (summaryRes.ok) {
        setSummary((await summaryRes.json()) as KunanyeshaAdminPaymentsSummaryResponse)
      }
      if (paymentsRes.ok) {
        const data = (await paymentsRes.json()) as KunanyeshaAdminPaymentsResponse
        setPayments(data.items)
      }
    })
  }, [selectedAppKey])

  const filteredPayments = useMemo(
    () =>
      payments.filter((payment) => {
        const needle = searchQuery.toLowerCase()
        return (
          payment.reference?.toLowerCase().includes(needle) ||
          payment.user_id?.toLowerCase().includes(needle) ||
          payment.status.toLowerCase().includes(needle) ||
          !needle
        )
      }),
    [payments, searchQuery],
  )

  return (
    <div className="space-y-6 p-4 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold text-foreground">Payments</h1>
          <p className="text-muted-foreground mt-1">Transaction history and revenue tracking</p>
        </div>
        <Button variant="outline" className="w-full sm:w-auto">
          <Download size={18} className="mr-2" />
          Export
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-2xl p-6">
          <p className="text-sm font-medium text-muted-foreground mb-2">Completed Payments</p>
          <p className="text-3xl font-bold text-foreground">${((summary?.completed_total || 0) / 1000).toFixed(1)}K</p>
          <p className="text-xs text-emerald-500 mt-2">✓ {summary?.completed_count || 0} transactions</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-6">
          <p className="text-sm font-medium text-muted-foreground mb-2">Pending</p>
          <p className="text-3xl font-bold text-amber-500">${((summary?.pending_total || 0) / 1000).toFixed(1)}K</p>
          <p className="text-xs text-amber-500 mt-2">⏱ {summary?.pending_count || 0} transactions</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-6">
          <p className="text-sm font-medium text-muted-foreground mb-2">Failed</p>
          <p className="text-3xl font-bold text-red-500">${((summary?.failed_total || 0) / 1000).toFixed(1)}K</p>
          <p className="text-xs text-red-500 mt-2">✗ {summary?.failed_count || 0} transactions</p>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-2 w-full">
        <Search size={16} className="text-muted-foreground" />
        <input
          type="text"
          placeholder="Search transactions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground flex-1"
        />
      </div>

      {/* Transactions Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">Date</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">Application</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">Method</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">Status</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-foreground">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((payment) => (
                <tr key={payment.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4 text-sm text-foreground">
                    {payment.created_at ? new Date(payment.created_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-foreground">
                    {payment.user_id || 'Unknown user'}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{selectedApp?.name || '—'}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-primary">${payment.amount.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{payment.provider || '—'}</td>
                  <td className="px-6 py-4">
                    <Badge
                      variant={
                        payment.status === 'completed'
                          ? 'default'
                          : payment.status === 'pending'
                          ? 'secondary'
                          : 'destructive'
                      }
                      className={
                        payment.status === 'completed'
                          ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/20'
                          : payment.status === 'pending'
                          ? 'bg-amber-500/20 text-amber-500 border-amber-500/20'
                          : 'bg-red-500/20 text-red-500 border-red-500/20'
                      }
                    >
                      {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-sm font-medium text-muted-foreground hover:text-foreground">
                      {payment.reference || 'View'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
