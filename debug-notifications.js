// Simple debug script for notifications
// Copy and paste this entire block into your browser console

console.log('🔍 DEBUGGING NOTIFICATIONS');

// Check if we're in a React app
if (typeof window !== 'undefined') {
  console.log('✅ Running in browser environment');
  
  // Check for any global variables
  console.log('🔍 Available global variables:', Object.keys(window).filter(key => 
    key.includes('supabase') || 
    key.includes('user') || 
    key.includes('notification') ||
    key.includes('react')
  ));
  
  // Check for any error messages in console
  console.log('📋 Check the console above for any error messages');
  
  // Instructions for manual debugging
  console.log(`
📋 MANUAL DEBUGGING STEPS:
1. Open React DevTools (F12 → Components tab)
2. Find the Dashboard component
3. Look at the state variables:
   - selectedUser
   - previousNotifications
   - notificationsLoading
4. Check the Network tab for any failed requests
5. Look for any error messages in the Console tab

🔍 WHAT TO LOOK FOR:
- Is selectedUser set to a valid user?
- Is notificationsLoading stuck on true?
- Are there any network errors when fetching notifications?
- Are there any console errors when clicking the notification tab?
  `);
  
} else {
  console.log('❌ Not running in browser environment');
} 