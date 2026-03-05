import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUpdateHailingCost } from '@/hooks/useAllocations';

interface EditHailingCostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  allocationId: string;
  currentFareAmount: number | null;
  currentReceiptReference: string | null;
}

export function EditHailingCostDialog({
  open,
  onOpenChange,
  allocationId,
  currentFareAmount,
  currentReceiptReference,
}: EditHailingCostDialogProps) {
  const [fareAmount, setFareAmount] = useState('');
  const [receiptReference, setReceiptReference] = useState('');
  const updateCost = useUpdateHailingCost();

  useEffect(() => {
    if (open) {
      setFareAmount(currentFareAmount != null ? String(currentFareAmount) : '');
      setReceiptReference(currentReceiptReference || '');
    }
  }, [open, currentFareAmount, currentReceiptReference]);

  const handleSave = () => {
    updateCost.mutate(
      {
        id: allocationId,
        fare_amount: fareAmount ? parseFloat(fareAmount) : null,
        receipt_reference: receiptReference || null,
      },
      { onSuccess: () => onOpenChange(false) }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Edit Hailing Cost</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="fare-amount">Fare Amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                LKR
              </span>
              <Input
                id="fare-amount"
                type="number"
                min="0"
                step="0.01"
                className="pl-12"
                value={fareAmount}
                onChange={(e) => setFareAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="receipt-ref">Receipt Reference</Label>
            <Input
              id="receipt-ref"
              value={receiptReference}
              onChange={(e) => setReceiptReference(e.target.value)}
              placeholder="e.g. INV-12345"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={updateCost.isPending}>
            {updateCost.isPending ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
