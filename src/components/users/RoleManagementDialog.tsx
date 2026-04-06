import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useAddUserRole, useRemoveUserRole, UserWithDetails, AppRole } from '@/hooks/useUsers';
import { useAuth } from '@/contexts/AuthContext';

const ALL_ROLES: { value: AppRole; label: string; description: string; adminOnly?: boolean }[] = [
  { value: 'staff', label: 'Staff', description: 'Can request rides and view own trips' },
  { value: 'driver', label: 'Driver', description: 'Can be assigned to drive trips' },
  { value: 'approver', label: 'Approver', description: 'Can approve or reject trip requests' },
  { value: 'location_coordinator', label: 'Location Coordinator', description: 'Manages vehicles and drivers at a location', adminOnly: true },
  { value: 'group_admin', label: 'Group Admin', description: 'Full system access', adminOnly: true },
];

interface RoleManagementDialogProps {
  user: UserWithDetails | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RoleManagementDialog({ user, open, onOpenChange }: RoleManagementDialogProps) {
  const addRole = useAddUserRole();
  const removeRole = useRemoveUserRole();
  const { roles: currentUserRoles } = useAuth();
  const isCurrentUserGroupAdmin = currentUserRoles.includes('group_admin');

  if (!user) return null;

  const handleRoleToggle = async (role: AppRole, isChecked: boolean) => {
    if (isChecked) {
      await addRole.mutateAsync({ userId: user.user_id, role });
    } else {
      await removeRole.mutateAsync({ userId: user.user_id, role });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Roles</DialogTitle>
        </DialogHeader>
        
        <div className="rounded-md bg-muted p-3 mb-4">
          <p className="font-medium">{user.full_name}</p>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>

        <div className="space-y-3">
          {ALL_ROLES.map((role) => {
            const isChecked = user.roles.includes(role.value);
            const isPending = addRole.isPending || removeRole.isPending;
            // Admin-equivalent roles can only be viewed, not toggled by group_admins
            const isRestricted = role.adminOnly && isCurrentUserGroupAdmin;
            
            return (
              <div
                key={role.value}
                className="flex items-start space-x-3 rounded-lg border p-3"
              >
                <Checkbox
                  checked={isChecked}
                  disabled={isPending || isRestricted}
                  onCheckedChange={(checked) => handleRoleToggle(role.value, !!checked)}
                />
                <div className="space-y-0.5">
                  <span className="text-sm font-medium">{role.label}</span>
                  <p className="text-xs text-muted-foreground">
                    {role.description}
                    {isRestricted && ' (restricted)'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
