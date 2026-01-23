/**
 * QUICK REFERENCE GUIDE
 * OneSignal Web Push Implementation for NEST School Parent App
 */

// ============================================================================
// 1. ENVIRONMENT SETUP
// ============================================================================

/*
File: .env.local

NEXT_PUBLIC_ONESIGNAL_APP_ID=13657fb4-80b6-43d6-8f74-0a8bf3d4729d
ONESIGNAL_REST_API_KEY=<get_from_onesignal_dashboard>
NEXT_PUBLIC_ONESIGNAL_SAFARI_WEB_ID=web.onesignal.auto.3cfe9839-ceab-4809-9212-172318dbfb2e

Steps to get REST API Key:
1. Go to OneSignal Dashboard
2. Select "NEST School Parent App" project
3. Settings > Keys & IDs
4. Copy "REST API Key"
5. Paste into .env.local
*/

// ============================================================================
// 2. KEY FILES CREATED/MODIFIED
// ============================================================================

const FILES = {
  // Modified Files
  "app/layout.tsx": {
    changes: [
      "+ Added: import Script from 'next/script'",
      "+ Added: OneSignal SDK script with v16",
      "+ Added: OneSignal initialization with EXACTLY specified config",
      "+ Added: PWA meta tags for manifest",
    ],
  },

  "contexts/AuthContext.tsx": {
    changes: [
      "+ Added: tagUserInOneSignal() function",
      "+ Added: window.OneSignal.login(usn) on user login",
      "+ Added: OneSignal tagging with user tags",
      "+ Added: Logging for OneSignal tagging",
    ],
  },

  "lib/notifications.ts": {
    changes: [
      "* Rewritten: Complete client-side notification implementation",
      "+ Added: Real-time Firestore listener for attendance_logs",
      "+ Added: Foreground notification display",
      "+ Added: Service worker notification handling",
      "+ Added: Error handling and fallback to native API",
    ],
  },

  // New Files
  "lib/oneSignalServer.ts": {
    purpose: "Server-side OneSignal operations",
    exports: [
      "sendOneSignalNotification()",
      "tagOneSignalUser()",
      "formatAttendanceNotification()",
    ],
  },

  "lib/errorHandling.ts": {
    purpose: "Logging and error handling",
    exports: [
      "createLogger()",
      "AppError, ValidationError, NotFoundError",
      "validators object",
      "retryAsync(), safeAsync()",
    ],
  },

  "app/api/attendance/route.ts": {
    purpose: "API endpoint for attendance events",
    method: "POST",
    path: "/api/attendance",
    responsibilities: [
      "Validate request data",
      "Write to Firestore attendance_logs",
      "Send OneSignal notification",
      "Return response with messageId",
    ],
  },

  "public/OneSignalSDKWorker.js": {
    purpose: "OneSignal background service worker",
    note: "Must be at site root for OneSignal to work",
  },

  "public/OneSignalSDKUpdaterWorker.js": {
    purpose: "OneSignal service worker updater",
    note: "Must be at site root for OneSignal to work",
  },

  "public/manifest.json": {
    purpose: "PWA manifest for mobile support",
    note: "Updated with manifest in layout.tsx",
  },

  ".env.local": {
    purpose: "Environment variables (API keys)",
    note: "NEVER commit to git",
  },

  "FIRESTORE_SECURITY_RULES.txt": {
    purpose: "Firestore security rules",
    action: "Copy and apply in Firebase Console",
  },

  "BUILD_INSTRUCTIONS.md": {
    purpose: "Complete setup and troubleshooting guide",
  },

  "test-attendance-api.js": {
    purpose: "Testing helper for API endpoint",
  },
};

// ============================================================================
// 3. DATA FLOW WALKTHROUGH
// ============================================================================

const DATA_FLOW = `
STEP 1: Student Enters/Exits Campus
└─ Barcode scanner detects student
└─ Attendance system records: USN, timestamp, type (ENTRY/EXIT)

STEP 2: POST /api/attendance
Request:
{
  "usn": "USN12345",
  "wardName": "John Doe",
  "type": "ENTRY",
  "timestamp": "2024-01-22T10:30:00Z",
  "parentId": "parent@example.com"
}

STEP 3: Server-Side Processing
└─ Validate request data
└─ Write to Firestore: attendance_logs collection
└─ Format notification: "Your ward [NAME] with USN [XXX] has entered..."
└─ Send via OneSignal REST API
└─ Return: { success: true, messageId: "..." }

STEP 4: Firestore Event
└─ Document added to attendance_logs
└─ Real-time listener on client gets notified
└─ Client checks if event is recent (not historical)

STEP 5: Client-Side Listener
└─ Firestore listener detects new document
└─ triggerNotification() called
└─ Display notification (foreground or background)

STEP 6: Notification Display
├─ FOREGROUND (browser open)
│  └─ OneSignal creates web notification
│  └─ Shows in browser notification center
│
└─ BACKGROUND (browser closed)
   └─ OneSignal service worker activates
   └─ Receives push notification
   └─ Displays in OS notification center
   └─ Works on: Web, Android Chrome, iOS PWA
`;

// ============================================================================
// 4. CRITICAL CONFIGURATION POINTS
// ============================================================================

const CRITICAL_CONFIG = {
  "OneSignal SDK in layout.tsx": {
    line: "import Script from 'next/script'",
    reason: "Must use next/script for proper async loading",
  },

  "OneSignal Initialization": {
    config: {
      appId: "13657fb4-80b6-43d6-8f74-0a8bf3d4729d",
      safari_web_id: "web.onesignal.auto.3cfe9839-ceab-4809-9212-172318dbfb2e",
      notifyButton: { enable: true },
      allowLocalhostAsSecureOrigin: true,
    },
    note: "EXACTLY as specified - DO NOT modify",
  },

  "Service Worker Files": {
    location: "public/ (site root)",
    files: ["OneSignalSDKWorker.js", "OneSignalSDKUpdaterWorker.js"],
    note: "OneSignal will not work if these are missing or misplaced",
  },

  "Firestore Collections": {
    attendance_logs: {
      purpose: "Store all attendance events",
      fields: ["usn", "wardName", "type", "timestamp", "parentId", "createdAt"],
      writeAccess: "Server-side only (via service account)",
      readAccess: "Authenticated users",
    },

    parentCredentials: {
      purpose: "Store parent login credentials",
      readAccess: "None (internal use only)",
      writeAccess: "Backend only",
    },
  },

  "REST API Key": {
    security: "Stored in .env.local (server-side only)",
    exposure: "NEVER expose in client code",
    rotation: "Rotate periodically in production",
  },

  "User Tagging": {
    method: "window.OneSignal.login(usn) + window.OneSignal.sendTag()",
    timing: "On user login in AuthContext",
    purpose: "Enable OneSignal to segment/target users",
  },
};

// ============================================================================
// 5. EXAMPLE API USAGE
// ============================================================================

const API_EXAMPLES = {
  "ENTRY Event": {
    endpoint: "POST /api/attendance",
    body: {
      usn: "USN12345",
      wardName: "John Doe",
      type: "ENTRY",
      timestamp: "2024-01-22T09:00:00Z",
      parentId: "john.parent@example.com",
    },
  },

  "EXIT Event": {
    endpoint: "POST /api/attendance",
    body: {
      usn: "USN12346",
      wardName: "Jane Smith",
      type: "EXIT",
      timestamp: "2024-01-22T15:30:00Z",
      parentId: "jane.parent@example.com",
    },
  },

  "cURL Example": `
    curl -X POST http://localhost:3000/api/attendance \\
      -H "Content-Type: application/json" \\
      -d '{
        "usn": "USN12345",
        "wardName": "John Doe",
        "type": "ENTRY",
        "timestamp": "2024-01-22T09:00:00Z",
        "parentId": "john.parent@example.com"
      }'
  `,
};

// ============================================================================
// 6. NOTIFICATION CONTENT
// ============================================================================

const NOTIFICATION_FORMAT = {
  title: "NEST SCHOOL",
  body: "Your ward <WARD_NAME> with USN <USN> has <entered/exited> at the campus <TIMESTAMP>",

  example_entry:
    "Your ward John Doe with USN USN12345 has entered at the campus Jan 22, 9:00 AM",
  example_exit:
    "Your ward John Doe with USN USN12345 has exited at the campus Jan 22, 3:30 PM",
};

// ============================================================================
// 7. VERIFICATION CHECKLIST
// ============================================================================

const VERIFY_CHECKLIST = [
  "[ ] .env.local has ONESIGNAL_REST_API_KEY",
  "[ ] app/layout.tsx imports Script from 'next/script'",
  "[ ] OneSignal scripts are properly configured",
  "[ ] public/OneSignalSDKWorker.js exists",
  "[ ] public/OneSignalSDKUpdaterWorker.js exists",
  "[ ] app/api/attendance/route.ts created",
  "[ ] Firestore security rules applied",
  "[ ] npm run build completes without errors",
  "[ ] npm run dev starts successfully",
  "[ ] OneSignal SDK initializes (check console)",
  "[ ] Service workers register (check DevTools)",
  "[ ] Login tags user in OneSignal",
  "[ ] API endpoint accepts POST requests",
  "[ ] Firestore documents are created",
  "[ ] Notifications display when browser open",
  "[ ] Notifications display when browser closed",
];

// ============================================================================
// 8. TROUBLESHOOTING
// ============================================================================

const TROUBLESHOOTING = {
  "Build fails": {
    cause: "TypeScript errors or missing imports",
    solution: [
      "Check for typos in file paths",
      "Ensure all imports match actual exports",
      "Run: npx tsc --noEmit to see errors",
    ],
  },

  "OneSignal not initializing": {
    cause: "SDK not loaded or script strategy wrong",
    solution: [
      "Check Network tab - OneSignal SDK loads",
      "Verify script strategy is 'afterInteractive'",
      "Check console for errors",
      "Clear cache and reload",
    ],
  },

  "Notifications not showing": {
    cause: "Permission denied or listener not active",
    solution: [
      "Grant notification permission when prompted",
      "Check Firestore listener is running",
      "Verify OneSignal service workers are registered",
      "Check browser notification settings",
    ],
  },

  "Firestore writes failing": {
    cause: "Security rules or credentials issue",
    solution: [
      "Verify Firebase credentials in lib/firebase.ts",
      "Check security rules allow server writes",
      "Check network tab for 403 errors",
      "Verify Firestore has attendance_logs collection",
    ],
  },

  "API returns 500": {
    cause: "REST API key missing or invalid",
    solution: [
      "Check ONESIGNAL_REST_API_KEY in .env.local",
      "Verify key is not expired in OneSignal dashboard",
      "Check request body JSON format",
      "Review server logs",
    ],
  },
};

// ============================================================================
// 9. PRODUCTION DEPLOYMENT NOTES
// ============================================================================

const PRODUCTION = {
  "Before deploying": [
    "Test all features locally",
    "Set ONESIGNAL_REST_API_KEY in production env vars",
    "Update Firebase project for production",
    "Enable HTTPS (required for service workers)",
    "Configure domain in OneSignal",
    "Update manifest.json with production URLs",
    "Test notifications on real devices",
  ],

  "Hosting platforms": {
    Vercel: "Recommended - Native Next.js support",
    "AWS Amplify": "Good support for Next.js",
    Netlify: "Works with build output",
    "Self-hosted": "Requires Node.js server",
  },

  Monitoring: [
    "Set up error tracking (Sentry, etc.)",
    "Monitor API response times",
    "Track notification delivery rates",
    "Set up uptime monitoring",
    "Create alerts for API errors",
  ],
};

console.log("QUICK REFERENCE GUIDE LOADED");
console.log("See this file for implementation details");
