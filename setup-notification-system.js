// Setup script for notification system
// Run this in the browser console after logging in as an admin

const setupNotificationSystem = async () => {
  console.log('🔧 Setting up Notification System...');
  
  // Check if user is logged in
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    console.error('❌ Please log in first');
    return;
  }
  
  console.log('✅ User logged in:', user.email);
  
  // Check if user profile exists
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  
  if (profileError) {
    console.error('❌ Error fetching user profile:', profileError);
    return;
  }
  
  if (!profile) {
    console.error('❌ User profile not found');
    return;
  }
  
  console.log('✅ User profile found');
  console.log('👤 User type:', profile.user_type);
  
  // Check if user is admin
  if (profile.user_type !== 'admin') {
    console.log('⚠️  User is not an admin. Making user an admin...');
    
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ user_type: 'admin' })
      .eq('id', user.id);
    
    if (updateError) {
      console.error('❌ Failed to make user admin:', updateError);
      return;
    }
    
    console.log('✅ User is now an admin');
  } else {
    console.log('✅ User is already an admin');
  }
  
  // Test table access
  console.log('\n🔍 Testing table access...');
  const { data: tableTest, error: tableError } = await supabase
    .from('community_notifications')
    .select('count')
    .limit(1);
  
  if (tableError) {
    if (tableError.message.includes('relation "community_notifications" does not exist')) {
      console.error('❌ community_notifications table does not exist');
      console.log('💡 Please run the migration first:');
      console.log('   supabase/migrations/20241201000000_create_community_notifications.sql');
      return;
    } else {
      console.error('❌ Table access error:', tableError);
      return;
    }
  }
  
  console.log('✅ Table access successful');
  
  // Test function access
  console.log('\n🔍 Testing function access...');
  const { error: funcError } = await supabase.rpc('create_community_notification', {
    user_id_param: user.id,
    actor_id_param: user.id,
    type_param: 'setup_test',
    title_param: 'Setup Test',
    message_param: 'This is a test notification from setup',
    post_id_param: null,
    comment_id_param: null
  });
  
  if (funcError) {
    if (funcError.message.includes('function "create_community_notification" does not exist')) {
      console.error('❌ create_community_notification function does not exist');
      console.log('💡 Please run the migration first');
      return;
    } else {
      console.error('❌ Function test error:', funcError);
      return;
    }
  }
  
  console.log('✅ Function access successful');
  
  // Create a test notification
  console.log('\n📝 Creating test notification...');
  const { data: testNotification, error: testError } = await supabase.rpc('create_community_notification', {
    user_id_param: user.id,
    actor_id_param: user.id,
    type_param: 'setup_test',
    title_param: 'Setup Complete',
    message_param: 'Notification system setup completed successfully!',
    post_id_param: null,
    comment_id_param: null
  });
  
  if (testError) {
    console.error('❌ Failed to create test notification:', testError);
    return;
  }
  
  console.log('✅ Test notification created:', testNotification);
  
  // Verify notification was created
  console.log('\n🔍 Verifying notification...');
  const { data: notifications, error: verifyError } = await supabase
    .from('community_notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1);
  
  if (verifyError) {
    console.error('❌ Error verifying notification:', verifyError);
    return;
  }
  
  if (notifications && notifications.length > 0) {
    console.log('✅ Notification verified:', {
      id: notifications[0].id,
      title: notifications[0].title,
      message: notifications[0].message,
      type: notifications[0].type,
      created_at: notifications[0].created_at
    });
  } else {
    console.error('❌ Notification not found after creation');
    return;
  }
  
  console.log('\n🎉 Notification system setup completed successfully!');
  console.log('\n📋 Summary:');
  console.log('- ✅ User authentication: Working');
  console.log('- ✅ Admin privileges: Granted');
  console.log('- ✅ Database table: Accessible');
  console.log('- ✅ Stored procedure: Working');
  console.log('- ✅ Notification creation: Successful');
  console.log('- ✅ Notification retrieval: Working');
  
  console.log('\n🚀 You can now use the notification system in the admin dashboard!');
  console.log('   Go to Users → Select a user → Send Notification tab');
};

// Export for use in browser console
if (typeof window !== 'undefined') {
  window.setupNotificationSystem = setupNotificationSystem;
}

// Run the setup if this is a Node.js environment
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { setupNotificationSystem };
} 