# Firebase Migration Summary

## Changes Made

### 1. **lib/firebase.ts**
- ✅ Removed the `appFirebaseConfig` (nesterp-813b8 project) completely
- ✅ Removed the `mainApp` Firebase instance
- ✅ Removed the `appDb` Firestore export
- ✅ Now using only `dataFirebaseConfig` (nest-school-barcode-ims project)
- ✅ Single Firebase app instance (`dataApp`) as the default app
- ✅ Single Firestore instance (`dataDb`) for all operations

### 2. **lib/auth.ts**
- ✅ Updated import to use only `dataDb` (removed `appDb`)
- ✅ Changed all `appDb` references to `dataDb` in:
  - `ensureCredentialsExist()` function
  - `validateLogin()` function
  - `changePassword()` function
  - `updateFcmToken()` function
- ✅ Updated all console log messages to reflect `dataDb`

### 3. **Other Files**
- ✅ No changes needed - all other files were already using `dataDb`:
  - `hooks/useWorkingDays.ts`
  - `hooks/useStudent.ts`
  - `hooks/useAttendance.ts`
  - `app/api/attendance/route.ts`
  - `lib/notifications.ts`

## What You Need to Do Next

### 1. **Create the `parentCredentials` Collection in Firebase**

You need to create this collection in your **nest-school-barcode-ims** Firebase project. The collection structure should be:

**Collection Name:** `parentCredentials`

**Document ID:** Student USN (e.g., `NG823004_L01`)

**Document Fields:**
```
{
  password: string,          // Hashed password
  isFirstLogin: boolean,     // true for first login, false after password change
  fcmToken: string | null,   // FCM token for push notifications
  createdAt: timestamp,      // Auto-generated
  updatedAt: timestamp       // Auto-generated
}
```

### 2. **Update Firestore Rules**

Make sure your Firestore rules in **nest-school-barcode-ims** allow read/write access to the `parentCredentials` collection. Example rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Existing rules for students and attendance...
    
    // Rules for parentCredentials
    match /parentCredentials/{usn} {
      allow read, write: if true;  // Adjust based on your security needs
    }
  }
}
```

### 3. **Test the Login Flow**

1. Try logging in with a student USN that exists in the `students` collection
2. The system will automatically create a `parentCredentials` document with the default password `parent@123`
3. Verify that the login works and the document is created in Firebase Console

## Benefits of This Change

✅ **Simplified Architecture**: Single Firebase project instead of two
✅ **Easier Management**: All data in one place
✅ **Reduced Complexity**: No need to manage multiple Firebase configurations
✅ **Cost Effective**: Single Firebase project billing
✅ **Consistent Flow**: All authentication and data in the same database

## No Breaking Changes

The login flow remains exactly the same:
- Parents log in with student USN and password
- Default password is still `parent@123`
- First login still requires password change
- All existing functionality is preserved
