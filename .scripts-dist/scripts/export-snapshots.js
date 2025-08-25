"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const firebase_admin_1 = __importDefault(require("./utils/firebase-admin"));
const OUTPUT_DIR = path_1.default.resolve(process.cwd(), "public", "snapshots");
const PAGE_SIZE = Number(process.env.EXPORT_PAGE_SIZE || 2000);
function toIso(value) {
    try {
        if (!value)
            return null;
        if (typeof value.toDate === "function")
            return value.toDate().toISOString();
        const d = new Date(value);
        if (Number.isFinite(d.getTime()))
            return d.toISOString();
        return null;
    }
    catch {
        return null;
    }
}
async function fetchAllByTimestamp(collection) {
    const db = (0, firebase_admin_1.default)();
    const items = [];
    let last = undefined;
    while (true) {
        const base = db.collection(collection).orderBy("timestamp", "desc").limit(PAGE_SIZE);
        const q = last ? base.startAfter(last) : base;
        const snap = await q.get();
        if (snap.empty)
            break;
        for (const doc of snap.docs) {
            const data = doc.data();
            if (data && data.timestamp) {
                const iso = toIso(data.timestamp);
                if (iso)
                    data.timestamp = iso;
            }
            items.push(data);
        }
        const lastDoc = snap.docs[snap.docs.length - 1];
        last = lastDoc === null || lastDoc === void 0 ? void 0 : lastDoc.get("timestamp");
        if (!last || snap.size < PAGE_SIZE)
            break;
    }
    return items;
}
function computeLastUpdated(items) {
    let maxMs = 0;
    for (const it of items) {
        const v = it === null || it === void 0 ? void 0 : it.timestamp;
        if (!v)
            continue;
        const ms = typeof v === "string" ? Date.parse(v) : new Date(v).getTime();
        if (Number.isFinite(ms) && ms > maxMs)
            maxMs = ms;
    }
    return maxMs || Date.now();
}
async function exportCollection(collection, outFile) {
    const items = await fetchAllByTimestamp(collection);
    const snapshot = { lastUpdated: computeLastUpdated(items), items };
    (0, fs_1.writeFileSync)(outFile, JSON.stringify(snapshot));
    console.log(`Wrote ${items.length} ${collection} → ${outFile}`);
}
async function main() {
    if (!(0, fs_1.existsSync)(OUTPUT_DIR))
        (0, fs_1.mkdirSync)(OUTPUT_DIR, { recursive: true });
    await exportCollection("printJobs", path_1.default.join(OUTPUT_DIR, "printJobs-all.json"));
    await exportCollection("laminationJobs", path_1.default.join(OUTPUT_DIR, "laminationJobs-all.json"));
    await exportCollection("income", path_1.default.join(OUTPUT_DIR, "income-all.json"));
}
main().catch((e) => {
    console.error("export-snapshots failed", e);
    process.exit(1);
});
