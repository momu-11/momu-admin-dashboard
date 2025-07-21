// Simple debug function to add to Dashboard component
// Add this function inside your Dashboard component

const debugNotifications = async () => {
  console.log('🔍 DEBUGGING NOTIFICATIONS');
  
  if (!selectedUser) {
    console.error('❌ No user selected');
    return;
  }
  
  console.log('👤 Selected user:', selectedUser);
  console.log('📊 Current state:');
  console.log('- previousNotifications:', previousNotifications);
  console.log('- notificationsLoading:', notificationsLoading);
  console.log('- activeTab:', activeTab);
  
  // Test the fetch function
  console.log('🔄 Testing fetchPreviousNotifications...');
  setNotificationsLoading(true);
  
  try {
    const { data, error } = await getUserNotifications(selectedUser.id);
    
    if (error) {
      console.error('❌ Error fetching notifications:', error);
    } else {
      console.log('✅ Notifications fetched successfully');
      console.log('📋 Data:', data);
      console.log('📊 Count:', data?.length || 0);
      
      // Update state
      setPreviousNotifications(data || []);
    }
  } catch (err) {
    console.error('❌ Exception in fetch:', err);
  } finally {
    setNotificationsLoading(false);
  }
};

// Add this button to your notification tab for testing
// <Button onClick={debugNotifications} variant="outlined" size="small">
//   Debug Notifications
// </Button> 