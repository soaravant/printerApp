"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdminDb = getAdminDb;
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
const fs_1 = require("fs");
function getAdminDb() {
    if (!(0, app_1.getApps)().length) {
        const base64 = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
        const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
        if (base64) {
            const json = JSON.parse(Buffer.from(base64, "base64").toString("utf8"));
            (0, app_1.initializeApp)({ credential: (0, app_1.cert)(json) });
        }
        else if (credentialsPath && (0, fs_1.existsSync)(credentialsPath)) {
            const json = JSON.parse((0, fs_1.readFileSync)(credentialsPath, "utf8"));
            (0, app_1.initializeApp)({ credential: (0, app_1.cert)(json) });
        }
        else if (process.env.FIRESTORE_EMULATOR_HOST) {
            (0, app_1.initializeApp)({ credential: (0, app_1.applicationDefault)() });
        }
        else {
            throw new Error("Missing admin credentials. Set FIREBASE_SERVICE_ACCOUNT_KEY (base64 of service account JSON) or GOOGLE_APPLICATION_CREDENTIALS (path to JSON).");
        }
    }
    return (0, firestore_1.getFirestore)();
}
exports.default = getAdminDb;
