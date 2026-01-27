# OneSignal Notification Update Summary

## Changes Made

### 1. **lib/oneSignalServer.ts**
- ✅ Added Firestore imports: `doc`, `getDoc` from `firebase/firestore`
- ✅ Added `dataDb` import from `./firebase`
- ✅ Made `formatAttendanceNotification()` function **async**
- ✅ Changed function signature:
  - **Before:** `formatAttendanceNotification(wardName: string, usn: string, eventType, timestamp)`
  - **After:** `formatAttendanceNotification(usn: string, eventType, timestamp)`
- ✅ Added logic to fetch student name from `dataDb.students` collection
- ✅ Returns `Promise<OneSignalNotificationPayload>` instead of `OneSignalNotificationPayload`
- ✅ Updated notification message: "has entered/exited **the** campus" (removed "at")

### 2. **app/api/attendance/route.ts**
- ✅ Updated function call to `await formatAttendanceNotification()`
- ✅ Removed `wardName` parameter from the function call
- ✅ Now passes only: `usn`, `eventType`, and `timestamp`

## How It Works Now

### Flow:
1. **API receives attendance event** with USN and event type (ENTRY/EXIT)
2. **formatAttendanceNotification()** is called with USN
3. **Function fetches student data** from `dataDb.students` collection using the USN
4. **Student name is extracted** from the document (checks `name` or `wardName` fields)
5. **Notification is formatted** with the actual student name from the database
6. **Notification is sent** via OneSignal to the parent

### Student Name Lookup:
```typescript
const studentRef = doc(dataDb, "students", usn);
const studentSnap = await getDoc(studentRef);

if (studentSnap.exists()) {
  const studentData = studentSnap.data();
  studentName = studentData.name || studentData.wardName || "Student";
}
```

### Fallback Behavior:
- If student is not found: Uses "Student" as fallback
- If name field is missing: Checks `wardName` field
- If both are missing: Uses "Student" as fallback
- Errors are logged but don't break the notification flow

## Benefits

✅ **Single Source of Truth**: Student names come from the database, not API requests
✅ **Data Consistency**: Always uses the latest student name from Firestore
✅ **Error Handling**: Graceful fallback if student data is not found
✅ **Better Logging**: Added console logs for debugging student data fetching
✅ **Simplified API**: No need to pass `wardName` in API requests anymore

## Example Notification

**Before:**
```
Your ward John Doe with USN NG823004_L01 has entered at the campus Jan 27, 2026, 10:30 AM
```

**After:**
```
Your ward John Doe with USN NG823004_L01 has entered the campus at Jan 27, 2026, 10:30 AM
```

## Testing

To test this change:
1. Ensure a student document exists in `dataDb.students` collection with the USN
2. Send an attendance event via the API
3. Check the notification message - it should contain the student name from the database
4. Check console logs to see the student data fetching process

## Notes

- The `wardName` parameter is still validated in the API route but is no longer used for notifications
- You may want to remove the `wardName` validation from the API route in the future if it's not needed for other purposes
- The function is now async, so all callers must use `await`
