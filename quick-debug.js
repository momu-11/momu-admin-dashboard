// Quick debug script - run this in the browser console while on the notification tab
// This will help identify why previous notifications aren't showing

const quickDebug = async () => {
  console.log('🔍 Quick Debug - Previous Notifications Issue');
  
  // Check if we have a selected user
  if (!selectedUser) {
    console.error('❌ No user selected');
    return;
  }
  
  console.log('👤 Selected user ID:', selectedUser.id);
  console.log('📊 Current state:');
  console.log('- activeTab:', activeTab);
  console.log('- notificationsLoading:', notificationsLoading);
  console.log('- previousNotifications:', previousNotifications);
  
  // Test direct database query first
  console.log('\n🔍 Testing direct database query...');
  try {
    const { data, error } = await supabase
      .from('community_notifications')
      .select('*')
      .eq('user_id', selectedUser.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Direct query error:', error);
    } else {
      console.log('✅ Direct query successful');
      console.log('📊 Found notifications:', data?.length || 0);
      if (data && data.length > 0) {
        console.log('📋 Sample notification:', data[0]);
      }
    }
  } catch (error) {
    console.error('❌ Direct query failed:', error);
  }
  
  // Test the getUserNotifications function
  console.log('\n🧪 Testing getUserNotifications function...');
  try {
    const { data, error } = await getUserNotifications(selectedUser.id);
    
    if (error) {
      console.error('❌ getUserNotifications error:', error);
    } else {
      console.log('✅ getUserNotifications successful');
      console.log('📊 Returned notifications:', data?.length || 0);
      if (data && data.length > 0) {
        console.log('📋 Sample notification:', data[0]);
      }
    }
  } catch (error) {
    console.error('❌ getUserNotifications failed:', error);
  }
  
  // Force refresh the notifications
  console.log('\n🔄 Forcing refresh of notifications...');
  if (typeof fetchPreviousNotifications === 'function') {
    await fetchPreviousNotifications();
    
    // Wait a moment and check state again
    setTimeout(() => {
      console.log('\n📊 State after forced refresh:');
      console.log('- previousNotifications:', previousNotifications);
      console.log('- notificationsLoading:', notificationsLoading);
    }, 1000);
  } else {
    console.error('❌ fetchPreviousNotifications function not found');
  }
  
  console.log('\n💡 If direct query shows data but getUserNotifications doesn\'t, there\'s a function issue');
  console.log('💡 If both show data but UI is empty, there\'s a state/rendering issue');
  console.log('💡 If direct query shows no data, the notifications might be stored with different user_id');
};

// Export for browser console
if (typeof window !== 'undefined') {
  window.quickDebug = quickDebug;
} 