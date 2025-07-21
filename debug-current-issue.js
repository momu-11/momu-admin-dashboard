// Debug script to identify the notification issue
// Run this in the browser console

const debugCurrentIssue = async () => {
  console.log('🔍 DEBUGGING NOTIFICATION ISSUE');
  console.log('================================');
  
  // Step 1: Check current user
  console.log('\n1️⃣ CHECKING CURRENT USER');
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    console.error('❌ No authenticated user:', authError);
    return;
  }
  
  console.log('✅ Current user:', user.email);
  console.log('🆔 Current user ID:', user.id);
  
  // Step 2: Check user profile and admin status
  console.log('\n2️⃣ CHECKING ADMIN STATUS');
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('user_type, id, username, name')
    .eq('id', user.id)
    .single();
  
  if (profileError) {
    console.error('❌ Error checking profile:', profileError);
    return;
  }
  
  console.log('✅ User profile:', profile);
  console.log('👤 User type:', profile?.user_type);
  
  if (profile?.user_type !== 'admin') {
    console.error('❌ ISSUE FOUND: User is not admin!');
    console.log('💡 Only admin users can read all notifications');
    return;
  }
  
  console.log('✅ User is admin');
  
  // Step 3: Test direct table access
  console.log('\n3️⃣ TESTING DIRECT TABLE ACCESS');
  try {
    const { data: allNotifications, error: allError } = await supabase
      .from('community_notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (allError) {
      console.error('❌ Error reading all notifications:', allError);
      console.log('💡 This might be an RLS policy issue');
    } else {
      console.log('✅ Can read all notifications');
      console.log('📊 Total notifications found:', allNotifications?.length || 0);
      
      if (allNotifications && allNotifications.length > 0) {
        console.log('📋 Recent notifications:');
        allNotifications.forEach((notif, index) => {
          console.log(`  ${index + 1}. User: ${notif.user_id}, Title: "${notif.title}", Created: ${notif.created_at}`);
        });
      } else {
        console.log('⚠️  No notifications found in database');
      }
    }
  } catch (error) {
    console.error('❌ Exception reading notifications:', error);
  }
  
  // Step 4: Test for specific user
  console.log('\n4️⃣ TESTING SPECIFIC USER ACCESS');
  const testUserId = '341f12f9-a4ea-457a-affe-b45a7a638a11'; // The user from earlier
  
  try {
    const { data: userNotifications, error: userError } = await supabase
      .from('community_notifications')
      .select('*')
      .eq('user_id', testUserId)
      .order('created_at', { ascending: false });
    
    if (userError) {
      console.error('❌ Error reading user notifications:', userError);
    } else {
      console.log('✅ Can read user notifications');
      console.log('📊 Notifications for user:', userNotifications?.length || 0);
      
      if (userNotifications && userNotifications.length > 0) {
        console.log('📋 User notifications:');
        userNotifications.forEach((notif, index) => {
          console.log(`  ${index + 1}. Title: "${notif.title}", Message: "${notif.message}", Created: ${notif.created_at}`);
        });
      }
    }
  } catch (error) {
    console.error('❌ Exception reading user notifications:', error);
  }
  
  // Step 5: Test the getUserNotifications function
  console.log('\n5️⃣ TESTING getUserNotifications FUNCTION');
  if (typeof getUserNotifications === 'function') {
    try {
      const { data, error } = await getUserNotifications(testUserId);
      
      if (error) {
        console.error('❌ getUserNotifications failed:', error);
      } else {
        console.log('✅ getUserNotifications works');
        console.log('📊 Function returned:', data?.length || 0, 'notifications');
        console.log('📋 Data:', data);
      }
    } catch (error) {
      console.error('❌ getUserNotifications exception:', error);
    }
  } else {
    console.error('❌ getUserNotifications function not found');
  }
  
  console.log('\n🎯 DIAGNOSTIC COMPLETE');
  console.log('========================');
};

// Export for console use
if (typeof window !== 'undefined') {
  window.debugCurrentIssue = debugCurrentIssue;
}

console.log('💡 Run: debugCurrentIssue() to start debugging'); 