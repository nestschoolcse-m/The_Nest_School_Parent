/**
 * NEST Attendance Bridge (Client SDK Version)
 * 
 * Fixed the "Default Credentials" error by using the standard Firebase SDK 
 * which only requires the API Key and Project ID.
 */

const { initializeApp } = require("firebase/app");
const {
    getFirestore,
    collection,
    query,
    where,
    onSnapshot,
    Timestamp
} = require("firebase/firestore");
const https = require("https");
const dotenv = require("dotenv");
const path = require("path");

// Load .env
dotenv.config({ path: path.join(__dirname, ".env") });

const ONESIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
const ONESIGNAL_API_KEY = process.env.ONESIGNAL_REST_API_KEY;

// Config from lib/firebase.ts
const firebaseConfig = {
    apiKey: "AIzaSyB1f5KQac31IPY-CWJ4IN-lb3ElRtRwuME",
    authDomain: "nest-school-barcode-ims.firebaseapp.com",
    projectId: "nest-school-barcode-ims",
    storageBucket: "nest-school-barcode-ims.firebasestorage.app",
    messagingSenderId: "663780876768",
    appId: "1:663780876768:web:1e574fa6ecddd1b96acb85",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log("🚀 Attendance Bridge Started...");
console.log("📡 Watching Firestore for scans (Real-time)...");

async function sendOneSignal(data) {
    const usn = (data.usn || data.USN || "").toString().toUpperCase();
    const type = (data.type || data.Type || "ENTRY").toString();
    const name = data.wardName || "Student";
    const action = type.toLowerCase() === "entry" ? "entered" : "exited";

    const payload = JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        include_external_user_ids: [usn],
        headings: { en: "NEST SCHOOL" },
        contents: { en: `Your ward ${name} (${usn}) has ${action} the campus.` },
        data: { usn, type }
    });

    const options = {
        hostname: "onesignal.com",
        path: "/api/v1/notifications",
        method: "POST",
        headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Authorization": `Basic ${ONESIGNAL_API_KEY}`
        }
    };

    const req = https.request(options, (res) => {
        let body = "";
        res.on("data", (d) => body += d);
        res.on("end", () => {
            const resp = JSON.parse(body);
            if (resp.id) console.log(`✅ NOTIFIED: ${usn} (${type})`);
            else console.log(`⚠️  NOTIFIED (Skipped): USN ${usn} not subscribed yet.`);
        });
    });

    req.on("error", (e) => console.error("❌ OneSignal Error:", e.message));
    req.write(payload);
    req.end();
}

// Start listening for new docs
const startTime = Timestamp.now();
const q = query(
    collection(db, "attendance_logs"),
    where("timestamp", ">=", startTime)
);

onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
            const data = change.doc.data();
            console.log(`📝 SCAN DETECTED: ${data.usn} - ${data.type}`);
            sendOneSignal(data);
        }
    });
}, (err) => {
    console.error("❌ FIRESTORE ERROR:", err.message);
    console.log("Tip: Check if Firestore Security Rules allow read access.");
});
