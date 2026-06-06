'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search, Plus, MoreVertical } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { KunanyeshaAdminUserItem, KunanyeshaAdminUsersResponse } from '@/lib/kunanyesha-admin-types';

export default function UsersPage() {
  const [users, setUsers] = useState<KunanyeshaAdminUserItem[]>([])
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCounty, setSelectedCounty] = useState<string | null>(null);

  useEffect(() => {
    void fetch('/api/kunanyesha-admin/users', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: KunanyeshaAdminUsersResponse | null) => {
        setUsers(data?.items || [])
      })
  }, [])

  const availableCounties = Array.from(
    new Set(users.map((user) => user.county).filter(Boolean) as string[]),
  )

  const filteredUsers = useMemo(
    () =>
      users.filter((user) => {
        const needle = searchQuery.toLowerCase()
        const matchesSearch =
          (user.full_name || '').toLowerCase().includes(needle) ||
          (user.email || '').toLowerCase().includes(needle)
        const matchesCounty = !selectedCounty || user.county === selectedCounty
        return matchesSearch && matchesCounty
      }),
    [users, searchQuery, selectedCounty],
  )

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  function getTimeAgo(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 3600) return 'now';
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
    return formatDate(dateString);
  }

  return (
    <div className="space-y-6 p-4 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold text-foreground">Users</h1>
          <p className="text-muted-foreground mt-1">Manage team members and permissions</p>
        </div>
        <Button className="w-full sm:w-auto">
          <Plus size={18} className="mr-2" />
          Invite User
        </Button>
      </div>

      {/* Controls */}
      <div className="space-y-4">
        {/* Search */}
        <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-2">
          <Search size={16} className="text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground flex-1"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">County:</span>
            <select
              value={selectedCounty || ''}
              onChange={(e) => setSelectedCounty(e.target.value || null)}
              className="bg-card border border-border rounded-lg px-3 py-1.5 text-sm text-foreground outline-none hover:border-primary/50 transition-colors"
            >
              <option value="">All Counties</option>
              {availableCounties.map((county) => (
                <option key={county} value={county}>{county}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}
      </div>

      {/* Users Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">User</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">Role</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">Last Active</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">Joined</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-foreground">Actions</th>
              </tr>
            </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-lg">
                        👤
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{user.full_name || 'Unknown user'}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge className="bg-blue-500/10 text-blue-500 border-0">
                      {user.job_title || 'User'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <Badge className="bg-emerald-500/10 text-emerald-500 border-0 capitalize">
                      active
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {user.updated_at ? getTimeAgo(user.updated_at) : '—'}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {user.created_at ? formatDate(user.created_at) : '—'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                          <MoreVertical size={16} className="text-muted-foreground" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View Profile</DropdownMenuItem>
                        <DropdownMenuItem>Edit Role</DropdownMenuItem>
                        <DropdownMenuItem>Reset Password</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">Remove User</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No users found matching your criteria.</p>
        </div>
      )}
    </div>
  );
}
