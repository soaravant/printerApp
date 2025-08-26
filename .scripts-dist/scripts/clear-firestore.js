"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = void 0;
/* eslint-disable no-console */
const dotenv_1 = require("dotenv");
const fs_1 = require("fs");
// Prefer .env.local if present, otherwise fallback to .env
if ((0, fs_1.existsSync)('.env.local'))
    (0, dotenv_1.config)({ path: '.env.local' });
else
    (0, dotenv_1.config)();
const firebase_admin_1 = __importDefault(require("./utils/firebase-admin"));
const firebase_schema_1 = require("../lib/firebase-schema");
const COLLECTIONS_IN_SAFE_ORDER = [
    firebase_schema_1.FIREBASE_COLLECTIONS.PRINT_JOBS,
    firebase_schema_1.FIREBASE_COLLECTIONS.LAMINATION_JOBS,
    firebase_schema_1.FIREBASE_COLLECTIONS.INCOME,
    firebase_schema_1.FIREBASE_COLLECTIONS.TRANSACTIONS,
    firebase_schema_1.FIREBASE_COLLECTIONS.BILLING,
    firebase_schema_1.FIREBASE_COLLECTIONS.PRICE_TABLES,
    firebase_schema_1.FIREBASE_COLLECTIONS.SETTINGS,
    firebase_schema_1.FIREBASE_COLLECTIONS.USERS,
    firebase_schema_1.FIREBASE_COLLECTIONS.BANK,
];
async function deleteCollection(collectionPath, batchSize = 300) {
    const db = (0, firebase_admin_1.default)();
    let deleted = 0;
    while (true) {
        const snapshot = await db.collection(collectionPath).limit(batchSize).get();
        if (snapshot.empty)
            break;
        const batch = db.batch();
        snapshot.docs.forEach((doc) => batch.delete(doc.ref));
        await batch.commit();
        deleted += snapshot.size;
        console.log(`Deleted ${snapshot.size} from ${collectionPath} (total ${deleted})`);
        if (snapshot.size < batchSize)
            break;
    }
}
async function main() {
    for (const col of COLLECTIONS_IN_SAFE_ORDER) {
        console.log(`Clearing ${col}...`);
        await deleteCollection(col);
    }
}
exports.main = main;
if (require.main === module) {
    main()
        .then(() => {
        console.log("Firestore clear completed");
        process.exit(0);
    })
        .catch((err) => {
        console.error(err);
        process.exit(1);
    });
}
