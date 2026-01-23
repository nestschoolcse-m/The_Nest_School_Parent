/**
 * Next.js Instrumentation Hook
 * 
 * This file runs once when the server starts. 
 * Using the standard Firebase SDK to avoid "Default Credentials" errors.
 */

export async function register() {
    if (process.env.NEXT_RUNTIME === "nodejs") {
        console.log("------------------------------------------------");
        console.log("🚀 NEST ERP: Starting Internal Attendance Bridge...");
        console.log("------------------------------------------------");

        try {
            const { initializeApp } = await import("firebase/app");
            const {
                getFirestore,
                collection,
                query,
                where,
                onSnapshot,
                Timestamp
            } = await import("firebase/firestore");
            const https = await import("https");

            // Config exactly as in lib/firebase.ts for the data project
            const firebaseConfig = {
                apiKey: "AIzaSyB1f5KQac31IPY-CWJ4IN-lb3ElRtRwuME",
                authDomain: "nest-school-barcode-ims.firebaseapp.com",
                projectId: "nest-school-barcode-ims",
                storageBucket: "nest-school-barcode-ims.firebasestorage.app",
                messagingSenderId: "663780876768",
                appId: "1:663780876768:web:1e574fa6ecddd1b96acb85",
            };

            // Initialize
            const app = initializeApp(firebaseConfig, "bridge-internal");
            const db = getFirestore(app);

            const ONESIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
            const ONESIGNAL_API_KEY = process.env.ONESIGNAL_REST_API_KEY;

            if (!ONESIGNAL_API_KEY) {
                console.warn("⚠️  Internal Bridge: ONESIGNAL_REST_API_KEY is missing.");
                return;
            }

            console.log("📡 Bridge Active: Monitoring Firestore 'attendance_logs'...");

            const startTime = Timestamp.now();
            const q = query(
                collection(db, "attendance_logs"),
                where("timestamp", ">=", startTime)
            );

            onSnapshot(q, (snapshot) => {
                snapshot.docChanges().forEach((change) => {
                    if (change.type === "added") {
                        const data = change.doc.data();
                        const usn = (data.usn || data.USN || "").toString().toUpperCase();
                        const type = (data.type || data.Type || "ENTRY").toString();
                        const name = data.wardName || "Student";
                        const action = type.toLowerCase() === "entry" ? "entered" : "exited";

                        console.log(`📝 Next.js Bridge: New Scan Detected (${usn})`);

                        const payload = JSON.stringify({
                            app_id: ONESIGNAL_APP_ID,
                            include_external_user_ids: [usn],
                            headings: { en: "NEST SCHOOL" },
                            contents: { en: `Your ward ${name} (${usn}) has ${action} the campus.` },
                            data: { usn, type }
                        });

                        const req = https.request({
                            hostname: "onesignal.com",
                            path: "/api/v1/notifications",
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json; charset=utf-8",
                                "Authorization": `Basic ${ONESIGNAL_API_KEY}`
                            }
                        }, (res) => {
                            let body = "";
                            res.on("data", (d) => body += d);
                            res.on("end", () => {
                                const resp = JSON.parse(body);
                                if (resp.id) console.log(`✅ Next.js Bridge: Notification sent to ${usn}`);
                            });
                        });

                        req.on("error", (e) => console.error("❌ Next.js Bridge Error:", e.message));
                        req.write(payload);
                        req.end();
                    }
                });
            }, err => {
                console.error("❌ Next.js Bridge Firestore Error:", err.message);
            });

        } catch (error) {
            console.error("❌ Failed to start Internal Attendance Bridge:", error);
        }
    }
}
