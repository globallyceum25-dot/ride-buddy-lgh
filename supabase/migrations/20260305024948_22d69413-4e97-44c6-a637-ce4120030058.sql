ALTER TABLE public.allocations
  ADD COLUMN fare_amount numeric NULL,
  ADD COLUMN receipt_reference text NULL;