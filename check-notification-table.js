// Comprehensive check for existing community_notifications table
// Run this in the browser console after logging in

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

  // Test 6: Test the actual sendNotification function from your code
  console.log('\n6. 🚀 Testing your sendNotification function...');
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('❌ No user logged in');
      return;
    }

    // Import the function (this will work if the script is run in the same context)
    if (typeof sendNotification === 'function') {
      console.log('✅ sendNotification function found');
      
      const { data, error } = await sendNotification(
        user.id, 
        'Test from sendNotification function', 
        'This is a test using your actual sendNotification function'
      );
      
      if (error) {
        console.error('❌ sendNotification function failed:', error);
      } else {
        console.log('✅ sendNotification function worked:', data);
        
        // Clean up
        if (data && data.id) {
          const { error: deleteError } = await supabase
            .from('community_notifications')
            .delete()
            .eq('id', data.id);
          
          if (!deleteError) {
            console.log('✅ Test notification cleaned up');
          }
        }
      }
    } else {
      console.log('⚠️  sendNotification function not available in current context');
      console.log('💡 Run this script in the browser console while the app is loaded');
    }
  } catch (error) {
    console.error('❌ sendNotification function test failed:', error);
  }

  console.log('\n🎉 Table check completed!');
  console.log('\n📝 Summary:');
  console.log('- Check the results above for any ❌ errors');
  console.log('- If you see ⚠️ warnings, they indicate potential issues');
  console.log('- If all tests pass with ✅, your notification system should work');
  console.log('\n💡 Next steps:');
  console.log('1. If the table exists but function is missing, you may need to create the stored procedure');
  console.log('2. If RLS policies are blocking access, ensure you have proper permissions');
  console.log('3. If you\'re not an admin, update your user_type to "admin" in the database');
};

// Export for use in browser console
if (typeof window !== 'undefined') {
  window.checkNotificationTable = checkNotificationTable;
}

// Run the check if this is a Node.js environment
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { checkNotificationTable };
} 