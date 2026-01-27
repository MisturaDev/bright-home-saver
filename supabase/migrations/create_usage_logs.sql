-- Create the usage_logs table
CREATE TABLE IF NOT EXISTS usage_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    device_id UUID REFERENCES devices(id), -- Nullable for aggregate logs, but we'll try to stick to device-level
    energy_kwh NUMERIC NOT NULL DEFAULT 0,
    cost NUMERIC NOT NULL DEFAULT 0,
    timestamp TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can insert their own usage logs" 
ON usage_logs FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own usage logs" 
ON usage_logs FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- Create index for faster querying by time
CREATE INDEX idx_usage_logs_user_timestamp ON usage_logs(user_id, timestamp);

-- (Optional) Helper function to get daily aggregate
-- usage: select * from get_daily_usage('2023-10-01', '2023-10-07')
