'use client';

import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { Search, Plus, MoreVertical, LoaderCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AdminTeamMember, AdminTeamResponse } from '@/lib/admin-team-types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toUserFriendlyErrorMessage } from '@/lib/user-friendly-errors';

export default function UsersPage() {
  const [users, setUsers] = useState<AdminTeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loadDebug, setLoadDebug] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteFullName, setInviteFullName] = useState('');
  const [inviteRole, setInviteRole] = useState('viewer');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteDebug, setInviteDebug] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);

  async function loadTeam() {
    setLoadError(null)
    setLoadDebug(null)
    setLoading(true)

    try {
      const response = await fetch('/api/admin-team', { cache: 'no-store' })
      const payload = (await response.json().catch(() => null)) as
        | ({ detail?: string; debug?: Record<string, unknown> } & Partial<AdminTeamResponse>)
        | null

      if (!response.ok) {
        setUsers([])
        setLoadError(
          toUserFriendlyErrorMessage(
            payload?.detail || 'We could not load the team members right now.',
          ),
        )
        if (payload?.debug) {
          setLoadDebug(JSON.stringify(payload.debug, null, 2))
        }
        return
      }

      setUsers(payload?.items || [])
    } catch {
      setUsers([])
      setLoadError('We could not load the team members right now. Please try again shortly.')
      setLoadDebug(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadTeam()
  }, [])

  const availableRoles = Array.from(
    new Set(users.map((user) => user.role).filter(Boolean) as string[]),
  )

  const filteredUsers = useMemo(
    () =>
      users.filter((user) => {
        const needle = searchQuery.toLowerCase()
        const matchesSearch =
          (user.full_name || '').toLowerCase().includes(needle) ||
          (user.email || '').toLowerCase().includes(needle)
        const matchesRole = !selectedRole || user.role === selectedRole
        return matchesSearch && matchesRole
      }),
    [users, searchQuery, selectedRole],
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

  async function handleInviteSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setInviteError(null)
    setInviteDebug(null)
    setInviteSuccess(null)
    setInviteLoading(true)

    try {
      const response = await fetch('/api/admin-team', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: inviteEmail,
          fullName: inviteFullName,
          role: inviteRole.toLowerCase(),
        }),
      })

      const payload = (await response.json().catch(() => null)) as
        | { detail?: string; debug?: Record<string, unknown> }
        | null

      if (!response.ok) {
        setInviteError(
          toUserFriendlyErrorMessage(
            payload?.detail || 'We could not send the invitation right now.',
          ),
        )
        if (payload?.debug) {
          setInviteDebug(JSON.stringify(payload.debug, null, 2))
        }
        return
      }

      setInviteSuccess(payload?.detail || `Invitation sent to ${inviteEmail}.`)
      setInviteEmail('')
      setInviteFullName('')
      setInviteRole('viewer')
      await loadTeam()
    } catch {
      setInviteError(
        toUserFriendlyErrorMessage('We could not send the invitation right now.'),
      )
      setInviteDebug(null)
    } finally {
      setInviteLoading(false)
    }
  }

  return (
    <div className="space-y-6 p-4 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold text-foreground">Users</h1>
          <p className="text-muted-foreground mt-1">Manage team members and permissions</p>
        </div>
        <Button className="w-full sm:w-auto" onClick={() => setInviteOpen(true)}>
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
            <span className="text-sm text-muted-foreground">Role:</span>
            <select
              value={selectedRole || ''}
              onChange={(e) => setSelectedRole(e.target.value || null)}
              className="bg-card border border-border rounded-lg px-3 py-1.5 text-sm text-foreground outline-none hover:border-primary/50 transition-colors"
            >
              <option value="">All Roles</option>
              {availableRoles.map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        {loading
          ? 'Loading team members...'
          : `Showing ${filteredUsers.length} user${filteredUsers.length !== 1 ? 's' : ''}`}
      </div>

      {loadError && (
        <div className="space-y-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          <p>{loadError}</p>
          {loadDebug && (
            <pre className="overflow-x-auto rounded-xl bg-black/20 p-3 text-xs text-amber-50">
              {loadDebug}
            </pre>
          )}
        </div>
      )}

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
                      {user.role}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <Badge
                      className={`border-0 capitalize ${
                        user.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : user.status === 'invited'
                            ? 'bg-amber-500/10 text-amber-500'
                            : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {user.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {user.updated_at ? getTimeAgo(user.updated_at) : '—'}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {user.joined_at ? formatDate(user.joined_at) : user.created_at ? formatDate(user.created_at) : '—'}
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

      {!loading && !loadError && filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No users found matching your criteria.</p>
        </div>
      )}

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>
              Send a dashboard invitation to a new Archomak employee.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleInviteSubmit}>
            <div className="space-y-2">
              <Label htmlFor="invite-full-name">Full Name</Label>
              <Input
                id="invite-full-name"
                value={inviteFullName}
                onChange={(event) => setInviteFullName(event.target.value)}
                placeholder="Jane Doe"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="invite-email">Email Address</Label>
              <Input
                id="invite-email"
                type="email"
                value={inviteEmail}
                onChange={(event) => setInviteEmail(event.target.value)}
                placeholder="jane@archomak.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="invite-role">Role</Label>
              <select
                id="invite-role"
                value={inviteRole}
                onChange={(event) => setInviteRole(event.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none"
              >
                <option value="owner">Owner</option>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="developer">Developer</option>
                <option value="analyst">Analyst</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>

            {(inviteError || inviteSuccess) && (
              <div
                className={`space-y-3 rounded-lg px-3 py-2 text-sm ${
                  inviteError
                    ? 'bg-red-500/10 text-red-500'
                    : 'bg-emerald-500/10 text-emerald-500'
                }`}
              >
                <p>{inviteError || inviteSuccess}</p>
                {inviteError && inviteDebug && (
                  <pre className="overflow-x-auto rounded-xl bg-black/20 p-3 text-xs text-red-100">
                    {inviteDebug}
                  </pre>
                )}
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setInviteOpen(false)
                  setInviteError(null)
                  setInviteDebug(null)
                  setInviteSuccess(null)
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={inviteLoading}>
                {inviteLoading ? (
                  <>
                    <LoaderCircle className="mr-2 size-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Invitation'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
