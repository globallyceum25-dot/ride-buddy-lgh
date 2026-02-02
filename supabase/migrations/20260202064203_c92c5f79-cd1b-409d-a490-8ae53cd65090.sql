-- Allow approvers to view profiles of requesters whose requests they are assigned to approve
CREATE POLICY "Approvers can view requester profiles"
ON profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM travel_requests
    WHERE travel_requests.approver_id = auth.uid()
    AND travel_requests.requester_id = profiles.user_id
  )
);