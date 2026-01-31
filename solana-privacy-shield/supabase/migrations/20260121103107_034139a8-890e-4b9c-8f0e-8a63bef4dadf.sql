-- Create rate limiting table
CREATE TABLE public.api_rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    request_count INTEGER NOT NULL DEFAULT 1,
    window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for fast lookups
CREATE INDEX idx_rate_limits_lookup ON public.api_rate_limits (ip_address, endpoint, window_start);

-- Enable RLS (but allow edge functions to bypass via service role)
ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;

-- No public access - only service role can access this table
CREATE POLICY "Service role only" 
ON public.api_rate_limits 
FOR ALL 
USING (false);

-- Function to check and update rate limit (returns true if allowed)
CREATE OR REPLACE FUNCTION public.check_rate_limit(
    p_ip_address TEXT,
    p_endpoint TEXT,
    p_max_requests INTEGER DEFAULT 10,
    p_window_minutes INTEGER DEFAULT 60
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_window_start TIMESTAMP WITH TIME ZONE;
    v_current_count INTEGER;
BEGIN
    -- Calculate window start time
    v_window_start := now() - (p_window_minutes || ' minutes')::INTERVAL;
    
    -- Get current request count in window
    SELECT COALESCE(SUM(request_count), 0) INTO v_current_count
    FROM api_rate_limits
    WHERE ip_address = p_ip_address
      AND endpoint = p_endpoint
      AND window_start > v_window_start;
    
    -- Check if limit exceeded
    IF v_current_count >= p_max_requests THEN
        RETURN FALSE;
    END IF;
    
    -- Insert new request record
    INSERT INTO api_rate_limits (ip_address, endpoint, window_start)
    VALUES (p_ip_address, p_endpoint, now());
    
    RETURN TRUE;
END;
$$;

-- Cleanup function to remove old records (run periodically)
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    DELETE FROM api_rate_limits
    WHERE window_start < now() - INTERVAL '2 hours';
END;
$$;