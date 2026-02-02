import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Plus, Search, MoreHorizontal, Pencil, Shield, UserX, UserCheck, Users } from 'lucide-react';
import { useUsers, useToggleUserActive, UserWithDetails, AppRole } from '@/hooks/useUsers';
import { CreateUserDialog } from '@/components/users/CreateUserDialog';
import { EditUserDialog } from '@/components/users/EditUserDialog';
import { RoleManagementDialog } from '@/components/users/RoleManagementDialog';

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
  
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserWithDetails | null>(null);
  const [roleUser, setRoleUser] = useState<UserWithDetails | null>(null);

  const filteredUsers = users?.filter(user => {
    // Search filter
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery || 
      user.full_name.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      user.employee_id?.toLowerCase().includes(searchLower);

    // Role filter
    const matchesRole = roleFilter === 'all' || user.roles.includes(roleFilter as AppRole);

    // Status filter
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'active' && user.is_active) ||
      (statusFilter === 'inactive' && !user.is_active);

    return matchesSearch && matchesRole && matchesStatus;
  });

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

        {/* Table */}
        <div className="rounded-md border">
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
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Loading users...
                  </TableCell>
                </TableRow>
              ) : filteredUsers?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <Users className="h-8 w-8 text-muted-foreground" />
                      <p className="text-muted-foreground">No users found</p>
                      {!searchQuery && !roleFilter && statusFilter === 'all' && (
                        <Button variant="outline" size="sm" onClick={() => setCreateDialogOpen(true)}>
                          <Plus className="mr-2 h-4 w-4" />
                          Add your first user
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers?.map((user) => (
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
                      {user.primary_location?.name || (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.department || <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={user.is_active ? 'active' : 'inactive'} />
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditUser(user)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setRoleUser(user)}>
                            <Shield className="mr-2 h-4 w-4" />
                            Manage Roles
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => toggleActive.mutate({ userId: user.user_id, isActive: !user.is_active })}
                          >
                            {user.is_active ? (
                              <>
                                <UserX className="mr-2 h-4 w-4" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <UserCheck className="mr-2 h-4 w-4" />
                                Activate
                              </>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Dialogs */}
      <CreateUserDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
      <EditUserDialog user={editUser} open={!!editUser} onOpenChange={(open) => !open && setEditUser(null)} />
      <RoleManagementDialog user={roleUser} open={!!roleUser} onOpenChange={(open) => !open && setRoleUser(null)} />
    </DashboardLayout>
  );
}
