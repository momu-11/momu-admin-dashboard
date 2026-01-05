-- =====================================================
-- Create app_settings table for iOS Update System
-- =====================================================

-- Drop existing table and policies if they exist (clean slate)
DROP POLICY IF EXISTS "Allow all users to read app_settings" ON public.app_settings;
DROP POLICY IF EXISTS "Allow only admin users to update app_settings" ON public.app_settings;
DROP POLICY IF EXISTS "Allow only admin users to insert app_settings" ON public.app_settings;
DROP POLICY IF EXISTS "Allow only admin users to delete app_settings" ON public.app_settings;
DROP INDEX IF EXISTS idx_app_settings_key;
DROP TABLE IF EXISTS public.app_settings;

-- Create app_settings table
CREATE TABLE public.app_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    setting_key TEXT NOT NULL UNIQUE,
    setting_value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX idx_app_settings_key ON public.app_settings(setting_key);

-- Enable Row Level Security
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- ✅ ALL users (including unauthenticated) can read settings - needed for iOS app update checks
CREATE POLICY "Allow all users to read app_settings" ON public.app_settings
    FOR SELECT USING (true);

-- ✅ Only admins can insert settings
CREATE POLICY "Allow only admin users to insert app_settings" ON public.app_settings
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND user_type = 'admin'
        )
    );

-- ✅ Only admins can update settings
CREATE POLICY "Allow only admin users to update app_settings" ON public.app_settings
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND user_type = 'admin'
        )
    );

-- ✅ Only admins can delete settings
CREATE POLICY "Allow only admin users to delete app_settings" ON public.app_settings
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND user_type = 'admin'
        )
    );

-- Insert default iOS update settings
INSERT INTO public.app_settings (setting_key, setting_value) 
VALUES (
    'force_update_enabled',
    '{
        "enabled": false,
        "message": "A new version of Momu is available. Please update to continue using the app.",
        "current_version": "1.0.6",
        "latest_version": "1.0.6"
    }'::jsonb
) ON CONFLICT (setting_key) DO NOTHING;

