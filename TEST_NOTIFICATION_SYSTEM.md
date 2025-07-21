# Testing Your Notification System

## Quick Start Guide

Since your `community_notifications` table already exists, let's test your notification system step by step.

### Step 1: Start the Application

Your application should now be running. Open your browser and navigate to:
```
http://localhost:3000
```

### Step 2: Log In

1. Log in to your admin dashboard
2. Make sure you're logged in as an admin user

### Step 3: Run the Table Check Script

Open your browser's Developer Console (F12) and run this script to check your existing table:

```javascript
// Copy and paste this into the browser console
const checkNotificationTable = async () => {
  console.log('🔍 Checking existing community_notifications table...');
  
  // Test 1: Check if table exists and get its structure
  console.log('\n1. 📋 Checking table structure...');
  try {
    const { data, error } = await supabase
      .from('community_notifications')
      .select('*')
      .limit(1);
    
    if (error) {
      if (error.message.includes('relation "community_notifications" does not exist')) {
        console.error('❌ community_notifications table does not exist');
        return;
      } else {
        console.error('❌ Table access error:', error);
        return;
      }
    }
    
    console.log('✅ Table exists and is accessible');
    
    // Try to get column information by attempting to select specific columns
    const { data: testData, error: testError } = await supabase
      .from('community_notifications')
      .select('id, user_id, title, message, type, read, created_at, updated_at')
      .limit(1);
    
    if (testError) {
      console.error('❌ Error testing column access:', testError);
    } else {
      console.log('✅ Basic columns are accessible');
    }
    
  } catch (error) {
    console.error('❌ Table structure check failed:', error);
    return;
  }

  // Test 2: Check if create_community_notification function exists
  console.log('\n2. 🔧 Checking stored procedure...');
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('❌ No user logged in');
      return;
    }

    const { data, error } = await supabase.rpc('create_community_notification', {
      user_id_param: user.id,
      actor_id_param: user.id,
      type_param: 'test',
      title_param: 'Test',
      message_param: 'Test message',
      post_id_param: null,
      comment_id_param: null
    });
    
    if (error) {
      if (error.message.includes('function "create_community_notification" does not exist')) {
        console.log('⚠️  create_community_notification function does not exist');
        console.log('💡 This means the table exists but the stored procedure is missing');
      } else if (error.message.includes('Only admins can create notifications')) {
        console.log('✅ Function exists and admin check is working');
      } else {
        console.log('⚠️  Function exists but returned error:', error.message);
      }
    } else {
      console.log('✅ Function works and created notification:', data);
    }
  } catch (error) {
    console.error('❌ Function check failed:', error);
  }

  // Test 3: Check current user's admin status
  console.log('\n3. 👤 Checking user admin status...');
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('❌ No user logged in');
      return;
    }

    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('user_type')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('❌ Error checking admin status:', error);
      return;
    }

    console.log('👤 User type:', profile?.user_type);
    if (profile?.user_type === 'admin') {
      console.log('✅ User is an admin');
    } else {
      console.log('⚠️  User is not an admin (user_type:', profile?.user_type, ')');
      console.log('💡 Only admin users can send notifications');
    }
  } catch (error) {
    console.error('❌ Admin status check failed:', error);
  }

  // Test 4: Test direct table insertion (fallback method)
  console.log('\n4. 📝 Testing direct table insertion...');
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('❌ No user logged in');
      return;
    }

    const { data, error } = await supabase
      .from('community_notifications')
      .insert({
        user_id: user.id,
        title: 'Test Notification',
        message: 'This is a test notification from the check script',
        type: 'test',
        read: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select();

    if (error) {
      console.error('❌ Direct insertion failed:', error);
      console.log('💡 This might be due to RLS policies or missing columns');
    } else {
      console.log('✅ Direct insertion successful:', data);
      
      // Clean up the test notification
      if (data && data[0]) {
        const { error: deleteError } = await supabase
          .from('community_notifications')
          .delete()
          .eq('id', data[0].id);
        
        if (deleteError) {
          console.log('⚠️  Could not clean up test notification:', deleteError);
        } else {
          console.log('✅ Test notification cleaned up');
        }
      }
    }
  } catch (error) {
    console.error('❌ Direct insertion test failed:', error);
  }

  // Test 5: Check existing notifications
  console.log('\n5. 📊 Checking existing notifications...');
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('❌ No user logged in');
      return;
    }

    const { data: notifications, error } = await supabase
      .from('community_notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('❌ Error retrieving notifications:', error);
      return;
    }

    console.log('📊 Found', notifications?.length || 0, 'notifications for current user');
    
    if (notifications && notifications.length > 0) {
      console.log('📋 Sample notification structure:', {
        id: notifications[0].id,
        user_id: notifications[0].user_id,
        title: notifications[0].title,
        message: notifications[0].message,
        type: notifications[0].type,
        read: notifications[0].read,
        created_at: notifications[0].created_at,
        updated_at: notifications[0].updated_at
      });
      
      // Check for additional columns
      const sampleNotification = notifications[0];
      const additionalColumns = Object.keys(sampleNotification).filter(key => 
        !['id', 'user_id', 'title', 'message', 'type', 'read', 'created_at', 'updated_at'].includes(key)
      );
      
      if (additionalColumns.length > 0) {
        console.log('📋 Additional columns found:', additionalColumns);
        additionalColumns.forEach(col => {
          console.log(`   - ${col}: ${sampleNotification[col]}`);
        });
      }
    }
  } catch (error) {
    console.error('❌ Notification retrieval test failed:', error);
  }

  console.log('\n🎉 Table check completed!');
  console.log('\n📝 Summary:');
  console.log('- Check the results above for any ❌ errors');
  console.log('- If you see ⚠️ warnings, they indicate potential issues');
  console.log('- If all tests pass with ✅, your notification system should work');
};

// Run the check
checkNotificationTable();
```

### Step 4: Test the UI

1. **Navigate to Users**: Go to the Users section in your admin dashboard
2. **Select a User**: Click on any user to view their details
3. **Go to Send Notification Tab**: Click on tab 2 (Send Notification)
4. **Send a Test Notification**:
   - Title: "Test Notification"
   - Message: "This is a test notification from the admin dashboard"
   - Click "Send Notification"

### Step 5: Check Results

After sending the notification, you should see:
- ✅ Success message: "Notification sent successfully!"
- 📋 The notification should appear in the "Previous Notifications" list
- 🔄 The form should clear and reset

## Troubleshooting Common Issues

### Issue 1: "Only admins can create notifications"
**Solution**: Make sure your user has `user_type = 'admin'` in the database.

### Issue 2: "Row-level security" error
**Solution**: Check if RLS policies are properly configured for your table.

### Issue 3: "Function does not exist"
**Solution**: Your table exists but the stored procedure is missing. The code will fall back to direct table access.

### Issue 4: "Table does not exist"
**Solution**: The table name might be different. Check your database schema.

## Expected Behavior

When everything works correctly:

1. **Table Check**: Should show ✅ for table access
2. **Function Check**: May show ⚠️ if function doesn't exist (this is OK)
3. **Admin Status**: Should show ✅ if you're an admin
4. **Direct Insertion**: Should show ✅ for successful insertion
5. **UI Test**: Should successfully send and display notifications

## What Your Code Does

Your current `sendNotification` function:

1. **Tries the stored procedure first** (`create_community_notification`)
2. **Falls back to direct table access** if the procedure doesn't exist
3. **Handles authentication** by getting the current user
4. **Provides detailed error messages** for troubleshooting
5. **Uses proper error handling** with try-catch blocks

This is a robust implementation that should work with your existing table structure!

## Next Steps

1. Run the table check script in the browser console
2. Test the UI functionality
3. If you encounter any issues, check the console for specific error messages
4. The error messages will help identify exactly what needs to be fixed

Your notification system should work properly with the existing `community_notifications` table! 🎉 