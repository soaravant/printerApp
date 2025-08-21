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
/**
 * Backfills deviceIP on printJobs based on a provided mapping from deviceName to IP or IP to deviceName.
 * Provide JSON via env BACKFILL_IP_MAP = { "192.168.3.41":"Canon B/W", ... }
 * or BACKFILL_NAME_MAP = { "Canon B/W":"192.168.3.41", ... }
 */
function parseMap(envVar) {
    if (!envVar)
        return {};
    try {
        return JSON.parse(envVar);
    }
    catch {
        return {};
    }
}
async function main() {
    const db = (0, firebase_admin_1.default)();
    const ipToName = parseMap(process.env.BACKFILL_IP_MAP);
    const nameToIp = parseMap(process.env.BACKFILL_NAME_MAP);
    const defaultName = process.env.BACKFILL_DEFAULT_NAME;
    const defaultIp = process.env.BACKFILL_DEFAULT_IP;
    const FORCE = String(process.env.BACKFILL_FORCE || "false").toLowerCase() === "true";
    // Normalize name map (case-insensitive, trimmed)
    const norm = (s) => (s || "").trim().toLowerCase();
    const nameToIpNorm = {};
    for (const [k, v] of Object.entries(nameToIp))
        nameToIpNorm[norm(k)] = v;
    const snap = await db.collection(firebase_schema_1.FIREBASE_COLLECTIONS.PRINT_JOBS).get();
    let updates = 0;
    let batch = db.batch();
    let inBatch = 0;
    for (const doc of snap.docs) {
        const j = doc.data();
        let need = false;
        let deviceIP = j.deviceIP || '';
        let deviceName = j.deviceName || '';
        const mappedIp = deviceName ? nameToIp[deviceName] || nameToIpNorm[norm(deviceName)] : undefined;
        if (mappedIp && (FORCE ? deviceIP !== mappedIp : !deviceIP)) {
            deviceIP = mappedIp;
            need = true;
        }
        if (!deviceName && deviceIP && ipToName[deviceIP]) {
            deviceName = ipToName[deviceIP];
            need = true;
        }
        if (!deviceName && defaultName) {
            deviceName = defaultName;
            need = true;
        }
        if (!deviceIP && defaultIp) {
            deviceIP = defaultIp;
            need = true;
        }
        if (need) {
            batch.update(doc.ref, { deviceIP, deviceName });
            updates++;
            inBatch++;
            if (inBatch >= 400) {
                await batch.commit();
                batch = db.batch();
                inBatch = 0;
            }
        }
    }
    if (inBatch > 0)
        await batch.commit();
    console.log(`Backfill complete. Updated ${updates} documents.`);
}
if (require.main === module) {
    main().catch((e) => {
        console.error(e);
        process.exit(1);
    });
}
