import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Plus, Search, MoreHorizontal, Pencil, Shield, UserX, UserCheck, Users, KeyRound, Copy, Eye, EyeOff } from 'lucide-react';
import { useUsers, useToggleUserActive, useResetUserPassword, UserWithDetails, AppRole } from '@/hooks/useUsers';
import { CreateUserDialog } from '@/components/users/CreateUserDialog';
import { EditUserDialog } from '@/components/users/EditUserDialog';
import { RoleManagementDialog } from '@/components/users/RoleManagementDialog';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';

const ROLE_COLORS: Record<AppRole, string> = {
  staff: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  driver: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  approver: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  location_coordinator: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  group_admin: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
};

const ROLE_LABELS: Record<AppRole, string> = {
  staff: 'Staff',
  driver: 'Driver',
  approver: 'Approver',
  location_coordinator: 'Coordinator',
  group_admin: 'Admin',
};

export default function UsersPage() {
  const { data: users, isLoading } = useUsers();
  const toggleActive = useToggleUserActive();
  const resetPassword = useResetUserPassword();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserWithDetails | null>(null);
  const [roleUser, setRoleUser] = useState<UserWithDetails | null>(null);

  // Reset password state
  const [resetConfirmUser, setResetConfirmUser] = useState<UserWithDetails | null>(null);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [resetPasswordUserName, setResetPasswordUserName] = useState('');

  const filteredUsers = users?.filter(user => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery || 
      user.full_name.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      user.employee_id?.toLowerCase().includes(searchLower);
    const matchesRole = roleFilter === 'all' || user.roles.includes(roleFilter as AppRole);
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'active' && user.is_active) ||
      (statusFilter === 'inactive' && !user.is_active);
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleResetPassword = async () => {
    if (!resetConfirmUser) return;
    const userName = resetConfirmUser.full_name;
    setResetConfirmUser(null);
    
    const result = await resetPassword.mutateAsync(resetConfirmUser.user_id);
    if (result?.temporary_password) {
      setGeneratedPassword(result.temporary_password);
      setResetPasswordUserName(userName);
      setShowPassword(false);
    }
  };

  const copyPassword = () => {
    if (generatedPassword) {
      navigator.clipboard.writeText(generatedPassword);
      toast({ title: 'Copied', description: 'Temporary password copied to clipboard.' });
    }
  };

  const renderActionMenu = (user: UserWithDetails) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setEditUser(user)}>
          <Pencil className="mr-2 h-4 w-4" />Edit Profile
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setRoleUser(user)}>
          <Shield className="mr-2 h-4 w-4" />Manage Roles
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setResetConfirmUser(user)}>
          <KeyRound className="mr-2 h-4 w-4" />Reset Password
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => toggleActive.mutate({ userId: user.user_id, isActive: !user.is_active })}>
          {user.is_active ? (
            <><UserX className="mr-2 h-4 w-4" />Deactivate</>
          ) : (
            <><UserCheck className="mr-2 h-4 w-4" />Activate</>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const renderMobileCards = () => (
    <div className="space-y-3">
      {filteredUsers?.map((user) => (
        <Card key={user.id}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <p className="font-semibold text-sm">{user.full_name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
              <StatusBadge status={user.is_active ? 'active' : 'inactive'} />
            </div>
            <div className="flex flex-wrap gap-1 mb-2">
              {user.roles.map(role => (
                <Badge key={role} variant="secondary" className={ROLE_COLORS[role]}>
                  {ROLE_LABELS[role]}
                </Badge>
              ))}
              {user.roles.length === 0 && (
                <span className="text-muted-foreground text-xs">No roles</span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {user.primary_location?.name || '—'} · {user.department || '—'}
              </span>
              {renderActionMenu(user)}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">User Management</h1>
            <p className="text-muted-foreground">Create accounts and manage user roles</p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or employee ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="staff">Staff</SelectItem>
              <SelectItem value="driver">Driver</SelectItem>
              <SelectItem value="approver">Approver</SelectItem>
              <SelectItem value="location_coordinator">Coordinator</SelectItem>
              <SelectItem value="group_admin">Admin</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table / Cards */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Users className="h-8 w-8 text-muted-foreground animate-pulse" />
          </div>
        ) : filteredUsers?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No users found</p>
          </div>
        ) : isMobile ? (
          renderMobileCards()
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers?.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.full_name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {user.roles.map(role => (
                          <Badge key={role} variant="secondary" className={ROLE_COLORS[role]}>
                            {ROLE_LABELS[role]}
                          </Badge>
                        ))}
                        {user.roles.length === 0 && (
                          <span className="text-muted-foreground text-sm">No roles</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.primary_location?.name || <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell>
                      {user.department || <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={user.is_active ? 'active' : 'inactive'} />
                    </TableCell>
                    <TableCell>{renderActionMenu(user)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <CreateUserDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
      <EditUserDialog user={editUser} open={!!editUser} onOpenChange={(open) => !open && setEditUser(null)} />
      <RoleManagementDialog user={roleUser} open={!!roleUser} onOpenChange={(open) => !open && setRoleUser(null)} />

      {/* Reset Password Confirmation */}
      <AlertDialog open={!!resetConfirmUser} onOpenChange={(open) => !open && setResetConfirmUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Password</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reset the password for <strong>{resetConfirmUser?.full_name}</strong>? A new temporary password will be generated.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetPassword} disabled={resetPassword.isPending}>
              {resetPassword.isPending ? 'Resetting...' : 'Reset Password'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Generated Password Display */}
      <Dialog open={!!generatedPassword} onOpenChange={(open) => { if (!open) { setGeneratedPassword(null); setShowPassword(false); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Password Reset Successful</DialogTitle>
            <DialogDescription>
              A new temporary password has been generated for <strong>{resetPasswordUserName}</strong>. Copy it now — it will not be shown again.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex-1 rounded-md border bg-muted px-3 py-2 font-mono text-sm">
                {showPassword ? generatedPassword : '••••••••••••••••'}
              </div>
              <Button variant="outline" size="icon" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button variant="outline" size="icon" onClick={copyPassword}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              ⚠️ This password will not be shown again. Please share it securely with the user.
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => { setGeneratedPassword(null); setShowPassword(false); }}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
