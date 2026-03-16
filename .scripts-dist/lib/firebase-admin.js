"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdminApp = getAdminApp;
exports.getAdminDb = getAdminDb;
exports.getAdminAuth = getAdminAuth;
const app_1 = require("firebase-admin/app");
const auth_1 = require("firebase-admin/auth");
const firestore_1 = require("firebase-admin/firestore");
const fs_1 = require("fs");
function getAdminApp() {
    if (!(0, app_1.getApps)().length) {
        const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
        const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
        if (key) {
            let jsonStr = key;
            // Support both base64-encoded and raw JSON in env var
            try {
                // If it's base64, decode to JSON string
                const decoded = Buffer.from(key, "base64").toString("utf8");
                // Heuristic: if decoding produced a JSON object, use it
                if (decoded.trim().startsWith("{") && decoded.trim().endsWith("}")) {
                    jsonStr = decoded;
                }
            }
            catch {
                // Ignore, fall back to using the original string
            }
            const json = JSON.parse(jsonStr);
            (0, app_1.initializeApp)({ credential: (0, app_1.cert)(json) });
        }
        else if (credentialsPath && (0, fs_1.existsSync)(credentialsPath)) {
            const json = JSON.parse((0, fs_1.readFileSync)(credentialsPath, "utf8"));
            (0, app_1.initializeApp)({ credential: (0, app_1.cert)(json) });
        }
        else {
            (0, app_1.initializeApp)({ credential: (0, app_1.applicationDefault)() });
        }
    }
}
function getAdminDb() {
    getAdminApp();
    return (0, firestore_1.getFirestore)();
}
function getAdminAuth() {
    getAdminApp();
    return (0, auth_1.getAuth)();
}
