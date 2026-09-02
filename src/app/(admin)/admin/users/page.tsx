'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { formatDate } from '@/shared/lib/date';
import { useStore } from '@/shared/store';

type User = {
  _id: string;
  name: string;
  email: string;
  role: 'customer' | 'gardener' | 'super_admin';
  status: 'pending' | 'active' | 'suspended';
  createdAt: string;
};

export default function UsersPage() {
  const { pushToast } = useStore();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/admin/users');
      const data = await res.json();
      if (data.success) setUsers(data.data);
      else pushToast({ title: 'Could not load users', body: typeof data.error === 'string' ? data.error : undefined, variant: 'error' });
    } catch (err) {
      console.error(err);
      pushToast({ title: 'Could not load users', body: 'A network error occurred.', variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Only ever toggles between active <-> suspended. A 'pending' gardener
  // (awaiting KYC review) is never touched by this switch — that status is
  // owned by GardenerProfile.verificationStatus via the dedicated Gardener
  // Verifications screen, not this account-level flag. Conflating the two
  // let this switch "activate" an account whose application was never
  // actually reviewed.
  const toggleStatus = async (id: string, current: 'active' | 'suspended') => {
    const nextStatus = current === 'active' ? 'suspended' : 'active';
    try {
      const res = await fetch('/api/v1/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: nextStatus }),
      });
      const data = await res.json();
      if (!data.success) {
        pushToast({ title: 'Could not update user', body: typeof data.error === 'string' ? data.error : undefined, variant: 'error' });
        return;
      }
      fetchData();
    } catch (err) {
      console.error(err);
      pushToast({ title: 'Could not update user', body: 'A network error occurred.', variant: 'error' });
    }
  };

  const getRoleBadgeVariant = (role: User['role']) => {
    if (role === 'super_admin') return 'default';
    if (role === 'gardener') return 'secondary';
    return 'outline';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground mt-1">View and manage user accounts.</p>
        </div>
      </div>

      <Card className="shadow-sm border-border/50">
        <CardHeader className="pb-3 border-b border-border/50 bg-muted/10">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            All Users
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center items-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No users found.
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((u) => (
                    <TableRow key={u._id} className="group">
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(u.role)} className="rounded-md">
                          {u.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {u.status === 'pending' ? (
                          <Link href="/admin/gardener-verifications" className="inline-block">
                            <Badge variant="outline" className="text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800 cursor-pointer hover:bg-amber-50 dark:hover:bg-amber-950/30">
                              Pending verification
                            </Badge>
                          </Link>
                        ) : (
                          <Switch
                            checked={u.status === 'active'}
                            onCheckedChange={() => toggleStatus(u._id, u.status as 'active' | 'suspended')}
                            className="data-[state=checked]:bg-green-500"
                          />
                        )}
                      </TableCell>
                      <TableCell>{formatDate(u.createdAt)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
