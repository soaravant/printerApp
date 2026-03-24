"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = main;
/* eslint-disable no-console */
const dotenv_1 = require("dotenv");
const fs_1 = require("fs");
if ((0, fs_1.existsSync)(".env.local"))
    (0, dotenv_1.config)({ path: ".env.local" });
else
    (0, dotenv_1.config)();
const db_population_data_json_1 = __importDefault(require("../db-population-data.json"));
const firebase_admin_1 = __importDefault(require("./utils/firebase-admin"));
const firebase_schema_1 = require("../lib/firebase-schema");
const ts = (date) => date;
function now() {
    return new Date("2024-01-01T00:00:00.000Z");
}
function assertUniqueCodes(data) {
    const seen = new Map();
    const duplicates = [];
    for (const [kind, entries] of Object.entries({
        users: data.users,
        teams: data.teams,
        naos: data.naos,
        tomeis: data.tomeis || [],
    })) {
        for (const entry of entries) {
            if (seen.has(entry.code)) {
                duplicates.push(`code ${entry.code}: ${seen.get(entry.code)} vs ${kind}:${entry.name}`);
                continue;
            }
            seen.set(entry.code, `${kind}:${entry.name}`);
        }
    }
    if (duplicates.length > 0) {
        throw new Error(`Duplicate Excel codes detected:\n${duplicates.join("\n")}`);
    }
}
function buildAdminUser(createdAt) {
    return {
        uid: "admin-1",
        username: "admin",
        accessLevel: "Διαχειριστής",
        displayName: "Διαχειριστής",
        createdAt: ts(createdAt),
        userRole: "Άτομο",
        role: "admin",
        printDebt: 0,
        laminationDebt: 0,
        totalDebt: 0,
        lastPayment: null,
    };
}
function buildSeedUser(entry, userRole, createdAt, options) {
    return {
        uid: `seed-${entry.code}`,
        username: String(entry.code),
        accessLevel: (options === null || options === void 0 ? void 0 : options.accessLevel) || "Χρήστης",
        displayName: entry.name,
        createdAt: ts(createdAt),
        userRole,
        role: "user",
        printDebt: 0,
        laminationDebt: 0,
        totalDebt: 0,
        lastPayment: null,
        ...((options === null || options === void 0 ? void 0 : options.memberOf) && options.memberOf.length > 0 ? { memberOf: options.memberOf } : {}),
        ...((options === null || options === void 0 ? void 0 : options.responsibleFor) && options.responsibleFor.length > 0 ? { responsibleFor: options.responsibleFor } : {}),
        ...(userRole === "Ομάδα" ? { team: entry.name } : {}),
    };
}
function buildResponsibleAssignments(data) {
    const targets = [...data.teams, ...data.naos, ...(data.tomeis || [])];
    const baseCode = 9000;
    return targets.map((entry, index) => ({
        targetName: entry.name,
        username: String(baseCode + index),
        displayName: `Υπεύθυνος ${entry.name}`,
    }));
}
async function seedPriceTables(createdAt) {
    const db = (0, firebase_admin_1.default)();
    const priceTables = [
        {
            id: "printing",
            name: "Εκτυπώσεις",
            prices: {
                a4BW: 0.05,
                a4Color: 0.25,
                a3BW: 0.1,
                a3Color: 0.5,
                rizochartoA3: 0.2,
                rizochartoA4: 0.15,
                chartoniA3: 0.2,
                chartoniA4: 0.15,
                autokollito: 0.1,
            },
            isActive: true,
            createdAt: ts(createdAt),
            updatedAt: ts(createdAt),
        },
        {
            id: "lamination",
            name: "Πλαστικοποιήσεις",
            prices: {
                A3: 0.4,
                A4: 0.2,
                A5: 0.1,
                cards: 0.02,
                spiral: 0.15,
                colored_cardboard: 0.1,
                plastic_cover: 0.15,
            },
            isActive: true,
            createdAt: ts(createdAt),
            updatedAt: ts(createdAt),
        },
    ];
    const batch = db.batch();
    for (const table of priceTables) {
        batch.set(db.collection(firebase_schema_1.FIREBASE_COLLECTIONS.PRICE_TABLES).doc(table.id), table);
    }
    await batch.commit();
    console.log(`Seeded ${priceTables.length} price tables`);
}
async function seedUsers(createdAt) {
    const db = (0, firebase_admin_1.default)();
    const data = db_population_data_json_1.default;
    assertUniqueCodes(data);
    const teamNames = data.teams.map((entry) => entry.name);
    const tomeasNames = (data.tomeis || []).map((entry) => entry.name);
    const responsibleAssignments = buildResponsibleAssignments(data);
    const personUsers = data.users.map((entry, index) => buildSeedUser(entry, "Άτομο", createdAt, {
        memberOf: [
            ...(teamNames.length > 0 ? [teamNames[index % teamNames.length]] : []),
            ...(tomeasNames.length > 0 ? [tomeasNames[index % tomeasNames.length]] : []),
        ],
    }));
    const teamUsers = data.teams.map((entry) => buildSeedUser(entry, "Ομάδα", createdAt));
    const naosUsers = data.naos.map((entry) => buildSeedUser(entry, "Ναός", createdAt));
    const tomeisUsers = (data.tomeis || []).map((entry) => buildSeedUser(entry, "Τομέας", createdAt));
    const responsibleUsers = responsibleAssignments.map((assignment, index) => buildSeedUser({
        name: assignment.displayName,
        code: 9000 + index,
    }, "Άτομο", createdAt, {
        accessLevel: "Υπεύθυνος",
        responsibleFor: [assignment.targetName],
    }));
    const users = [
        buildAdminUser(createdAt),
        ...personUsers,
        ...teamUsers,
        ...naosUsers,
        ...tomeisUsers,
        ...responsibleUsers,
    ];
    const batch = db.batch();
    for (const user of users) {
        batch.set(db.collection(firebase_schema_1.FIREBASE_COLLECTIONS.USERS).doc(user.uid), user);
    }
    await batch.commit();
    console.log(`Seeded ${users.length} users (${data.users.length} persons, ${data.teams.length} teams, ${data.naos.length} naoi, ${(data.tomeis || []).length} tomeis, ${responsibleUsers.length} responsible users + admin)`);
}
async function seedBank(createdAt) {
    const db = (0, firebase_admin_1.default)();
    const bankDoc = {
        bankId: "main-bank",
        printBank: 0,
        laminationBank: 0,
        timestamp: ts(createdAt),
        lastUpdated: ts(createdAt),
    };
    await db.collection(firebase_schema_1.FIREBASE_COLLECTIONS.BANK).doc(bankDoc.bankId).set(bankDoc);
    console.log("Seeded main bank document");
}
async function main() {
    const createdAt = now();
    await seedPriceTables(createdAt);
    await seedUsers(createdAt);
    await seedBank(createdAt);
}
if (require.main === module) {
    main()
        .then(() => {
        console.log("Firestore seed completed");
        process.exit(0);
    })
        .catch((err) => {
        console.error(err);
        process.exit(1);
    });
}
