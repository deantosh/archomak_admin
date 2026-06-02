export function StatCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-2xl p-6 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="h-4 bg-muted rounded w-24 mb-3" />
          <div className="h-8 bg-muted rounded w-32 mb-2" />
          <div className="h-3 bg-muted rounded w-40" />
        </div>
        <div className="w-12 h-12 bg-muted rounded-xl" />
      </div>
    </div>
  );
}

export function ChartCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-2xl p-6 animate-pulse">
      <div className="h-6 bg-muted rounded w-40 mb-6" />
      <div className="h-64 bg-muted rounded" />
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <tr className="border-b border-border">
      {[...Array(5)].map((_, i) => (
        <td key={i} className="px-6 py-4">
          <div className="h-4 bg-muted rounded animate-pulse" />
        </td>
      ))}
    </tr>
  );
}
