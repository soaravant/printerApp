"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = main;
/* eslint-disable no-console */
const dotenv_1 = require("dotenv");
const fs_1 = require("fs");
if ((0, fs_1.existsSync)('.env.local'))
    (0, dotenv_1.config)({ path: '.env.local' });
else
    (0, dotenv_1.config)();
const firebase_admin_1 = __importDefault(require("./utils/firebase-admin"));
const firebase_schema_1 = require("../lib/firebase-schema");
function toDate(v) {
    return v && typeof v.toDate === 'function' ? v.toDate() : new Date(v);
}
async function main() {
    const db = (0, firebase_admin_1.default)();
    console.log('Loading incomes...');
    const iSnap = await db.collection(firebase_schema_1.FIREBASE_COLLECTIONS.INCOME).get();
    const incomes = iSnap.docs.map(d => d.data());
    console.log(`Loaded ${incomes.length} incomes`);
    // Build map: uid -> latest income Date
    const latestByUser = new Map();
    for (const inc of incomes) {
        const ts = toDate(inc.timestamp);
        const prev = latestByUser.get(inc.uid);
        if (!prev || ts > prev)
            latestByUser.set(inc.uid, ts);
    }
    console.log('Loading users...');
    const uSnap = await db.collection(firebase_schema_1.FIREBASE_COLLECTIONS.USERS).get();
    const users = uSnap.docs.map(d => d.data());
    console.log(`Loaded ${users.length} users`);
    const batch = db.batch();
    let updates = 0;
    for (const u of users) {
        const last = latestByUser.get(u.uid) || null;
        const ref = db.collection(firebase_schema_1.FIREBASE_COLLECTIONS.USERS).doc(u.uid);
        batch.update(ref, { lastPayment: last });
        updates++;
        // Commit in chunks of 400 to avoid limits
        if (updates % 400 === 0) {
            await batch.commit();
            console.log(`Committed ${updates} user updates so far...`);
        }
    }
    // Commit remaining
    await batch.commit();
    console.log(`Backfill complete. Updated ${updates} users with lastPayment`);
}
if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch(err => { console.error(err); process.exit(1); });
}
