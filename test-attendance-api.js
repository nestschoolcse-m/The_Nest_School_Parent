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



  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(eventData),
    });

    const data = await response.json();



    if (response.status === 200 || response.status === 202) {

    }

    return data;
  } catch (error) {
    console.error("\n❌ Error calling API:", error.message);
    return null;
  }
}

async function runTests() {


  // Test each event
  for (let i = 0; i < testEvents.length; i++) {


    await testAttendanceAPI(testEvents[i]);

    // Wait before next request
    if (i < testEvents.length - 1) {

      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }


}

// Run tests if executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testAttendanceAPI, testEvents };
