import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MapPin, 
  Calendar, 
  Clock, 
  Users, 
  User, 
  FileText,
  AlertCircle,
  Mail,
  Phone,
  BadgeCheck,
  Circle,
  Route
} from 'lucide-react';
import { RequestStatusBadge } from './RequestStatusBadge';
import { RequestPriorityBadge } from './RequestPriorityBadge';
import { useRequest, TravelRequest, RequestHistory } from '@/hooks/useRequests';

interface RequestDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requestId: string | null;
}

function TimelineItem({ item }: { item: RequestHistory }) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className="w-2 h-2 bg-primary rounded-full mt-2" />
        <div className="flex-1 w-px bg-border" />
      </div>
      <div className="pb-4">
        <p className="text-sm font-medium">{item.action}</p>
        {item.from_status && item.to_status && (
          <div className="flex gap-2 items-center mt-1">
            <RequestStatusBadge status={item.from_status} />
            <span className="text-muted-foreground">→</span>
            <RequestStatusBadge status={item.to_status} />
          </div>
        )}
        {item.notes && (
          <p className="text-sm text-muted-foreground mt-1">{item.notes}</p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          {item.performer?.full_name || 'System'} • {format(new Date(item.created_at), 'PPp')}
        </p>
      </div>
    </div>
  );
}

export function RequestDetailDialog({ 
  open, 
  onOpenChange, 
  requestId 
}: RequestDetailDialogProps) {
  const { data, isLoading } = useRequest(requestId || undefined);

  if (!requestId) return null;

  const request = data?.request;
  const passengers = data?.passengers || [];
  const history = data?.history || [];
  const stops = data?.stops || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <DialogTitle>{request?.request_number || 'Loading...'}</DialogTitle>
            {request && (
              <>
                <RequestStatusBadge status={request.status} />
                <RequestPriorityBadge priority={request.priority} />
              </>
            )}
          </div>
          <DialogDescription>
            {request?.purpose || 'Loading request details...'}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">Loading...</p>
            </div>
          ) : request ? (
            <div className="space-y-6 pr-4">
              {/* Trip Details */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Trip Details
                </h4>
                
                <div className="grid gap-3">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Pickup</p>
                      <p className="text-sm text-muted-foreground">{request.pickup_location}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Date & Time</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(request.pickup_datetime), 'EEEE, MMMM d, yyyy')} at{' '}
                        {format(new Date(request.pickup_datetime), 'h:mm a')}
                      </p>
                    </div>
                  </div>

                  {/* Intermediate Stops */}
                  {stops.length > 0 && (
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <Circle className="h-4 w-4 text-muted-foreground mt-0.5" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Intermediate Stops</p>
                        <div className="mt-1 space-y-1">
                          {stops.map((stop, index) => (
                            <div key={stop.id} className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground w-12">Stop {index + 1}</span>
                              <span className="text-sm text-muted-foreground">{stop.location}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">{stops.length > 0 ? 'Final Destination' : 'Destination'}</p>
                      <p className="text-sm text-muted-foreground">{request.dropoff_location}</p>
                    </div>
                  </div>

                  {request.estimated_distance_km != null && (
                    <div className="flex items-start gap-3">
                      <Route className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Estimated Distance</p>
                        <p className="text-sm text-muted-foreground">{request.estimated_distance_km} km</p>
                      </div>
                    </div>
                  )}

                  {request.trip_type === 'round_trip' && request.return_datetime && (
                    <div className="flex items-start gap-3">
                      <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Return</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(request.return_datetime), 'EEEE, MMMM d, yyyy')} at{' '}
                          {format(new Date(request.return_datetime), 'h:mm a')}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-3">
                    <Users className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Passengers</p>
                      <p className="text-sm text-muted-foreground">
                        {request.passenger_count} passenger(s)
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Requester & Approver */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  People
                </h4>
                
                <div className="grid gap-3">
                  <div className="flex items-start gap-3">
                    <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Requested By</p>
                      {request.is_guest_request ? (
                        <>
                          <p className="text-sm text-muted-foreground">
                            {request.guest_name || 'Guest'} ({request.guest_email || 'No email'})
                          </p>
                          {request.guest_employee_id && (
                            <p className="text-xs text-muted-foreground">Employee ID: {request.guest_employee_id}</p>
                          )}
                        </>
                      ) : (
                        <>
                          <p className="text-sm text-muted-foreground">
                            {request.requester?.full_name} ({request.requester?.email})
                          </p>
                          {request.requester?.department && (
                            <p className="text-xs text-muted-foreground">{request.requester.department}</p>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {request.approver && (
                    <div className="flex items-start gap-3">
                      <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Approver</p>
                        <p className="text-sm text-muted-foreground">
                          {request.approver.full_name} ({request.approver.email})
                        </p>
                        {request.approved_at && (
                          <p className="text-xs text-muted-foreground">
                            Approved on {format(new Date(request.approved_at), 'PPp')}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Guest Information - shown for public form submissions */}
              {request.is_guest_request && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      Guest Information
                    </h4>
                    
                    <div className="grid gap-3">
                      <div className="flex items-start gap-3">
                        <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Name</p>
                          <p className="text-sm text-muted-foreground">{request.guest_name}</p>
                        </div>
                      </div>

                      {request.guest_employee_id && (
                        <div className="flex items-start gap-3">
                          <BadgeCheck className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-sm font-medium">Employee ID</p>
                            <p className="text-sm text-muted-foreground">{request.guest_employee_id}</p>
                          </div>
                        </div>
                      )}

                      {request.guest_email && (
                        <div className="flex items-start gap-3">
                          <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-sm font-medium">Email</p>
                            <p className="text-sm text-muted-foreground">{request.guest_email}</p>
                          </div>
                        </div>
                      )}

                      {request.guest_phone && (
                        <div className="flex items-start gap-3">
                          <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-sm font-medium">Phone</p>
                            <p className="text-sm text-muted-foreground">{request.guest_phone}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Passengers List */}
              {passengers.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      Passenger Details
                    </h4>
                    <div className="space-y-2">
                      {passengers.map((passenger) => (
                        <div key={passenger.id} className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{passenger.name}</span>
                          {passenger.phone && (
                            <span className="text-sm text-muted-foreground">({passenger.phone})</span>
                          )}
                          {passenger.is_primary && (
                            <Badge variant="outline" className="text-xs">Primary</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Additional Info */}
              {(request.special_requirements || request.cost_center || request.notes) && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      Additional Information
                    </h4>
                    
                    <div className="grid gap-3">
                      {request.cost_center && (
                        <div className="flex items-start gap-3">
                          <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-sm font-medium">Cost Center</p>
                            <p className="text-sm text-muted-foreground">{request.cost_center}</p>
                          </div>
                        </div>
                      )}

                      {request.special_requirements && (
                        <div className="flex items-start gap-3">
                          <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-sm font-medium">Special Requirements</p>
                            <p className="text-sm text-muted-foreground">{request.special_requirements}</p>
                          </div>
                        </div>
                      )}

                      {request.notes && (
                        <div className="flex items-start gap-3">
                          <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-sm font-medium">Notes</p>
                            <p className="text-sm text-muted-foreground">{request.notes}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Rejection Reason */}
              {request.status === 'rejected' && request.rejection_reason && (
                <>
                  <Separator />
                  <div className="bg-destructive/10 p-4 rounded-lg">
                    <h4 className="text-sm font-semibold text-destructive mb-1">
                      Rejection Reason
                    </h4>
                    <p className="text-sm">{request.rejection_reason}</p>
                  </div>
                </>
              )}

              {/* History Timeline */}
              {history.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      History
                    </h4>
                    <div className="space-y-0">
                      {history.map((item) => (
                        <TimelineItem key={item.id} item={item} />
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">Request not found</p>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
