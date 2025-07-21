-- Create community_notifications table
CREATE TABLE IF NOT EXISTS public.community_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    type TEXT NOT NULL DEFAULT 'message',
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES public.community_comments(id) ON DELETE CASCADE,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_community_notifications_user_id ON public.community_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_community_notifications_created_at ON public.community_notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_community_notifications_read ON public.community_notifications(read);

-- Enable Row Level Security
ALTER TABLE public.community_notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Policy for users to read their own notifications
CREATE POLICY "Users can read their own notifications" ON public.community_notifications
    FOR SELECT USING (auth.uid() = user_id);

-- Policy for admins to read all notifications
CREATE POLICY "Admins can read all notifications" ON public.community_notifications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND user_type = 'admin'
        )
    );

-- Policy for admins to insert notifications
CREATE POLICY "Admins can insert notifications" ON public.community_notifications
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND user_type = 'admin'
        )
    );

-- Policy for users to update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications" ON public.community_notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy for admins to update any notification
CREATE POLICY "Admins can update any notification" ON public.community_notifications
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND user_type = 'admin'
        )
    );

-- Create or replace the stored procedure for creating notifications
CREATE OR REPLACE FUNCTION public.create_community_notification(
    user_id_param UUID,
    actor_id_param UUID,
    type_param TEXT,
    title_param TEXT,
    message_param TEXT,
    post_id_param UUID DEFAULT NULL,
    comment_id_param UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    notification_id UUID;
    result JSON;
BEGIN
    -- Check if the actor is an admin
    IF NOT EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE id = actor_id_param AND user_type = 'admin'
    ) THEN
        RAISE EXCEPTION 'Only admins can create notifications';
    END IF;

    -- Insert the notification
    INSERT INTO public.community_notifications (
        user_id,
        actor_id,
        type,
        title,
        message,
        post_id,
        comment_id
    ) VALUES (
        user_id_param,
        actor_id_param,
        type_param,
        title_param,
        message_param,
        post_id_param,
        comment_id_param
    ) RETURNING id INTO notification_id;

    -- Return the created notification
    SELECT json_build_object(
        'id', id,
        'user_id', user_id,
        'actor_id', actor_id,
        'type', type,
        'title', title,
        'message', message,
        'post_id', post_id,
        'comment_id', comment_id,
        'read', read,
        'created_at', created_at,
        'updated_at', updated_at
    ) INTO result
    FROM public.community_notifications
    WHERE id = notification_id;

    RETURN result;
END;
$$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.community_notifications TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_community_notification TO authenticated; 