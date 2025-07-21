# Notification System Guide

## Overview

The notification system allows admin users to send custom notifications to users through the admin dashboard. This system uses Supabase for data storage and includes proper security measures.

## Architecture

### Database Schema

The `community_notifications` table has the following structure:

```sql
CREATE TABLE public.community_notifications (
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
```

### Security Features

1. **Row Level Security (RLS)**: Enabled on the table
2. **Admin-only creation**: Only users with `user_type = 'admin'` can create notifications
3. **User isolation**: Users can only read their own notifications
4. **Admin access**: Admins can read and manage all notifications

### Stored Procedure

The system uses a stored procedure `create_community_notification` for secure notification creation:

```sql
CREATE OR REPLACE FUNCTION public.create_community_notification(
    user_id_param UUID,
    actor_id_param UUID,
    type_param TEXT,
    title_param TEXT,
    message_param TEXT,
    post_id_param UUID DEFAULT NULL,
    comment_id_param UUID DEFAULT NULL
)
```

## How to Use

### 1. Access the Notification Feature

1. Log in to the admin dashboard
2. Navigate to the Users section
3. Click on a user to view their details
4. Go to the "Send Notification" tab (tab 2)

### 2. Send a Notification

1. Fill in the notification title
2. Fill in the notification message
3. Click "Send Notification"
4. The system will validate and send the notification

### 3. View Previous Notifications

The system automatically displays previous notifications sent to the user in the same tab.

## Troubleshooting

### Common Issues and Solutions

#### 1. "Database table does not exist" Error

**Problem**: The `community_notifications` table hasn't been created.

**Solution**: Run the database migration:
```bash
# If using Supabase CLI
supabase db push

# Or manually run the SQL file
psql -d your_database -f supabase/migrations/20241201000000_create_community_notifications.sql
```

#### 2. "Only admins can create notifications" Error

**Problem**: The current user is not an admin.

**Solution**: 
1. Check the user's `user_type` in the `user_profiles` table
2. Update the user to have `user_type = 'admin'`:
```sql
UPDATE user_profiles 
SET user_type = 'admin' 
WHERE id = 'user-uuid-here';
```

#### 3. "Row-level security" Error

**Problem**: RLS policies are blocking access.

**Solution**: Ensure the user is properly authenticated and has admin privileges.

#### 4. "No authenticated user found" Error

**Problem**: The user session has expired or is invalid.

**Solution**: Log out and log back in to refresh the authentication.

### Testing the System

Use the provided test script to verify the notification system:

```javascript
// In the browser console
testNotificationSystem();
```

This will run comprehensive tests and provide detailed feedback.

## Code Structure

### Key Files

1. **`src/lib/mockData.ts`**: Contains the notification functions
   - `sendNotification()`: Sends notifications using stored procedure with fallback
   - `getUserNotifications()`: Retrieves user notifications
   - `markNotificationAsRead()`: Marks notifications as read

2. **`src/pages/Dashboard.tsx`**: Contains the UI components
   - `handleSendNotification()`: Handles the send notification action
   - `fetchPreviousNotifications()`: Fetches and displays previous notifications

3. **`supabase/migrations/20241201000000_create_community_notifications.sql`**: Database schema and setup

### Error Handling

The system includes comprehensive error handling:

- **Specific error messages** for different failure scenarios
- **Fallback mechanisms** when stored procedures fail
- **User-friendly alerts** explaining what went wrong
- **Console logging** for debugging

## Security Considerations

1. **Authentication Required**: All operations require valid authentication
2. **Admin Authorization**: Only admin users can send notifications
3. **Data Isolation**: Users can only access their own notifications
4. **Input Validation**: All inputs are validated before processing
5. **SQL Injection Protection**: Uses parameterized queries

## Performance Optimizations

1. **Database Indexes**: Created on frequently queried columns
2. **Efficient Queries**: Uses proper WHERE clauses and ordering
3. **Connection Pooling**: Leverages Supabase's connection pooling
4. **Caching**: Notifications are cached in component state

## Monitoring and Logging

The system includes comprehensive logging:

- **Console logs** for debugging
- **Error tracking** with specific error types
- **Success confirmations** for user feedback
- **Performance metrics** for optimization

## Future Enhancements

Potential improvements for the notification system:

1. **Real-time notifications** using Supabase Realtime
2. **Notification templates** for common messages
3. **Bulk notifications** to multiple users
4. **Scheduled notifications** for future delivery
5. **Notification preferences** for users
6. **Email integration** for external notifications

## Support

If you encounter issues not covered in this guide:

1. Check the browser console for error messages
2. Run the test script to identify specific problems
3. Verify database connectivity and permissions
4. Ensure all migrations have been applied
5. Check user authentication and admin status 