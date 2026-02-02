import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StatusBadge, ExpiryBadge } from '@/components/shared/StatusBadge';
import { VehicleDialog } from '@/components/vehicles/VehicleDialog';
import { useVehicles, useDeleteVehicle, Vehicle } from '@/hooks/useVehicles';
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Truck, Loader2 } from 'lucide-react';
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

export default function Vehicles() {
  const { data: vehicles, isLoading } = useVehicles();
  const deleteVehicle = useDeleteVehicle();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null);

  const filteredVehicles = vehicles?.filter((vehicle) => {
    const matchesSearch =
      vehicle.registration_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.make?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.model?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || vehicle.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleEdit = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setDialogOpen(true);
  };

  const handleDelete = (vehicle: Vehicle) => {
    setVehicleToDelete(vehicle);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (vehicleToDelete) {
      await deleteVehicle.mutateAsync(vehicleToDelete.id);
      setDeleteDialogOpen(false);
      setVehicleToDelete(null);
    }
  };

  const handleAddNew = () => {
    setSelectedVehicle(null);
    setDialogOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Vehicles</h1>
            <p className="text-muted-foreground">Manage fleet vehicles and maintenance schedules</p>
          </div>
          <Button onClick={handleAddNew}>
            <Plus className="mr-2 h-4 w-4" />
            Add Vehicle
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search vehicles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="in_trip">In Trip</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="breakdown">Breakdown</SelectItem>
                  <SelectItem value="retired">Retired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredVehicles?.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Truck className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No vehicles found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery || statusFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Get started by adding your first vehicle'}
                </p>
                {!searchQuery && statusFilter === 'all' && (
                  <Button onClick={handleAddNew}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Vehicle
                  </Button>
                )}
              </div>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Registration</TableHead>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Documents</TableHead>
                      <TableHead className="w-[60px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVehicles?.map((vehicle) => (
                      <TableRow key={vehicle.id} className={!vehicle.is_active ? 'opacity-60' : ''}>
                        <TableCell className="font-medium">
                          <code className="px-2 py-1 bg-muted rounded text-sm">
                            {vehicle.registration_number}
                          </code>
                        </TableCell>
                        <TableCell>
                          {vehicle.make && vehicle.model
                            ? `${vehicle.make} ${vehicle.model}`
                            : vehicle.make || vehicle.model || '-'}
                          {vehicle.year && (
                            <span className="text-muted-foreground ml-1">({vehicle.year})</span>
                          )}
                        </TableCell>
                        <TableCell className="capitalize">
                          {vehicle.vehicle_type?.replace('_', ' ') || '-'}
                        </TableCell>
                        <TableCell>
                          {vehicle.location?.name || '-'}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={vehicle.status || 'available'} />
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            <ExpiryBadge date={vehicle.insurance_expiry} />
                            <ExpiryBadge date={vehicle.registration_expiry} />
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(vehicle)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDelete(vehicle)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Deactivate
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Vehicle Dialog */}
      <VehicleDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        vehicle={selectedVehicle}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Vehicle</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate "{vehicleToDelete?.registration_number}"?
              This vehicle will no longer be available for trips.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
