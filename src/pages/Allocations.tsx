import { useState, useMemo } from 'react';
import { format, isPast } from 'date-fns';
import { 
  Clock, Car, Users, Calendar, CheckCircle, FileText, MoreHorizontal,
  Merge, Play, X, Gauge, AlertTriangle
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { RequestPriorityBadge } from '@/components/requests/RequestPriorityBadge';
import { AllocationStatusBadge } from '@/components/allocations/AllocationStatusBadge';
import { AllocationDialog } from '@/components/allocations/AllocationDialog';
import { CloseRequestDialog } from '@/components/allocations/CloseRequestDialog';
import { RescheduleRequestDialog } from '@/components/allocations/RescheduleRequestDialog';
import { MergeRequestsDialog } from '@/components/allocations/MergeRequestsDialog';
import { TripTrackingDialog } from '@/components/allocations/TripTrackingDialog';
import { RouteDisplay } from '@/components/allocations/RouteDisplay';
import { KanbanBoard } from '@/components/allocations/KanbanBoard';
import { KanbanFilters, ViewMode } from '@/components/allocations/KanbanFilters';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  usePendingAllocation, useAllocations, useTripPools,
  useUpdateAllocationStatus, useCancelAllocation,
  checkPoolCompatibility, Allocation, HAILING_SERVICE_LABELS
} from '@/hooks/useAllocations';

export default function Allocations() {
  const [viewMode, setViewMode] = useState<ViewMode>('board');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);
  const [assignDialogRequest, setAssignDialogRequest] = useState<any>(null);
  const [showMergeDialog, setShowMergeDialog] = useState(false);
  const [trackingAllocation, setTrackingAllocation] = useState<Allocation | null>(null);
  const [trackingMode, setTrackingMode] = useState<'start' | 'complete'>('start');
  const [closeDialogRequest, setCloseDialogRequest] = useState<any>(null);
  const [rescheduleDialogRequest, setRescheduleDialogRequest] = useState<any>(null);

  const isMobile = useIsMobile();
  const { data: pendingRequests = [], isLoading: loadingPending } = usePendingAllocation();
  const { data: allocations = [], isLoading: loadingAllocations } = useAllocations();
  const { data: tripPools = [], isLoading: loadingPools } = useTripPools();
  const updateStatus = useUpdateAllocationStatus();
  const cancelAllocation = useCancelAllocation();

  const selectedRequestObjects = pendingRequests.filter(r => selectedRequests.includes(r.id));
  const mergeCompatibility = useMemo(() => 
    checkPoolCompatibility(selectedRequestObjects),
    [selectedRequestObjects]
  );
  const canMerge = selectedRequests.length >= 2 && mergeCompatibility.compatible;

  const toggleRequestSelection = (id: string) => {
    setSelectedRequests(prev => 
      prev.includes(id) ? prev.filter(rid => rid !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedRequests.length === pendingRequests.length) {
      setSelectedRequests([]);
    } else {
      setSelectedRequests(pendingRequests.map(r => r.id));
    }
  };

  const activeAllocations = allocations.filter(a => 
    ['scheduled', 'dispatched', 'in_progress'].includes(a.status)
  );
  const activePools = tripPools.filter(p => 
    ['pending', 'confirmed', 'dispatched'].includes(p.status)
  );

  const stats = {
    pending: pendingRequests.length,
    active: activeAllocations.length,
    pooled: activePools.length,
    today: activeAllocations.filter(a => 
      format(new Date(a.scheduled_pickup), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
    ).length,
  };

  const renderPendingMobileCards = () => (
    <div className="space-y-3">
      {pendingRequests.map((request) => {
        const isOverdue = isPast(new Date(request.pickup_datetime));
        return (
          <Card key={request.id} className={isOverdue ? 'opacity-75' : ''}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  {!isOverdue && (
                    <Checkbox
                      checked={selectedRequests.includes(request.id)}
                      onCheckedChange={() => toggleRequestSelection(request.id)}
                    />
                  )}
                  <span className="font-semibold text-sm">{request.request_number}</span>
                </div>
                <RequestPriorityBadge priority={request.priority} />
              </div>
              <div className="text-sm mb-1">
                {request.is_guest_request ? (
                  <span className="font-medium">{request.guest_name || 'Guest'}</span>
                ) : (
                  <span className="font-medium">{request.requester?.full_name}</span>
                )}
              </div>
              <RouteDisplay 
                pickup={request.pickup_location} 
                destination={request.dropoff_location}
                stops={(request as any).stops}
              />
              <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                {format(new Date(request.pickup_datetime), 'MMM d, yyyy · h:mm a')}
                {isOverdue && (
                  <Badge variant="destructive" className="text-[10px] px-1.5 py-0 gap-1">
                    <AlertTriangle className="h-3 w-3" />Overdue
                  </Badge>
                )}
                <span className="ml-auto">{request.passenger_count} pax</span>
              </div>
              <div className="flex items-center gap-2 mt-3">
                {isOverdue ? (
                  <>
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => setRescheduleDialogRequest(request)}>
                      Reschedule
                    </Button>
                    <Button size="sm" variant="destructive" className="flex-1" onClick={() => setCloseDialogRequest(request)}>
                      Close
                    </Button>
                  </>
                ) : (
                  <Button size="sm" className="ml-auto" onClick={() => setAssignDialogRequest(request)}>
                    Assign
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  const renderAllocationMobileCards = () => (
    <div className="space-y-3">
      {activeAllocations.map((allocation) => (
        <Card key={allocation.id}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <span className="font-semibold text-sm">{allocation.request?.request_number}</span>
              <AllocationStatusBadge status={allocation.status} />
            </div>
            <p className="text-sm">
              {allocation.hailing_service ? (
                <Badge variant="secondary">{HAILING_SERVICE_LABELS[allocation.hailing_service]}</Badge>
              ) : (
                <>
                  {allocation.vehicle?.registration_number}
                  <span className="text-muted-foreground text-xs ml-1">
                    {allocation.vehicle?.make} {allocation.vehicle?.model}
                  </span>
                </>
              )}
            </p>
            {!allocation.hailing_service && (
              <p className="text-sm text-muted-foreground">
                Driver: {(allocation as any).driverProfile?.full_name || '—'}
              </p>
            )}
            <RouteDisplay 
              pickup={allocation.request?.pickup_location || ''} 
              destination={allocation.request?.dropoff_location || ''}
              stops={(allocation as any).stops}
            />
            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-muted-foreground">
                {format(new Date(allocation.scheduled_pickup), 'MMM d, h:mm a')}
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm"><MoreHorizontal className="h-4 w-4" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {allocation.status === 'scheduled' && (
                    <DropdownMenuItem onClick={() => updateStatus.mutate({ id: allocation.id, status: 'dispatched' })}>
                      <Play className="h-4 w-4 mr-2" />Dispatch
                    </DropdownMenuItem>
                  )}
                  {allocation.status === 'dispatched' && (
                    <DropdownMenuItem onClick={() => { setTrackingAllocation(allocation); setTrackingMode('start'); }}>
                      <Car className="h-4 w-4 mr-2" />Start Trip
                    </DropdownMenuItem>
                  )}
                  {allocation.status === 'in_progress' && (
                    <DropdownMenuItem onClick={() => { setTrackingAllocation(allocation); setTrackingMode('complete'); }}>
                      <Gauge className="h-4 w-4 mr-2" />Complete Trip
                    </DropdownMenuItem>
                  )}
                  {['scheduled', 'dispatched'].includes(allocation.status) && (
                    <DropdownMenuItem onClick={() => cancelAllocation.mutate(allocation.id)} className="text-destructive">
                      <X className="h-4 w-4 mr-2" />Cancel
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderPoolMobileCards = () => (
    <div className="space-y-3">
      {activePools.map((pool) => (
        <Card key={pool.id}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <span className="font-semibold text-sm">{pool.pool_number}</span>
              <AllocationStatusBadge status={pool.status} />
            </div>
            <p className="text-sm">
              {pool.vehicle?.registration_number || '—'}
              {pool.vehicle && <span className="text-muted-foreground text-xs ml-1">{pool.vehicle.make} {pool.vehicle.model}</span>}
            </p>
            <p className="text-sm text-muted-foreground">Driver: {(pool as any).driverProfile?.full_name || '—'}</p>
            <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
              <span>{format(new Date(pool.scheduled_date), 'MMM d, yyyy')} · {pool.scheduled_time}</span>
              <span>{pool.total_passengers} pax · {pool.allocations?.length || 0} req</span>
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
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Allocations</h1>
          <p className="text-muted-foreground">
            Assign vehicles and drivers to approved travel requests
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending}</div>
              <p className="text-xs text-muted-foreground">Awaiting allocation</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <Car className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active}</div>
              <p className="text-xs text-muted-foreground">Trips in progress</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pooled</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pooled}</div>
              <p className="text-xs text-muted-foreground">Active trip pools</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.today}</div>
              <p className="text-xs text-muted-foreground">Trips scheduled today</p>
            </CardContent>
          </Card>
        </div>

        {/* Pending Requests */}
        {pendingRequests.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Pending Allocation
                    <Badge variant="secondary">{pendingRequests.length}</Badge>
                  </CardTitle>
                  <CardDescription>
                    Approved requests awaiting vehicle and driver assignment
                  </CardDescription>
                </div>
                {selectedRequests.length >= 2 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <Button 
                          onClick={() => setShowMergeDialog(true)}
                          disabled={!canMerge}
                          variant="outline"
                          className="gap-2"
                        >
                          <Merge className="h-4 w-4" />
                          Merge ({selectedRequests.length})
                        </Button>
                      </span>
                    </TooltipTrigger>
                    {!canMerge && mergeCompatibility.reason && (
                      <TooltipContent><p>{mergeCompatibility.reason}</p></TooltipContent>
                    )}
                  </Tooltip>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {loadingPending ? (
                <div className="flex items-center justify-center py-8">
                  <p className="text-muted-foreground">Loading...</p>
                </div>
              ) : isMobile ? (
                renderPendingMobileCards()
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox 
                            checked={selectedRequests.length === pendingRequests.length}
                            onCheckedChange={selectAll}
                          />
                        </TableHead>
                        <TableHead>Request #</TableHead>
                        <TableHead>Requester</TableHead>
                        <TableHead>Route</TableHead>
                        <TableHead>Date/Time</TableHead>
                        <TableHead>Passengers</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingRequests.map((request) => {
                        const isOverdue = isPast(new Date(request.pickup_datetime));
                        return (
                        <TableRow key={request.id} className={isOverdue ? 'opacity-75' : ''}>
                          <TableCell>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span>
                                  <Checkbox
                                    checked={selectedRequests.includes(request.id)}
                                    onCheckedChange={() => toggleRequestSelection(request.id)}
                                    disabled={isOverdue}
                                  />
                                </span>
                              </TooltipTrigger>
                              {isOverdue && (
                                <TooltipContent><p>Cannot merge: pickup date has passed</p></TooltipContent>
                              )}
                            </Tooltip>
                          </TableCell>
                          <TableCell className="font-medium">{request.request_number}</TableCell>
                          <TableCell>
                            <div>
                              {request.is_guest_request ? (
                                <>
                                  <p className="font-medium">{request.guest_name || 'Guest'}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {request.guest_employee_id || request.guest_email || 'No details'}
                                  </p>
                                </>
                              ) : (
                                <>
                                  <p className="font-medium">{request.requester?.full_name}</p>
                                  <p className="text-sm text-muted-foreground">{request.requester?.department}</p>
                                </>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <RouteDisplay 
                              pickup={request.pickup_location} 
                              destination={request.dropoff_location}
                              stops={(request as any).stops}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <div>
                                {format(new Date(request.pickup_datetime), 'MMM d, yyyy')}
                                <br />
                                <span className="text-muted-foreground text-xs">
                                  {format(new Date(request.pickup_datetime), 'h:mm a')}
                                </span>
                              </div>
                              {isOverdue && (
                                <Badge variant="destructive" className="text-[10px] px-1.5 py-0 gap-1">
                                  <AlertTriangle className="h-3 w-3" />Overdue
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{request.passenger_count}</TableCell>
                          <TableCell><RequestPriorityBadge priority={request.priority} /></TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              {isOverdue && (
                                <>
                                  <Button size="sm" variant="outline" onClick={() => setRescheduleDialogRequest(request)}>
                                    <Calendar className="h-3.5 w-3.5 mr-1" />Reschedule
                                  </Button>
                                  <Button size="sm" variant="destructive" onClick={() => setCloseDialogRequest(request)}>
                                    <X className="h-3.5 w-3.5 mr-1" />Close
                                  </Button>
                                </>
                              )}
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span>
                                    <Button size="sm" onClick={() => setAssignDialogRequest(request)} disabled={isOverdue}>
                                      Assign
                                    </Button>
                                  </span>
                                </TooltipTrigger>
                                {isOverdue && (
                                  <TooltipContent><p>Pickup date has passed. Update the request date before allocating.</p></TooltipContent>
                                )}
                              </Tooltip>
                            </div>
                          </TableCell>
                        </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Main Board Section */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Allocations Board</CardTitle>
            <CardDescription>
              {isMobile ? 'Tap columns to expand and manage trips' : 'Drag and drop trips between stages to update their status'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <KanbanFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedDate={dateFilter}
              onDateChange={setDateFilter}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />

            {viewMode === 'board' && (
              <KanbanBoard searchQuery={searchQuery} dateFilter={dateFilter} />
            )}

            {viewMode === 'table' && (
              <>
                {loadingAllocations ? (
                  <div className="flex items-center justify-center py-8">
                    <p className="text-muted-foreground">Loading...</p>
                  </div>
                ) : activeAllocations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No active allocations</h3>
                    <p className="text-muted-foreground">Assign vehicles to pending requests to see them here</p>
                  </div>
                ) : isMobile ? (
                  renderAllocationMobileCards()
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Request #</TableHead>
                          <TableHead>Vehicle</TableHead>
                          <TableHead>Driver</TableHead>
                          <TableHead>Route</TableHead>
                          <TableHead>Scheduled</TableHead>
                          <TableHead>Odometer</TableHead>
                          <TableHead>Distance</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {activeAllocations.map((allocation) => (
                          <TableRow key={allocation.id}>
                            <TableCell className="font-medium">{allocation.request?.request_number}</TableCell>
                            <TableCell>
                              {allocation.hailing_service ? (
                                <Badge variant="secondary">{HAILING_SERVICE_LABELS[allocation.hailing_service]}</Badge>
                              ) : (
                                <>
                                  {allocation.vehicle?.registration_number}
                                  <br />
                                  <span className="text-muted-foreground text-xs">
                                    {allocation.vehicle?.make} {allocation.vehicle?.model}
                                  </span>
                                </>
                              )}
                            </TableCell>
                            <TableCell>
                              {allocation.hailing_service ? '—' : ((allocation as any).driverProfile?.full_name || '—')}
                            </TableCell>
                            <TableCell>
                              <RouteDisplay 
                                pickup={allocation.request?.pickup_location || ''} 
                                destination={allocation.request?.dropoff_location || ''}
                                stops={(allocation as any).stops}
                              />
                            </TableCell>
                            <TableCell>{format(new Date(allocation.scheduled_pickup), 'MMM d, h:mm a')}</TableCell>
                            <TableCell>
                              {allocation.odometer_start ? (
                                <span className="text-sm">{allocation.odometer_start.toLocaleString()} km</span>
                              ) : <span className="text-muted-foreground">—</span>}
                            </TableCell>
                            <TableCell>
                              {allocation.odometer_start && allocation.odometer_end ? (
                                <span className="text-sm font-medium">
                                  {(allocation.odometer_end - allocation.odometer_start).toLocaleString()} km
                                </span>
                              ) : allocation.status === 'in_progress' ? (
                                <span className="text-muted-foreground text-xs">In progress</span>
                              ) : <span className="text-muted-foreground">—</span>}
                            </TableCell>
                            <TableCell><AllocationStatusBadge status={allocation.status} /></TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm"><MoreHorizontal className="h-4 w-4" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {allocation.status === 'scheduled' && (
                                    <DropdownMenuItem onClick={() => updateStatus.mutate({ id: allocation.id, status: 'dispatched' })}>
                                      <Play className="h-4 w-4 mr-2" />Dispatch
                                    </DropdownMenuItem>
                                  )}
                                  {allocation.status === 'dispatched' && (
                                    <DropdownMenuItem onClick={() => { setTrackingAllocation(allocation); setTrackingMode('start'); }}>
                                      <Car className="h-4 w-4 mr-2" />Start Trip
                                    </DropdownMenuItem>
                                  )}
                                  {allocation.status === 'in_progress' && (
                                    <DropdownMenuItem onClick={() => { setTrackingAllocation(allocation); setTrackingMode('complete'); }}>
                                      <Gauge className="h-4 w-4 mr-2" />Complete Trip
                                    </DropdownMenuItem>
                                  )}
                                  {['scheduled', 'dispatched'].includes(allocation.status) && (
                                    <DropdownMenuItem onClick={() => cancelAllocation.mutate(allocation.id)} className="text-destructive">
                                      <X className="h-4 w-4 mr-2" />Cancel
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </>
            )}

            {viewMode === 'pools' && (
              <>
                {loadingPools ? (
                  <div className="flex items-center justify-center py-8">
                    <p className="text-muted-foreground">Loading...</p>
                  </div>
                ) : activePools.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Users className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No pooled trips</h3>
                    <p className="text-muted-foreground">Select multiple compatible requests to create a pool</p>
                  </div>
                ) : isMobile ? (
                  renderPoolMobileCards()
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Pool #</TableHead>
                          <TableHead>Vehicle</TableHead>
                          <TableHead>Driver</TableHead>
                          <TableHead>Date/Time</TableHead>
                          <TableHead>Passengers</TableHead>
                          <TableHead>Requests</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {activePools.map((pool) => (
                          <TableRow key={pool.id}>
                            <TableCell className="font-medium">{pool.pool_number}</TableCell>
                            <TableCell>
                              {pool.vehicle?.registration_number || '—'}
                              {pool.vehicle && (
                                <><br /><span className="text-muted-foreground text-xs">{pool.vehicle.make} {pool.vehicle.model}</span></>
                              )}
                            </TableCell>
                            <TableCell>{(pool as any).driverProfile?.full_name || '—'}</TableCell>
                            <TableCell>
                              {format(new Date(pool.scheduled_date), 'MMM d, yyyy')}
                              <br /><span className="text-muted-foreground text-xs">{pool.scheduled_time}</span>
                            </TableCell>
                            <TableCell>{pool.total_passengers}</TableCell>
                            <TableCell>{pool.allocations?.length || 0} requests</TableCell>
                            <TableCell><AllocationStatusBadge status={pool.status} /></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <AllocationDialog
        open={!!assignDialogRequest}
        onOpenChange={(open) => !open && setAssignDialogRequest(null)}
        request={assignDialogRequest}
      />
      <MergeRequestsDialog
        open={showMergeDialog}
        onOpenChange={(open) => {
          setShowMergeDialog(open);
          if (!open) setSelectedRequests([]);
        }}
        requests={selectedRequestObjects}
      />
      <TripTrackingDialog
        open={!!trackingAllocation}
        onOpenChange={(open) => !open && setTrackingAllocation(null)}
        allocation={trackingAllocation}
        mode={trackingMode}
        isLoading={updateStatus.isPending}
        onSubmit={(data) => {
          if (!trackingAllocation) return;
          updateStatus.mutate({
            id: trackingAllocation.id,
            status: trackingMode === 'start' ? 'in_progress' : 'completed',
            vehicle_id: trackingAllocation.vehicle_id,
            ...data,
          }, { onSuccess: () => setTrackingAllocation(null) });
        }}
      />
      <CloseRequestDialog
        request={closeDialogRequest}
        open={!!closeDialogRequest}
        onOpenChange={(open) => !open && setCloseDialogRequest(null)}
      />
      <RescheduleRequestDialog
        request={rescheduleDialogRequest}
        open={!!rescheduleDialogRequest}
        onOpenChange={(open) => !open && setRescheduleDialogRequest(null)}
      />
    </DashboardLayout>
  );
}
