/**
 * POST /api/attendance - API Documentation
 *
 * Endpoint for processing student attendance events (ENTRY/EXIT)
 * and triggering push notifications to parents via OneSignal
 */

/**
 * REQUEST SPECIFICATION
 *
 * Endpoint: POST /api/attendance
 * Content-Type: application/json
 * Authentication: None (internal use only)
 */

interface AttendanceRequest {
  // Required Fields
  usn: string; // Student USN (e.g., "USN12345")
  wardName: string; // Student's name (e.g., "John Doe")
  type: "ENTRY" | "EXIT"; // Event type - only these two values allowed

  // Optional Fields
  timestamp?: string; // ISO 8601 timestamp (default: current time)
  parentId?: string; // Parent email for tagging (optional)
}

// Example Requests
const EXAMPLE_ENTRY = {
  usn: "USN001",
  wardName: "Aarav Sharma",
  type: "ENTRY",
  timestamp: "2024-01-22T09:00:00Z",
  parentId: "aarav.parent@example.com",
};

const EXAMPLE_EXIT = {
  usn: "USN002",
  wardName: "Priya Patel",
  type: "EXIT",
  timestamp: "2024-01-22T15:30:00Z",
  parentId: "priya.parent@example.com",
};

const MINIMAL_REQUEST = {
  usn: "USN003",
  wardName: "Ravi Kumar",
  type: "ENTRY",
  // timestamp and parentId are optional
};

/**
 * RESPONSE SPECIFICATION
 */

// Success Response (200 OK)
interface SuccessResponse {
  success: true;
  message: "Attendance recorded and notification sent";
  messageId: string; // OneSignal message ID for tracking
}

const EXAMPLE_SUCCESS = {
  success: true,
  message: "Attendance recorded and notification sent",
  messageId: "00000000-0000-0000-0000-000000000000",
};

// Partial Success Response (202 Accepted)
interface PartialSuccessResponse {
  success: true;
  message: "Attendance recorded but notification delivery failed";
  firestoreId: "recorded";
  notificationError: string; // Error message from OneSignal
}

const EXAMPLE_PARTIAL = {
  success: true,
  message: "Attendance recorded but notification delivery failed",
  firestoreId: "recorded",
  notificationError: "OneSignal API key not configured",
};

// Error Response (400 Bad Request)
interface ValidationError {
  error: string; // Error message describing what's wrong
}

const EXAMPLE_VALIDATION_ERROR = {
  error: "Missing or invalid 'usn'",
};

// Error Response (500 Internal Server Error)
const EXAMPLE_SERVER_ERROR = {
  error: "Internal server error",
};

/**
 * HTTP STATUS CODES
 */

const STATUS_CODES = {
  200: {
    description: "SUCCESS - Attendance recorded and notification sent",
    meaning: "Event processed and parent notified successfully",
    action: "No action needed",
  },

  202: {
    description: "ACCEPTED - Attendance recorded, notification may have failed",
    meaning: "Event saved but notification delivery failed",
    note: "Parent may still see notification via Firestore listener",
    action: "Check OneSignal dashboard for message status",
  },

  400: {
    description: "BAD REQUEST - Invalid input data",
    meaning: "Request validation failed",
    common_errors: [
      "Missing required field (usn, wardName, type)",
      "Invalid type (must be ENTRY or EXIT)",
      "Invalid timestamp format",
      "Empty or invalid USN",
    ],
    action: "Fix request body and retry",
  },

  500: {
    description: "INTERNAL SERVER ERROR",
    meaning: "Server error processing request",
    common_causes: [
      "Firebase Firestore not accessible",
      "Environment variable missing",
      "Unexpected error in processing",
    ],
    action: "Check server logs and retry",
  },
};

/**
 * CURL EXAMPLES
 */

const CURL_EXAMPLES = {
  "Entry Event": `
curl -X POST http://localhost:3000/api/attendance \\
  -H "Content-Type: application/json" \\
  -d '{
    "usn": "USN001",
    "wardName": "Aarav Sharma",
    "type": "ENTRY",
    "timestamp": "2024-01-22T09:00:00Z",
    "parentId": "aarav.parent@example.com"
  }'
  `,

  "Exit Event": `
curl -X POST http://localhost:3000/api/attendance \\
  -H "Content-Type: application/json" \\
  -d '{
    "usn": "USN002",
    "wardName": "Priya Patel",
    "type": "EXIT"
  }'
  `,

  "Minimal Request": `
curl -X POST http://localhost:3000/api/attendance \\
  -H "Content-Type: application/json" \\
  -d '{
    "usn": "USN003",
    "wardName": "Ravi Kumar",
    "type": "ENTRY"
  }'
  `,
};

/**
 * JavaScript/Fetch Examples
 */

async function sendAttendanceEvent(event) {
  try {
    const response = await fetch("/api/attendance", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`Error (${response.status}):`, data.error);
      return null;
    }

    console.log("Success:", data);
    return data;
  } catch (error) {
    console.error("Network error:", error);
    return null;
  }
}

// Usage
sendAttendanceEvent({
  usn: "USN001",
  wardName: "Aarav Sharma",
  type: "ENTRY",
  timestamp: new Date().toISOString(),
});

/**
 * VALIDATION RULES
 */

const VALIDATION_RULES = {
  usn: {
    type: "string",
    required: true,
    min_length: 1,
    max_length: 50,
    pattern: "Any non-empty string",
    sanitization: "Trimmed and converted to uppercase",
    example: "USN12345",
  },

  wardName: {
    type: "string",
    required: true,
    min_length: 1,
    max_length: 100,
    pattern: "Any non-empty string",
    sanitization: "Trimmed",
    example: "John Doe",
  },

  type: {
    type: "enum",
    required: true,
    allowed_values: ["ENTRY", "EXIT"],
    example: "ENTRY",
  },

  timestamp: {
    type: "string (ISO 8601)",
    required: false,
    default: "Current server time",
    format: "YYYY-MM-DDTHH:mm:ssZ",
    example: "2024-01-22T10:30:00Z",
  },

  parentId: {
    type: "string",
    required: false,
    description: "Optional parent identifier for tagging",
    example: "parent@example.com",
  },
};

/**
 * DATA FLOW INSIDE API
 */

const API_FLOW = `
1. Validate Request
   └─ Check all required fields present
   └─ Type must be ENTRY or EXIT
   └─ USN and wardName must be non-empty strings
   └─ Timestamp must be valid ISO 8601 format
   
2. Sanitize Data
   └─ Trim whitespace
   └─ Convert USN to uppercase
   └─ Parse timestamp or use current time
   
3. Write to Firestore
   └─ Collection: attendance_logs
   └─ Document fields: usn, wardName, type, timestamp, parentId, createdAt
   └─ Error: Return 500 if write fails
   └─ Success: Continue to step 4
   
4. Format Notification
   └─ Title: "NEST SCHOOL"
   └─ Body: "Your ward {wardName} with USN {usn} has {entered/exited} at the campus {timestamp}"
   └─ Data: usn, type, timestamp
   
5. Send via OneSignal
   └─ Use REST API with server-side key
   └─ Target user by USN tag
   └─ If success: Return 200 with messageId
   └─ If fails: Return 202 with error message
   
6. Log Results
   └─ Success: [API] Attendance logged and notification sent
   └─ Failure: [API] Error details logged to console
`;

/**
 * FIRESTORE DOCUMENT STRUCTURE
 */

interface FirestoreAttendanceDoc {
  usn: string; // Student USN
  wardName: string; // Student name
  type: "ENTRY" | "EXIT"; // Event type
  timestamp: Timestamp; // Event time (Firestore Timestamp)
  parentId: string | null; // Parent ID if provided
  createdAt: Timestamp; // When record was created (server timestamp)
}

const EXAMPLE_FIRESTORE_DOC = {
  usn: "USN001",
  wardName: "Aarav Sharma",
  type: "ENTRY",
  timestamp: "2024-01-22T09:00:00Z",
  parentId: "aarav.parent@example.com",
  createdAt: "2024-01-22T09:00:15Z",
};

/**
 * ONEIGNAL NOTIFICATION PAYLOAD
 */

interface OneSignalPayload {
  app_id: string; // From environment variable
  headings: { en: string }; // "NEST SCHOOL"
  contents: { en: string }; // Full notification text
  data: {
    usn: string;
    eventType: "ENTRY" | "EXIT";
    timestamp: string;
  };
  include_external_user_ids: string[]; // [usn] for targeting
}

const EXAMPLE_ONESIGNAL_PAYLOAD = {
  app_id: "13657fb4-80b6-43d6-8f74-0a8bf3d4729d",
  headings: { en: "NEST SCHOOL" },
  contents: {
    en: "Your ward Aarav Sharma with USN USN001 has entered at the campus Jan 22, 9:00 AM",
  },
  data: {
    usn: "USN001",
    eventType: "ENTRY",
    timestamp: "2024-01-22T09:00:00Z",
  },
  include_external_user_ids: ["USN001"],
};

/**
 * ERROR HANDLING
 */

const ERROR_SCENARIOS = {
  "Missing usn": {
    status: 400,
    response: { error: "Missing or invalid 'usn'" },
  },

  "Invalid type": {
    status: 400,
    response: { error: "Invalid 'type'. Must be 'ENTRY' or 'EXIT'" },
  },

  "Firestore error": {
    status: 500,
    response: { error: "Failed to save attendance record" },
  },

  "OneSignal error": {
    status: 202,
    response: {
      success: true,
      message: "Attendance recorded but notification delivery failed",
      firestoreId: "recorded",
      notificationError: "OneSignal API error",
    },
  },

  "Network error": {
    status: 500,
    response: { error: "Internal server error" },
  },
};

/**
 * RATE LIMITING RECOMMENDATIONS
 */

const RATE_LIMITS = {
  per_second: "No specific limit enforced",
  note: "Implement rate limiting at gateway (Vercel, load balancer)",
  recommendations: [
    "10 requests per second per IP",
    "1000 requests per minute per endpoint",
    "Implement backoff strategy for client",
  ],
};

/**
 * MONITORING & LOGGING
 */

const LOGGING = {
  info: [
    "[API] Attendance request received: {usn, type}",
    "[API] Writing to Firestore: {usn}",
    "[API] Firestore document created: {docId}",
    "[API] Preparing OneSignal notification for {usn}",
    "[API] Success - Attendance logged and notification sent",
  ],

  warn: [
    "[API] Validation failed: {error}",
    "[API] OneSignal notification failed: {error}",
  ],

  error: [
    "[API] Firestore write error: {error}",
    "[API] OneSignal API error: {error}",
    "[API] Unexpected error: {error}",
  ],
};

/**
 * TESTING
 */

const TESTING = {
  "Unit Tests": {
    focus: "Validation, data sanitization",
    test: [
      "Valid ENTRY event",
      "Valid EXIT event",
      "Missing required field",
      "Invalid type value",
      "Empty USN or wardName",
    ],
  },

  "Integration Tests": {
    focus: "API + Firestore + OneSignal",
    test: [
      "Event written to Firestore",
      "Notification sent to OneSignal",
      "Correct data in Firestore document",
      "Correct notification format",
    ],
  },

  "E2E Tests": {
    focus: "Full workflow",
    test: [
      "Event sent via API",
      "Parent receives notification",
      "Firestore record visible",
      "User can see in dashboard",
    ],
  },
};

/**
 * PRODUCTION CHECKLIST
 */

const PRODUCTION_CHECKLIST = [
  "[ ] Rate limiting configured",
  "[ ] Error tracking set up (Sentry, etc.)",
  "[ ] API monitoring configured",
  "[ ] Firestore index optimization",
  "[ ] OneSignal API key rotated",
  "[ ] HTTPS enabled on domain",
  "[ ] Request logging in place",
  "[ ] Notification delivery tracking",
  "[ ] Load testing completed",
  "[ ] Performance targets met",
  "[ ] Security audit passed",
  "[ ] Documentation reviewed",
];

console.log("API_DOCUMENTATION_LOADED");
