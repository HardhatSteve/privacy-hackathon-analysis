-- Drop the overly restrictive RLS policy that blocks all access including service role
DROP POLICY IF EXISTS "Service role only" ON public.api_rate_limits;

-- Create a proper permissive policy that blocks public access but allows service role operations
-- Note: Service role bypasses RLS by default when using the service_role key, so we just need to block public access
CREATE POLICY "Block public access to rate limits"
ON public.api_rate_limits
FOR ALL
TO public
USING (false)
WITH CHECK (false);