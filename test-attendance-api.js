/**
 * API Testing Helper
 *
 * Use this file to test the attendance API endpoint locally
 *
 * Installation:
 *   npm install -g curl  (or use Postman)
 *
 * Testing:
 *   node test-attendance-api.js
 */

// Test data
const testEvents = [
  {
    usn: "USN001",
    wardName: "Aarav Sharma",
    type: "ENTRY",
    timestamp: new Date().toISOString(),
    parentId: "parent1@example.com",
  },
  {
    usn: "USN002",
    wardName: "Priya Patel",
    type: "EXIT",
    timestamp: new Date().toISOString(),
    parentId: "parent2@example.com",
  },
  {
    usn: "USN003",
    wardName: "Ravi Kumar",
    type: "ENTRY",
    timestamp: new Date(Date.now() - 5000).toISOString(), // 5 seconds ago
  },
];

async function testAttendanceAPI(eventData) {
  const apiUrl = "http://localhost:3000/api/attendance";

  console.log("\n📤 Sending attendance event...");
  console.log("URL:", apiUrl);
  console.log("Payload:", JSON.stringify(eventData, null, 2));

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(eventData),
    });

    const data = await response.json();

    console.log("\n✅ Response Status:", response.status);
    console.log("Response Body:", JSON.stringify(data, null, 2));

    if (response.status === 200 || response.status === 202) {
      console.log("✓ Event processed successfully");
    } else {
      console.log("✗ Event processing failed");
    }

    return data;
  } catch (error) {
    console.error("\n❌ Error calling API:", error.message);
    return null;
  }
}

async function runTests() {
  console.log("╔════════════════════════════════════════════════════════╗");
  console.log("║     NEST School Attendance API Testing Helper          ║");
  console.log("╚════════════════════════════════════════════════════════╝");

  console.log("\n⚠️  Make sure:");
  console.log("   1. npm run dev is running");
  console.log("   2. .env.local has ONESIGNAL_REST_API_KEY set");
  console.log("   3. Firebase is configured");

  console.log("\n🧪 Running tests...\n");

  // Test each event
  for (let i = 0; i < testEvents.length; i++) {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`Test ${i + 1}/${testEvents.length}: ${testEvents[i].type}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    await testAttendanceAPI(testEvents[i]);

    // Wait before next request
    if (i < testEvents.length - 1) {
      console.log("\n⏳ Waiting 2 seconds before next test...");
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  console.log("\n╔════════════════════════════════════════════════════════╗");
  console.log("║              Testing Complete!                         ║");
  console.log("╚════════════════════════════════════════════════════════╝");

  console.log("\n📝 Next steps:");
  console.log("   1. Check Firebase Console → Firestore → attendance_logs");
  console.log("   2. Verify documents were created");
  console.log("   3. Check OneSignal Dashboard for sent notifications");
  console.log(
    "   4. Test with browser closed (notifications via service worker)",
  );
}

// Run tests if executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testAttendanceAPI, testEvents };
