"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = void 0;
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
function slugifyUsername(username) {
    return String(username || '')
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
}
async function main() {
    const db = (0, firebase_admin_1.default)();
    console.log('Loading incomes...');
    const iSnap = await db.collection(firebase_schema_1.FIREBASE_COLLECTIONS.INCOME).get();
    const incomes = iSnap.docs.map(d => ({ id: d.id, data: d.data() }));
    console.log(`Loaded ${incomes.length} incomes`);
    let updatedCreatedAt = 0;
    let renamed = 0;
    for (const inc of incomes) {
        const id = inc.id;
        const data = inc.data;
        // 1) Ensure createdAt exists
        if (!data.createdAt) {
            const createdAt = new Date();
            await db.collection(firebase_schema_1.FIREBASE_COLLECTIONS.INCOME).doc(id).set({ createdAt }, { merge: true });
            updatedCreatedAt++;
        }
        // 2) If id does not follow <username>-<date>-<amount>-<random>, create new doc and delete old
        const usernamePart = data.username ? slugifyUsername(data.username) : 'unknown';
        const ts = toDate(data.timestamp);
        const y = ts.getFullYear();
        const m = String(ts.getMonth() + 1).padStart(2, '0');
        const d = String(ts.getDate()).padStart(2, '0');
        const datePart = `${d}-${m}-${y}`;
        const amountPart = Number(data.amount || 0).toFixed(2);
        const pattern = new RegExp(`^${usernamePart}-${datePart}-${amountPart}-[a-z0-9]{6,}$`);
        if (!pattern.test(id)) {
            const rand = Math.random().toString(36).slice(2, 8);
            const newId = `${usernamePart}-${datePart}-${amountPart}-${rand}`;
            const newDoc = { ...data, incomeId: newId };
            await db.runTransaction(async (tx) => {
                const fromRef = db.collection(firebase_schema_1.FIREBASE_COLLECTIONS.INCOME).doc(id);
                const toRef = db.collection(firebase_schema_1.FIREBASE_COLLECTIONS.INCOME).doc(newId);
                tx.set(toRef, newDoc);
                tx.delete(fromRef);
            });
            renamed++;
        }
    }
    console.log(`Backfill complete. createdAt added: ${updatedCreatedAt}, renamed docs: ${renamed}`);
}
exports.main = main;
if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch(err => { console.error(err); process.exit(1); });
}
