# iOS App Force Update System - Simple Guide

## 🎯 What This Does

The admin dashboard controls whether iOS app users are **forced to update** before using the app. When you turn it ON in the dashboard, users with old app versions will see a message and must update from the App Store.

---

## 📱 What Your iOS App Needs To Do

### **Step 1: Check Settings When App Starts**

When the app launches, make an API call to your Supabase database:

```swift
// Endpoint: Your Supabase URL + /rest/v1/app_settings
// Method: GET
// Query: ?setting_key=eq.force_update_enabled

GET https://YOUR_PROJECT.supabase.co/rest/v1/app_settings?setting_key=eq.force_update_enabled
```

**Headers needed:**
```
apikey: YOUR_SUPABASE_ANON_KEY
Authorization: Bearer YOUR_SUPABASE_ANON_KEY
```

---

### **Step 2: Parse The Response**

You'll get back JSON like this:

```json
[
  {
    "id": "some-uuid",
    "setting_key": "force_update_enabled",
    "setting_value": {
      "enabled": true,
      "message": "A new version of Momu is available. Please update to continue using the app.",
      "current_version": "1.0.6",
      "latest_version": "1.0.7"
    },
    "created_at": "2024-12-01T00:00:00Z",
    "updated_at": "2024-12-01T12:30:00Z"
  }
]
```

---

### **Step 3: Compare Versions**

Extract the data from the response:

```swift
let enabled = response.setting_value.enabled        // true or false
let message = response.setting_value.message        // The custom message
let minVersion = response.setting_value.current_version  // "1.0.6" (minimum required)
let yourAppVersion = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String  // Your current app version
```

**The Logic:**
1. If `enabled == false` → Do nothing, let user use the app normally
2. If `enabled == true` → Compare versions:
   - If `yourAppVersion < minVersion` → **Show update alert and block the app**
   - If `yourAppVersion >= minVersion` → Let user use the app normally

---

### **Step 4: Show Update Alert (When Needed)**

When force update is required, show a blocking alert:

```swift
// Pseudo-code example
func showForceUpdateAlert(message: String) {
    let alert = UIAlertController(
        title: "Update Required",
        message: message,  // Use the custom message from the response
        preferredStyle: .alert
    )
    
    // Add "Update Now" button that opens App Store
    alert.addAction(UIAlertAction(title: "Update Now", style: .default) { _ in
        // Open your app in App Store
        let appStoreURL = "https://apps.apple.com/app/id6747963200"
        if let url = URL(string: appStoreURL) {
            UIApplication.shared.open(url)
        }
    })
    
    // DON'T add a cancel button - force the update
    
    present(alert, animated: true)
}
```

---

### **Step 5: Version Comparison Helper**

To compare version strings (e.g., "1.0.6" vs "1.0.7"):

```swift
func isVersionLessThan(current: String, minimum: String) -> Bool {
    return current.compare(minimum, options: .numeric) == .orderedAscending
}

// Usage:
if isVersionLessThan(current: "1.0.5", minimum: "1.0.6") {
    // Show force update
}
```

---

## 🔄 When To Check

**Check the force update settings:**
- ✅ When app launches
- ✅ When app comes back to foreground (from background)
- ✅ Optional: Periodically every hour if app stays open

**Example flow:**

```swift
// App Launch
func application(_ application: UIApplication, didFinishLaunchingWithOptions...) {
    checkForceUpdate()
}

// App Returns to Foreground
func applicationWillEnterForeground(_ application: UIApplication) {
    checkForceUpdate()
}

func checkForceUpdate() {
    // 1. Fetch settings from Supabase
    // 2. Compare versions
    // 3. Show alert if needed
    // 4. Block app usage if update required
}
```

---

## 📊 Example Complete Flow

```
1. User opens app
   ↓
2. App makes API call to Supabase: GET /app_settings?setting_key=eq.force_update_enabled
   ↓
3. Response: { enabled: true, current_version: "1.0.7" }
   ↓
4. App checks: My version = "1.0.5", Required = "1.0.7"
   ↓
5. Result: "1.0.5" < "1.0.7" → Update Required!
   ↓
6. Show blocking alert: "A new version of Momu is available..."
   ↓
7. User taps "Update Now" → Opens App Store
   ↓
8. User updates app to 1.0.7 → Can use app again
```

---

## 🎛️ What The Admin Dashboard Does

The admin (you) can control:

1. **Toggle ON/OFF**: Enable or disable forced updates
2. **Custom Message**: Change what message users see
3. **Minimum Version**: Set which version is required (e.g., "1.0.7")

The dashboard automatically shows the latest App Store version for reference.

---

## 🔐 Important Security Notes

1. **Use HTTPS**: Always use secure connections
2. **Don't Store Keys in Code**: Put your Supabase keys in environment variables/config
3. **Handle Errors**: If the API call fails, let users use the app (fail gracefully)

---

## ✅ Testing Checklist

To test the system:

1. ☐ Set your app version to something low (e.g., "1.0.0")
2. ☐ In admin dashboard, set minimum version to "1.0.5" and enable force update
3. ☐ Launch your test app → Should see update alert
4. ☐ In admin dashboard, disable force update
5. ☐ Relaunch test app → Should work normally
6. ☐ Test with version equal to minimum → Should work
7. ☐ Test with version higher than minimum → Should work

---

## 🚨 Quick Reference

**Supabase API Endpoint:**
```
GET https://YOUR_PROJECT.supabase.co/rest/v1/app_settings?setting_key=eq.force_update_enabled
```

**Response Structure:**
```json
{
  "setting_value": {
    "enabled": boolean,
    "message": string,
    "current_version": string,
    "latest_version": string
  }
}
```

**Version Comparison:**
- If `enabled == false` → Allow app
- If `enabled == true` AND `appVersion < current_version` → Force update
- Otherwise → Allow app

---

## 📞 Need Help?

If you have questions about implementing this:
1. Check the admin dashboard console logs for what data it's sending
2. Test the API endpoint directly in Postman/Bruno
3. Make sure your app has proper Supabase authentication headers

**Your Supabase Project ID:** (Check your .env or lib/supabase.ts file)
**Your App Store ID:** 6747963200

