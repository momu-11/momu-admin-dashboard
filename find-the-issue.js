// Comprehensive diagnostic script to find the issue
// Run this in the browser console while on the notification tab

const findTheIssue = async () => {
  console.log('🔍 FINDING THE ISSUE - Previous Notifications Diagnostic');
  console.log('=====================================================');
  
  // Step 1: Check if we have a selected user
  console.log('\n1️⃣ CHECKING SELECTED USER');
  if (!selectedUser) {
    console.error('❌ ISSUE FOUND: No user selected');
    return;
  }
  console.log('✅ User selected:', selectedUser.email || selectedUser.id);
  console.log('🆔 User ID:', selectedUser.id);
  console.log('📊 User type:', selectedUser.user_type);
  
  // Step 2: Check current state
  console.log('\n2️⃣ CHECKING CURRENT STATE');
  console.log('- activeTab:', activeTab, '(should be 2 for notification tab)');
  console.log('- notificationsLoading:', notificationsLoading);
  console.log('- previousNotifications length:', previousNotifications?.length || 0);
  
  // Step 3: Check all notifications in database
  console.log('\n3️⃣ CHECKING ALL NOTIFICATIONS IN DATABASE');
  try {
    const { data: allNotifications, error: allError } = await supabase
      .from('community_notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (allError) {
      console.error('❌ ISSUE FOUND: Cannot access notifications table:', allError);
      return;
    }
    
    console.log('✅ Database accessible');
    console.log('📊 Total notifications in database:', allNotifications?.length || 0);
    
    if (allNotifications && allNotifications.length > 0) {
      console.log('📋 Recent notifications:');
      allNotifications.forEach((notif, index) => {
        console.log(`   ${index + 1}. ID: ${notif.id}, User: ${notif.user_id}, Title: ${notif.title}, Created: ${notif.created_at}`);
      });
    }
  } catch (error) {
    console.error('❌ ISSUE FOUND: Database query failed:', error);
    return;
  }
  
  // Step 4: Check notifications for specific user
  console.log('\n4️⃣ CHECKING NOTIFICATIONS FOR SELECTED USER');
  try {
    const { data: userNotifications, error: userError } = await supabase
      .from('community_notifications')
      .select('*')
      .eq('user_id', selectedUser.id)
      .order('created_at', { ascending: false });
    
    if (userError) {
      console.error('❌ ISSUE FOUND: Cannot query user notifications:', userError);
      return;
    }
    
    console.log('✅ User query successful');
    console.log('📊 Notifications for this user:', userNotifications?.length || 0);
    
    if (userNotifications && userNotifications.length > 0) {
      console.log('📋 User notifications:');
      userNotifications.forEach((notif, index) => {
        console.log(`   ${index + 1}. ID: ${notif.id}, Title: ${notif.title}, Created: ${notif.created_at}`);
      });
    } else {
      console.log('⚠️  No notifications found for this user');
    }
  } catch (error) {
    console.error('❌ ISSUE FOUND: User query failed:', error);
    return;
  }
  
  // Step 5: Test getUserNotifications function
  console.log('\n5️⃣ TESTING getUserNotifications FUNCTION');
  try {
    const { data: funcData, error: funcError } = await getUserNotifications(selectedUser.id);
    
    if (funcError) {
      console.error('❌ ISSUE FOUND: getUserNotifications function error:', funcError);
    } else {
      console.log('✅ getUserNotifications function works');
      console.log('📊 Function returned:', funcData?.length || 0, 'notifications');
      
      if (funcData && funcData.length > 0) {
        console.log('📋 Function results:');
        funcData.forEach((notif, index) => {
          console.log(`   ${index + 1}. ID: ${notif.id}, Title: ${notif.title}, Created: ${notif.created_at}`);
        });
      }
    }
  } catch (error) {
    console.error('❌ ISSUE FOUND: getUserNotifications function failed:', error);
  }
  
  // Step 6: Test fetchPreviousNotifications function
  console.log('\n6️⃣ TESTING fetchPreviousNotifications FUNCTION');
  if (typeof fetchPreviousNotifications === 'function') {
    console.log('✅ fetchPreviousNotifications function exists');
    
    // Store current state
    const beforeState = {
      previousNotifications: [...(previousNotifications || [])],
      notificationsLoading: notificationsLoading
    };
    
    console.log('📊 State before calling function:', beforeState);
    
    // Call the function
    await fetchPreviousNotifications();
    
    // Wait and check state after
    setTimeout(() => {
      const afterState = {
        previousNotifications: [...(previousNotifications || [])],
        notificationsLoading: notificationsLoading
      };
      
      console.log('📊 State after calling function:', afterState);
      
      if (afterState.previousNotifications.length > beforeState.previousNotifications.length) {
        console.log('✅ State updated successfully');
      } else {
        console.log('❌ ISSUE FOUND: State not updated after function call');
      }
    }, 1000);
  } else {
    console.error('❌ ISSUE FOUND: fetchPreviousNotifications function not found');
  }
  
  // Step 7: Check for RLS issues
  console.log('\n7️⃣ CHECKING FOR RLS ISSUES');
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      console.log('✅ Authenticated user:', user.email);
      
      // Check if current user is admin
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('user_type')
        .eq('id', user.id)
        .single();
      
      if (profileError) {
        console.error('❌ ISSUE FOUND: Cannot check admin status:', profileError);
      } else {
        console.log('👤 Current user type:', profile?.user_type);
        if (profile?.user_type !== 'admin') {
          console.log('⚠️  Current user is not admin - this might cause RLS issues');
        }
      }
    } else {
      console.error('❌ ISSUE FOUND: No authenticated user');
    }
  } catch (error) {
    console.error('❌ ISSUE FOUND: Auth check failed:', error);
  }
  
  console.log('\n🎯 DIAGNOSTIC COMPLETE');
  console.log('=====================================================');
  console.log('💡 Look for ❌ ISSUE FOUND messages above to identify the problem');
  console.log('💡 If no issues found, the problem might be in the UI rendering logic');
};

// Export for browser console
if (typeof window !== 'undefined') {
  window.findTheIssue = findTheIssue;
} 