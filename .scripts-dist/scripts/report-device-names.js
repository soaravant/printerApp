"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable no-console */
const dotenv_1 = require("dotenv");
const fs_1 = require("fs");
if ((0, fs_1.existsSync)('.env.local'))
    (0, dotenv_1.config)({ path: '.env.local' });
else
    (0, dotenv_1.config)();
const firebase_admin_1 = __importDefault(require("./utils/firebase-admin"));
const firebase_schema_1 = require("../lib/firebase-schema");
async function main() {
    const db = (0, firebase_admin_1.default)();
    const snap = await db.collection(firebase_schema_1.FIREBASE_COLLECTIONS.PRINT_JOBS).get();
    const byName = new Map();
    let missingIp = 0;
    const samples = [];
    for (const d of snap.docs) {
        const j = d.data();
        const name = (j.deviceName || '').trim();
        byName.set(name, (byName.get(name) || 0) + 1);
        if (!j.deviceIP || String(j.deviceIP).trim() === '') {
            missingIp++;
            if (samples.length < 10)
                samples.push({ jobId: j.jobId, deviceName: name, deviceIP: j.deviceIP });
        }
    }
    console.log(`Total jobs: ${snap.size}`);
    console.log(`Missing deviceIP: ${missingIp}`);
    console.log('Top deviceName values:');
    const sorted = [...byName.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20);
    for (const [name, count] of sorted)
        console.log(`- "${name}": ${count}`);
    if (samples.length) {
        console.log('Samples missing deviceIP:');
        for (const s of samples)
            console.log(s);
    }
}
if (require.main === module) {
    main().catch((e) => { console.error(e); process.exit(1); });
}
