// Test script for notification system
// Run this in the browser console or as a Node.js script

const testNotificationSystem = async () => {
  console.log('🧪 Testing Notification System...');
  
  // Test 1: Check if Supabase connection is working
  console.log('\n1. Testing Supabase connection...');
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      console.error('❌ Supabase connection failed:', error);
      return;
    }
    console.log('✅ Supabase connection successful');
    console.log('👤 Current user:', user ? user.email : 'No user logged in');
  } catch (error) {
    console.error('❌ Supabase connection test failed:', error);
    return;
  }

  // Test 2: Check if community_notifications table exists
  console.log('\n2. Testing community_notifications table access...');
  try {
    const { data, error } = await supabase
      .from('community_notifications')
      .select('count')
      .limit(1);
    
    if (error) {
      if (error.message.includes('relation "community_notifications" does not exist')) {
        console.error('❌ community_notifications table does not exist');
        console.log('💡 Run the migration: supabase/migrations/20241201000000_create_community_notifications.sql');
        return;
      } else {
        console.error('❌ Table access error:', error);
        return;
      }
    }
    console.log('✅ community_notifications table exists and is accessible');
  } catch (error) {
    console.error('❌ Table access test failed:', error);
    return;
  }

  // Test 3: Check if create_community_notification function exists
  console.log('\n3. Testing create_community_notification function...');
  try {
    const { data, error } = await supabase.rpc('create_community_notification', {
      user_id_param: '00000000-0000-0000-0000-000000000000', // Test UUID
      actor_id_param: '00000000-0000-0000-0000-000000000000', // Test UUID
      type_param: 'test',
      title_param: 'Test',
      message_param: 'Test message',
      post_id_param: null,
      comment_id_param: null
    });
    
    if (error) {
      if (error.message.includes('function "create_community_notification" does not exist')) {
        console.error('❌ create_community_notification function does not exist');
        console.log('💡 Run the migration to create the function');
        return;
      } else if (error.message.includes('Only admins can create notifications')) {
        console.log('✅ Function exists and admin check is working');
      } else {
        console.error('❌ Function test error:', error);
        return;
      }
    } else {
      console.log('✅ create_community_notification function works');
    }
  } catch (error) {
    console.error('❌ Function test failed:', error);
    return;
  }

  // Test 4: Check admin status
  console.log('\n4. Testing admin status...');
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

    if (profile?.user_type === 'admin') {
      console.log('✅ User is an admin');
    } else {
      console.log('⚠️  User is not an admin (user_type:', profile?.user_type, ')');
      console.log('💡 Admin users can send notifications, regular users cannot');
    }
  } catch (error) {
    console.error('❌ Admin status check failed:', error);
    return;
  }

  // Test 5: Test notification retrieval
  console.log('\n5. Testing notification retrieval...');
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('❌ No user logged in for notification test');
      return;
    }

    const { data: notifications, error } = await supabase
      .from('community_notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('❌ Error retrieving notifications:', error);
      return;
    }

    console.log('✅ Notification retrieval successful');
    console.log('📊 Found', notifications?.length || 0, 'notifications for current user');
    
    if (notifications && notifications.length > 0) {
      console.log('📋 Latest notification:', {
        id: notifications[0].id,
        title: notifications[0].title,
        message: notifications[0].message,
        type: notifications[0].type,
        read: notifications[0].read,
        created_at: notifications[0].created_at
      });
    }
  } catch (error) {
    console.error('❌ Notification retrieval test failed:', error);
    return;
  }

  console.log('\n🎉 Notification system test completed!');
  console.log('\n📝 Summary:');
  console.log('- Check the results above for any ❌ errors');
  console.log('- If all tests pass with ✅, the notification system should work');
  console.log('- If you see ⚠️ warnings, they indicate potential issues but may not prevent functionality');
};

// Export for use in browser console
if (typeof window !== 'undefined') {
  window.testNotificationSystem = testNotificationSystem;
}

// Run the test if this is a Node.js environment
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testNotificationSystem };
} 