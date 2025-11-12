-- Create AddedEmail table for tracking user creation events
CREATE TABLE IF NOT EXISTS public.AddedEmail (
    id SERIAL PRIMARY KEY,
    email VARCHAR NOT NULL,
    first_name VARCHAR,
    last_name VARCHAR,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for better email searching
CREATE INDEX IF NOT EXISTS idx_added_email_email ON public.AddedEmail(email);
CREATE INDEX IF NOT EXISTS idx_added_email_created_at ON public.AddedEmail(created_at);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_added_email_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_added_email_updated_at
    BEFORE UPDATE ON public.AddedEmail
    FOR EACH ROW
    EXECUTE FUNCTION update_added_email_updated_at();

-- Add foreign key constraint (optional - depends on use case)
-- ALTER TABLE public.AddedEmail ADD CONSTRAINT fk_added_email_created_by
-- FOREIGN KEY (created_by) REFERENCES public.profiles(id);

-- Enable RLS if needed
-- ALTER TABLE public.AddedEmail ENABLE ROW LEVEL SECURITY;

-- Add comments for documentation
COMMENT ON TABLE public.AddedEmail IS 'Tracks user creation events and contacts imported to the system';
COMMENT ON COLUMN public.AddedEmail.email IS 'Email address that was added';
COMMENT ON COLUMN public.AddedEmail.first_name IS 'Contact first name (optional)';
COMMENT ON COLUMN public.AddedEmail.last_name IS 'Contact last name (optional)';
COMMENT ON COLUMN public.AddedEmail.created_by IS 'User ID who added this email';
COMMENT ON COLUMN public.AddedEmail.created_at IS 'When the email was added';
COMMENT ON COLUMN public.AddedEmail.updated_at IS 'When the record was last updated';