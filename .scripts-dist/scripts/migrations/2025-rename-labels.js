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
const firebase_admin_1 = __importDefault(require("../utils/firebase-admin"));
const firebase_schema_1 = require("../../lib/firebase-schema");
// Maps old team names to new numbered labels
const teamMap = new Map([
    ["Ενωμένοι", "Ομάδα 1"],
    ["Σποριάδες", "Ομάδα 2"],
    ["Καρποφόροι", "Ομάδα 3"],
    ["Ολόφωτοι", "Ομάδα 4"],
    ["Νικητές", "Ομάδα 5"],
    ["Νικηφόροι", "Ομάδα 6"],
    ["Φλόγα", "Ομάδα 7"],
    ["Σύμψυχοι", "Ομάδα 8"],
]);
function mapLabel(label) {
    if (!label)
        return label;
    if (teamMap.has(label))
        return teamMap.get(label);
    const naos = label.match(/^Ναός\s+(\d+)$/);
    if (naos)
        return `Τμήμα ${naos[1]}`;
    return label;
}
function mapArray(values) {
    if (!values || !Array.isArray(values))
        return values;
    return values.map((v) => mapLabel(v));
}
async function migrateUsers() {
    const db = (0, firebase_admin_1.default)();
    const snap = await db.collection(firebase_schema_1.FIREBASE_COLLECTIONS.USERS).get();
    let updated = 0;
    const batch = db.batch();
    snap.docs.forEach((docRef) => {
        const u = docRef.data();
        const patch = {};
        // displayName
        const newDisplay = mapLabel(u.displayName);
        if (newDisplay !== u.displayName)
            patch.displayName = newDisplay;
        // userRole: Ναός -> Τμήμα
        if (u.userRole === "Ναός")
            patch.userRole = "Τμήμα";
        // team field
        if (u.team && teamMap.has(u.team))
            patch.team = teamMap.get(u.team);
        // memberOf / responsibleFor arrays
        const newMemberOf = mapArray(u.memberOf);
        if (JSON.stringify(newMemberOf) !== JSON.stringify(u.memberOf))
            patch.memberOf = newMemberOf;
        const newRespFor = mapArray(u.responsibleFor);
        if (JSON.stringify(newRespFor) !== JSON.stringify(u.responsibleFor))
            patch.responsibleFor = newRespFor;
        if (Object.keys(patch).length) {
            batch.update(docRef.ref, patch);
            updated++;
        }
    });
    if (updated)
        await batch.commit();
    console.log(`Users updated: ${updated}`);
}
async function migrateCollectionDisplayName(collection) {
    const db = (0, firebase_admin_1.default)();
    const snap = await db.collection(collection).get();
    let total = 0;
    let batch = db.batch();
    let ops = 0;
    for (const docRef of snap.docs) {
        const data = docRef.data();
        const mapped = mapLabel(data.userDisplayName);
        if (mapped !== data.userDisplayName) {
            batch.update(docRef.ref, { userDisplayName: mapped });
            ops++;
            total++;
            if (ops >= 400) { // keep large safety margin below 500 limit
                await batch.commit();
                batch = db.batch();
                ops = 0;
            }
        }
    }
    if (ops)
        await batch.commit();
    console.log(`${collection}: updated ${total}`);
}
async function main() {
    console.log("Starting migration: Rename teams and Ναός->Τμήμα labels");
    await migrateUsers();
    await migrateCollectionDisplayName(firebase_schema_1.FIREBASE_COLLECTIONS.PRINT_JOBS);
    await migrateCollectionDisplayName(firebase_schema_1.FIREBASE_COLLECTIONS.LAMINATION_JOBS);
    await migrateCollectionDisplayName(firebase_schema_1.FIREBASE_COLLECTIONS.INCOME);
    console.log("Migration complete.");
}
main().catch((e) => { console.error(e); process.exit(1); });
