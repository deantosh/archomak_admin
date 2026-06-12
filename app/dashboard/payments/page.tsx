'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  ChevronRight,
  CopyCheck,
  Copy,
  CreditCard,
  Download,
  Hash,
  Mail,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  KunanyeshaAdminPaymentItem,
  KunanyeshaAdminPaymentsResponse,
  KunanyeshaAdminPaymentsSummaryResponse,
} from '@/lib/kunanyesha-admin-types';

// ─── helpers ───────────────────────────────────────────────────────────────

function fmtDate(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function fmtDateTime(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function fmtAmount(amount: number, currency: string | null | undefined) {
  const c = currency ?? 'USD';
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: c, maximumFractionDigits: 2 }).format(amount);
}

// ─── status badge ──────────────────────────────────────────────────────────

const STATUS_MAP: Record<string, { pill: string; dot: string; label: string }> = {
  completed: {
    pill: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400',
    dot: 'bg-emerald-500',
    label: 'Completed',
  },
  pending: {
    pill: 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400',
    dot: 'bg-amber-500',
    label: 'Pending',
  },
  failed: {
    pill: 'bg-red-500/10 text-red-600 border-red-500/20 dark:text-red-400',
    dot: 'bg-red-500',
    label: 'Failed',
  },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status] ?? {
    pill: 'bg-muted text-muted-foreground border-border',
    dot: 'bg-muted-foreground',
    label: status,
  };
  return (
    <Badge variant="outline" className={`gap-1.5 text-xs font-medium ${s.pill}`}>
      <span className={`inline-block w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </Badge>
  );
}

// ─── copy button ───────────────────────────────────────────────────────────

function CopyButton({ value }: { value: string | null | undefined }) {
  const [copied, setCopied] = useState(false);
  if (!value) return null;

  function handleCopy() {
    void navigator.clipboard.writeText(value!).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }

  return (
    <button
      onClick={handleCopy}
      title="Copy to clipboard"
      className="ml-1.5 inline-flex items-center justify-center w-5 h-5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
    >
      {copied ? <CopyCheck size={12} /> : <Copy size={12} />}
    </button>
  );
}

// ─── detail row in sheet ───────────────────────────────────────────────────

function DetailRow({
  icon: Icon,
  label,
  value,
  mono = false,
  copyable = false,
}: {
  icon: React.ElementType;
  label: string;
  value: string | null | undefined;
  mono?: boolean;
  copyable?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 py-3.5 border-b border-border/60 last:border-0">
      <div className="mt-0.5 shrink-0 flex items-center justify-center w-8 h-8 rounded-lg bg-muted">
        <Icon size={13} className="text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] text-muted-foreground mb-0.5 select-none">{label}</p>
        <div className="flex items-start">
          <p
            className={`text-sm text-foreground break-all leading-snug ${
              mono ? 'font-mono text-xs' : 'font-medium'
            }`}
          >
            {value ?? '—'}
          </p>
          {copyable && <CopyButton value={value} />}
        </div>
      </div>
    </div>
  );
}

// ─── section label ─────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1 select-none">
      {children}
    </p>
  );
}

// ─── payment detail sheet ──────────────────────────────────────────────────

function PaymentDetailSheet({
  payment,
  onClose,
}: {
  payment: KunanyeshaAdminPaymentItem | null;
  onClose: () => void;
}) {
  return (
    <Sheet open={!!payment} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[420px] flex flex-col gap-0 p-0 overflow-hidden"
      >
        {payment && (
          <>
            {/* Sheet header — reference is the CS tracking ID */}
            <SheetHeader className="px-5 pt-5 pb-4 border-b border-border">
              <div className="flex items-center justify-between gap-3">
                <SheetTitle className="text-sm font-semibold leading-none">
                  Payment Detail
                </SheetTitle>
                <StatusBadge status={payment.status} />
              </div>
              <SheetDescription className="font-mono text-[11px] text-muted-foreground break-all mt-1.5">
                <span className="text-[10px] uppercase tracking-wider mr-1.5 not-italic">Ref</span>
                {payment.reference ?? payment.id}
                <CopyButton value={payment.reference ?? payment.id} />
              </SheetDescription>
            </SheetHeader>

            {/* Amount hero */}
            <div className="px-5 py-5 bg-muted/30 border-b border-border">
              <p className="text-[11px] text-muted-foreground mb-1 select-none">Amount charged</p>
              <p className="text-3xl font-bold tracking-tight text-foreground">
                {fmtAmount(payment.amount, payment.currency)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{payment.provider ?? 'Unknown provider'}</p>
            </div>

            {/* Detail sections — scrollable */}
            <div className="flex-1 overflow-y-auto overscroll-contain">

              {/* Customer — email is the primary CS identifier */}
              <div className="px-5 pt-5 pb-1">
                <SectionLabel>Customer</SectionLabel>
                <DetailRow icon={Mail} label="Email" value={payment.email} copyable />
                <DetailRow icon={Hash} label="User ID" value={payment.user_id} mono copyable />
              </div>

              {/* Transaction — reference is the gateway tracking ID */}
              <div className="px-5 pt-4 pb-1 border-t border-border/60">
                <SectionLabel>Transaction</SectionLabel>
                <DetailRow icon={Hash} label="Tracking Reference" value={payment.reference} mono copyable />
                <DetailRow icon={CreditCard} label="Provider" value={payment.provider} />
                <DetailRow icon={Hash} label="Currency" value={payment.currency ?? 'USD'} />
              </div>

              {/* Timeline */}
              <div className="px-5 pt-4 pb-5 border-t border-border/60">
                <SectionLabel>Timeline</SectionLabel>
                <DetailRow icon={Calendar} label="Created" value={fmtDateTime(payment.created_at)} />
                <DetailRow icon={RefreshCw} label="Last Updated" value={fmtDateTime(payment.updated_at)} />
              </div>
            </div>

            {/* CS actions footer */}
            <div className="px-5 py-4 border-t border-border bg-muted/20 shrink-0">
              <SectionLabel>Support Actions</SectionLabel>
              <div className="flex flex-col gap-2 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-xs h-8"
                  onClick={() => {
                    const ref = payment.reference ?? payment.id;
                    if (ref) void navigator.clipboard.writeText(ref);
                  }}
                >
                  <Copy size={12} className="mr-2" />
                  Copy tracking reference
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-xs h-8"
                  onClick={() => {
                    const val = payment.email ?? payment.user_id;
                    if (val) void navigator.clipboard.writeText(val);
                  }}
                >
                  <Copy size={12} className="mr-2" />
                  {payment.email ? 'Copy customer email' : 'Copy user ID'}
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

// ─── page ──────────────────────────────────────────────────────────────────

export default function PaymentsPage() {
  const [summary, setSummary] = useState<KunanyeshaAdminPaymentsSummaryResponse | null>(null);
  const [payments, setPayments] = useState<KunanyeshaAdminPaymentItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selected, setSelected] = useState<KunanyeshaAdminPaymentItem | null>(null);

  useEffect(() => {
    void Promise.all([
      fetch('/api/kunanyesha-admin/payments/summary', { cache: 'no-store' }),
      fetch('/api/kunanyesha-admin/payments', { cache: 'no-store' }),
    ]).then(async ([summaryRes, paymentsRes]) => {
      if (summaryRes.ok) setSummary((await summaryRes.json()) as KunanyeshaAdminPaymentsSummaryResponse);
      if (paymentsRes.ok) {
        const data = (await paymentsRes.json()) as KunanyeshaAdminPaymentsResponse;
        setPayments(data.items);
      }
    });
  }, []);

  const filtered = useMemo(
    () =>
      payments.filter((p) => {
        const q = searchQuery.toLowerCase().trim();
        if (!q) return true;
        return (
          p.reference?.toLowerCase().includes(q) ||
          p.email?.toLowerCase().includes(q) ||
          p.status.toLowerCase().includes(q) ||
          p.provider?.toLowerCase().includes(q)
        );
      }),
    [payments, searchQuery],
  );

  return (
    <>
      <div className="min-h-screen space-y-5 p-4 sm:p-6 lg:p-8">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="page-title">Payments</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Transaction history and revenue tracking
            </p>
          </div>
          <Button variant="outline" size="sm" className="w-full sm:w-auto">
            <Download size={14} className="mr-2" />
            Export
          </Button>
        </div>

        {/* ── Summary cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-card border border-border rounded-2xl p-5">
            <p className="text-xs font-medium text-muted-foreground">Completed</p>
            <p className="text-2xl font-bold text-foreground mt-1.5">
              {fmtAmount((summary?.completed_total ?? 0), 'USD')}
            </p>
            <p className="text-xs text-emerald-500 mt-1">
              {summary?.completed_count ?? 0} transactions
            </p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-5">
            <p className="text-xs font-medium text-muted-foreground">Pending</p>
            <p className="text-2xl font-bold text-amber-500 mt-1.5">
              {fmtAmount((summary?.pending_total ?? 0), 'USD')}
            </p>
            <p className="text-xs text-amber-500 mt-1">
              {summary?.pending_count ?? 0} transactions
            </p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-5">
            <p className="text-xs font-medium text-muted-foreground">Failed</p>
            <p className="text-2xl font-bold text-red-500 mt-1.5">
              {fmtAmount((summary?.failed_total ?? 0), 'USD')}
            </p>
            <p className="text-xs text-red-500 mt-1">
              {summary?.failed_count ?? 0} transactions
            </p>
          </div>
        </div>

        {/* ── Search ── */}
        <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-2.5">
          <Search size={14} className="text-muted-foreground shrink-0" />
          <input
            type="text"
            placeholder="Search by email, reference, provider or status…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground flex-1 min-w-0"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* ── Transactions list ── */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">

          {/* Mobile card list */}
          <ul className="sm:hidden divide-y divide-border">
            {filtered.length === 0 && (
              <li className="py-12 text-center text-sm text-muted-foreground">
                No transactions found
              </li>
            )}
            {filtered.map((payment) => (
              <li key={payment.id}>
                <button
                  onClick={() => setSelected(payment)}
                  className="w-full text-left px-4 py-4 flex items-center gap-3 hover:bg-muted/40 active:bg-muted transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <StatusBadge status={payment.status} />
                      <span className="text-xs text-muted-foreground">
                        {fmtDate(payment.created_at)}
                      </span>
                    </div>
                    <p className="text-xs text-foreground font-medium truncate">
                      {payment.email ?? <span className="text-muted-foreground italic">No email</span>}
                    </p>
                    {payment.reference && (
                      <p className="text-[11px] font-mono text-muted-foreground truncate mt-0.5">
                        {payment.reference}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold text-foreground">
                      {fmtAmount(payment.amount, payment.currency)}
                    </p>
                    <ChevronRight size={14} className="text-muted-foreground ml-auto mt-1" />
                  </div>
                </button>
              </li>
            ))}
          </ul>

          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-muted-foreground tracking-wide">
                    Date
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-muted-foreground tracking-wide">
                    Customer
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-muted-foreground tracking-wide">
                    Reference
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-muted-foreground tracking-wide">
                    Amount
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-muted-foreground tracking-wide">
                    Provider
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-muted-foreground tracking-wide">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                      No transactions found
                    </td>
                  </tr>
                )}
                {filtered.map((payment) => (
                  <tr
                    key={payment.id}
                    onClick={() => setSelected(payment)}
                    className="border-b border-border hover:bg-muted/40 transition-colors cursor-pointer group"
                  >
                    <td className="px-5 py-4 text-sm text-muted-foreground whitespace-nowrap">
                      {fmtDate(payment.created_at)}
                    </td>
                    <td className="px-5 py-4">
                      {payment.email ? (
                        <span className="block text-sm text-foreground font-medium truncate max-w-50">
                          {payment.email}
                        </span>
                      ) : (
                        <span className="block text-sm text-muted-foreground italic">No email</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-mono text-[11px] text-foreground truncate block max-w-40">
                        {payment.reference ?? '—'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-foreground whitespace-nowrap">
                      {fmtAmount(payment.amount, payment.currency)}
                    </td>
                    <td className="px-5 py-4 text-sm text-muted-foreground capitalize">
                      {payment.provider ?? '—'}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-between gap-2">
                        <StatusBadge status={payment.status} />
                        <ChevronRight
                          size={14}
                          className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      </div>

      <PaymentDetailSheet payment={selected} onClose={() => setSelected(null)} />
    </>
  );
}
