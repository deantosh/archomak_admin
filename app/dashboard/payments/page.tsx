'use client';

import { Search, Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { mockPayments } from '@/lib/mock-data';

export default function PaymentsPage() {
  const totalRevenue = mockPayments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingAmount = mockPayments
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + p.amount, 0);

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
          <p className="text-3xl font-bold text-foreground">${(totalRevenue / 1000).toFixed(1)}K</p>
          <p className="text-xs text-emerald-500 mt-2">✓ {mockPayments.filter(p => p.status === 'completed').length} transactions</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-6">
          <p className="text-sm font-medium text-muted-foreground mb-2">Pending</p>
          <p className="text-3xl font-bold text-amber-500">${(pendingAmount / 1000).toFixed(1)}K</p>
          <p className="text-xs text-amber-500 mt-2">⏱ {mockPayments.filter(p => p.status === 'pending').length} transactions</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-6">
          <p className="text-sm font-medium text-muted-foreground mb-2">Failed</p>
          <p className="text-3xl font-bold text-red-500">$2.1K</p>
          <p className="text-xs text-red-500 mt-2">✗ {mockPayments.filter(p => p.status === 'failed').length} transactions</p>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-2 w-full">
        <Search size={16} className="text-muted-foreground" />
        <input
          type="text"
          placeholder="Search transactions..."
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
              {mockPayments.map((payment) => (
                <tr key={payment.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4 text-sm text-foreground">{payment.date}</td>
                  <td className="px-6 py-4 text-sm font-medium text-foreground">{payment.customer}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{payment.app}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-primary">${payment.amount.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {payment.method === 'card' ? '💳 Card' : '🏦 Bank Transfer'}
                  </td>
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
                    <button className="text-sm font-medium text-muted-foreground hover:text-foreground">View</button>
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
