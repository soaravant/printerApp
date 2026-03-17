"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = main;
/* eslint-disable no-console */
const dotenv_1 = require("dotenv");
const fs_1 = require("fs");
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
const module_1 = __importDefault(require("module"));
if ((0, fs_1.existsSync)(".env.local"))
    (0, dotenv_1.config)({ path: ".env.local" });
else
    (0, dotenv_1.config)();
const clear_firestore_1 = require("./clear-firestore");
const seed_firestore_1 = require("./seed-firestore");
const firebase_admin_1 = __importDefault(require("./utils/firebase-admin"));
const firebase_schema_1 = require("../lib/firebase-schema");
const REPO_ROOT = path_1.default.resolve(__dirname, "../..");
const MANIFEST_PATH = path_1.default.join(REPO_ROOT, "generated-excel-import-pairs", "manifest.json");
const ADMIN_ACTOR = {
    uid: "admin-1",
    displayName: "Διαχειριστής",
};
let runExcelImport;
let recomputeUserDebt;
function roundMoney(value) {
    return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
}
function coerceToDate(value) {
    if (!value)
        return null;
    if (value instanceof Date)
        return Number.isNaN(value.getTime()) ? null : value;
    if (typeof value === "object" && typeof value.toDate === "function") {
        const next = value.toDate();
        return Number.isNaN(next.getTime()) ? null : next;
    }
    if (typeof value === "object") {
        const seconds = typeof value._seconds === "number"
            ? value._seconds
            : typeof value.seconds === "number"
                ? value.seconds
                : null;
        const nanoseconds = typeof value._nanoseconds === "number"
            ? value._nanoseconds
            : typeof value.nanoseconds === "number"
                ? value.nanoseconds
                : 0;
        if (seconds !== null) {
            return new Date(seconds * 1000 + Math.floor(nanoseconds / 1000000));
        }
    }
    const next = new Date(value);
    return Number.isNaN(next.getTime()) ? null : next;
}
function computeDebtsAndBankForUser(events, openingBalances) {
    const sortedEvents = [...events].sort((left, right) => left.timestamp.getTime() - right.timestamp.getTime());
    let printDebt = Math.max(0, roundMoney(Number((openingBalances === null || openingBalances === void 0 ? void 0 : openingBalances.printDebt) || 0)));
    let laminationDebt = Math.max(0, roundMoney(Number((openingBalances === null || openingBalances === void 0 ? void 0 : openingBalances.laminationDebt) || 0)));
    let totalCredit = roundMoney(Math.max(0, -Number((openingBalances === null || openingBalances === void 0 ? void 0 : openingBalances.printDebt) || 0)) + Math.max(0, -Number((openingBalances === null || openingBalances === void 0 ? void 0 : openingBalances.laminationDebt) || 0)));
    let printBank = 0;
    let laminationBank = 0;
    for (const event of sortedEvents) {
        if (event.kind === "print") {
            if (totalCredit > 0) {
                if (event.amount <= totalCredit) {
                    totalCredit = roundMoney(totalCredit - event.amount);
                }
                else {
                    const remainder = roundMoney(event.amount - totalCredit);
                    totalCredit = 0;
                    printDebt = roundMoney(printDebt + remainder);
                }
            }
            else {
                printDebt = roundMoney(printDebt + event.amount);
            }
            continue;
        }
        if (event.kind === "lamination") {
            if (totalCredit > 0) {
                if (event.amount <= totalCredit) {
                    totalCredit = roundMoney(totalCredit - event.amount);
                }
                else {
                    const remainder = roundMoney(event.amount - totalCredit);
                    totalCredit = 0;
                    laminationDebt = roundMoney(laminationDebt + remainder);
                }
            }
            else {
                laminationDebt = roundMoney(laminationDebt + event.amount);
            }
            continue;
        }
        let remaining = roundMoney(event.amount);
        if (laminationDebt > 0) {
            const laminationPayment = Math.min(remaining, laminationDebt);
            laminationDebt = roundMoney(laminationDebt - laminationPayment);
            remaining = roundMoney(remaining - laminationPayment);
            laminationBank = roundMoney(laminationBank + laminationPayment);
        }
        if (remaining > 0 && printDebt > 0) {
            const printPayment = Math.min(remaining, printDebt);
            printDebt = roundMoney(printDebt - printPayment);
            remaining = roundMoney(remaining - printPayment);
            printBank = roundMoney(printBank + printPayment);
        }
        if (remaining > 0) {
            totalCredit = roundMoney(totalCredit + remaining);
            printBank = roundMoney(printBank + remaining);
        }
    }
    return {
        bank: {
            printBank,
            laminationBank,
        },
    };
}
function installAliasResolver() {
    const originalResolveFilename = module_1.default._resolveFilename;
    if (installAliasResolver.installed)
        return;
    module_1.default._resolveFilename = function patchedResolveFilename(request, parent, isMain, options) {
        if (request.startsWith("@/")) {
            const compiledTarget = path_1.default.join(REPO_ROOT, ".scripts-dist", request.slice(2));
            return originalResolveFilename.call(this, compiledTarget, parent, isMain, options);
        }
        return originalResolveFilename.call(this, request, parent, isMain, options);
    };
    installAliasResolver.installed = true;
}
function loadServerModules() {
    installAliasResolver();
    ({ runExcelImport } = require("../lib/server/excel-import"));
    ({ recomputeUserDebt } = require("../lib/server/debt"));
}
function bufferToArrayBuffer(buffer) {
    return Uint8Array.from(buffer).buffer;
}
function periodSettlementTimestamp(periodKey) {
    const [yearPart, monthPart] = periodKey.split("-");
    const year = Number(yearPart);
    const month = Number(monthPart);
    if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
        return new Date();
    }
    return new Date(Date.UTC(year, month, 0, 12, 0, 0));
}
function getOpeningOutstandingTotal(user) {
    const openingPrintDebt = roundMoney(Number(user.openingPrintDebt || 0));
    const openingLaminationDebt = roundMoney(Number(user.openingLaminationDebt || 0));
    const totalCredit = roundMoney(Math.max(0, -openingPrintDebt) + Math.max(0, -openingLaminationDebt));
    return roundMoney(Math.max(0, openingPrintDebt) + Math.max(0, openingLaminationDebt) - totalCredit);
}
function getIncomeCadenceMonths(user) {
    return user.userRole === "Άτομο" ? 3 : 4;
}
function getRollingIncomeRatio(user) {
    switch (user.userRole) {
        case "Άτομο":
            return 0.52;
        case "Ομάδα":
            return 0.48;
        case "Ναός":
            return 0.44;
        case "Τομέας":
            return 0.42;
        default:
            return 0.45;
    }
}
function buildSettlementPayment(outstanding, userIndex, periodIndex, isLastPeriod) {
    const residualPattern = isLastPeriod ? [0, 0.25, 0.5, 0.75] : [0, 0.4, 0.8, 1.2];
    const residual = residualPattern[(userIndex + periodIndex) % residualPattern.length];
    if (outstanding <= residual + 2) {
        return roundMoney(outstanding);
    }
    return roundMoney(Math.max(0, outstanding - residual));
}
async function generateExcelPairs() {
    const result = (0, child_process_1.spawnSync)(process.execPath, [path_1.default.join(REPO_ROOT, "scripts", "generate-excel-import-test-pairs.js")], {
        cwd: REPO_ROOT,
        stdio: "inherit",
    });
    if (result.status !== 0) {
        throw new Error("Failed to generate Excel import pairs.");
    }
}
function loadManifest() {
    const raw = (0, fs_1.readFileSync)(MANIFEST_PATH, "utf8");
    return JSON.parse(raw);
}
async function fetchAllUsers() {
    const db = (0, firebase_admin_1.default)();
    const snap = await db.collection(firebase_schema_1.FIREBASE_COLLECTIONS.USERS).get();
    return snap.docs.map((doc) => doc.data());
}
async function createDummyIncomeHistory(periodKeys) {
    const db = (0, firebase_admin_1.default)();
    const [users, printSnap, laminationSnap] = await Promise.all([
        fetchAllUsers(),
        db.collection(firebase_schema_1.FIREBASE_COLLECTIONS.PRINT_JOBS).get(),
        db.collection(firebase_schema_1.FIREBASE_COLLECTIONS.LAMINATION_JOBS).get(),
    ]);
    const printJobs = printSnap.docs.map((doc) => doc.data());
    const laminationJobs = laminationSnap.docs.map((doc) => doc.data());
    const periodSet = new Set(periodKeys);
    const chargesByUserAndPeriod = new Map();
    const addCharge = (uid, periodKey, amount) => {
        var _a;
        if (!periodSet.has(periodKey) || amount <= 0)
            return;
        const userCharges = (_a = chargesByUserAndPeriod.get(uid)) !== null && _a !== void 0 ? _a : new Map();
        userCharges.set(periodKey, roundMoney((userCharges.get(periodKey) || 0) + amount));
        chargesByUserAndPeriod.set(uid, userCharges);
    };
    for (const job of printJobs) {
        const timestamp = coerceToDate(job.timestamp);
        if (!timestamp)
            continue;
        addCharge(job.uid, timestamp.toISOString().slice(0, 7), Number(job.totalCost || 0));
    }
    for (const job of laminationJobs) {
        const timestamp = coerceToDate(job.timestamp);
        if (!timestamp)
            continue;
        addCharge(job.uid, timestamp.toISOString().slice(0, 7), Number(job.totalCost || 0));
    }
    const eligibleUsers = users
        .filter((user) => user.accessLevel === "Χρήστης")
        .sort((left, right) => left.username.localeCompare(right.username));
    const incomesToCreate = [];
    eligibleUsers.forEach((user, userIndex) => {
        let runningOutstanding = getOpeningOutstandingTotal(user);
        const cadence = getIncomeCadenceMonths(user);
        const cadenceOffset = userIndex % cadence;
        periodKeys.forEach((periodKey, periodIndex) => {
            var _a;
            const periodCharge = roundMoney(((_a = chargesByUserAndPeriod.get(user.uid)) === null || _a === void 0 ? void 0 : _a.get(periodKey)) || 0);
            runningOutstanding = roundMoney(runningOutstanding + periodCharge);
            if (runningOutstanding <= 0.01)
                return;
            const isLastPeriod = periodIndex === periodKeys.length - 1;
            const shouldSettle = isLastPeriod || (periodIndex + cadenceOffset + 1) % cadence === 0;
            const variableRatio = getRollingIncomeRatio(user) + (((userIndex + periodIndex) % 2) * 0.06);
            const paymentAmount = shouldSettle
                ? buildSettlementPayment(runningOutstanding, userIndex, periodIndex, isLastPeriod)
                : roundMoney(Math.min(runningOutstanding, Math.max(8, runningOutstanding * variableRatio, periodCharge * 0.95)));
            if (paymentAmount < 4)
                return;
            const timestamp = periodSettlementTimestamp(periodKey);
            const splitPayment = shouldSettle && paymentAmount >= 24;
            const paymentChunks = splitPayment
                ? [roundMoney(paymentAmount * 0.45), roundMoney(paymentAmount - roundMoney(paymentAmount * 0.45))]
                : [paymentAmount];
            paymentChunks.forEach((amount, paymentIndex) => {
                if (amount <= 0)
                    return;
                incomesToCreate.push({
                    incomeId: `dummy-income-${periodKey}-${user.uid}-${paymentIndex + 1}`,
                    uid: user.uid,
                    username: user.username,
                    userDisplayName: user.displayName,
                    amount,
                    timestamp,
                    createdAt: new Date(),
                });
            });
            runningOutstanding = roundMoney(runningOutstanding - paymentAmount);
        });
    });
    const batchSize = 400;
    for (let index = 0; index < incomesToCreate.length; index += batchSize) {
        const batch = db.batch();
        const chunk = incomesToCreate.slice(index, index + batchSize);
        chunk.forEach((income) => {
            batch.set(db.collection(firebase_schema_1.FIREBASE_COLLECTIONS.INCOME).doc(income.incomeId), income);
        });
        await batch.commit();
    }
    console.log(`Created ${incomesToCreate.length} income rows across ${eligibleUsers.length} users`);
}
async function recomputeAllUsersAndBank() {
    const db = (0, firebase_admin_1.default)();
    const [usersSnap, printSnap, laminationSnap, incomeSnap] = await Promise.all([
        db.collection(firebase_schema_1.FIREBASE_COLLECTIONS.USERS).get(),
        db.collection(firebase_schema_1.FIREBASE_COLLECTIONS.PRINT_JOBS).get(),
        db.collection(firebase_schema_1.FIREBASE_COLLECTIONS.LAMINATION_JOBS).get(),
        db.collection(firebase_schema_1.FIREBASE_COLLECTIONS.INCOME).get(),
    ]);
    const users = usersSnap.docs.map((doc) => doc.data());
    for (const user of users) {
        await recomputeUserDebt(user.uid);
    }
    const printJobs = printSnap.docs.map((doc) => doc.data());
    const laminationJobs = laminationSnap.docs.map((doc) => doc.data());
    const incomes = incomeSnap.docs.map((doc) => doc.data());
    let printBank = 0;
    let laminationBank = 0;
    for (const user of users) {
        const events = [];
        const openingPrintDebt = Number(user.openingPrintDebt || 0);
        const openingLaminationDebt = Number(user.openingLaminationDebt || 0);
        printJobs
            .filter((job) => job.uid === user.uid)
            .forEach((job) => {
            const timestamp = coerceToDate(job.timestamp);
            if (!timestamp)
                return;
            events.push({ kind: "print", amount: Number(job.totalCost || 0), timestamp });
        });
        laminationJobs
            .filter((job) => job.uid === user.uid)
            .forEach((job) => {
            const timestamp = coerceToDate(job.timestamp);
            if (!timestamp)
                return;
            events.push({ kind: "lamination", amount: Number(job.totalCost || 0), timestamp });
        });
        incomes
            .filter((income) => income.uid === user.uid)
            .forEach((income) => {
            const timestamp = coerceToDate(income.timestamp);
            if (!timestamp)
                return;
            events.push({ kind: "income", amount: Number(income.amount || 0), timestamp });
        });
        const { bank } = computeDebtsAndBankForUser(events, {
            printDebt: openingPrintDebt,
            laminationDebt: openingLaminationDebt,
        });
        printBank += bank.printBank;
        laminationBank += bank.laminationBank;
    }
    const bankDoc = {
        bankId: "main-bank",
        printBank,
        laminationBank,
        timestamp: new Date(),
        lastUpdated: new Date(),
    };
    await db.collection(firebase_schema_1.FIREBASE_COLLECTIONS.BANK).doc(bankDoc.bankId).set(bankDoc);
}
async function main() {
    loadServerModules();
    console.log("Generating monthly Excel pairs...");
    await generateExcelPairs();
    console.log("Clearing Firestore...");
    await (0, clear_firestore_1.main)();
    console.log("Seeding base Firestore documents...");
    await (0, seed_firestore_1.main)();
    const manifest = loadManifest();
    for (const [index, pair] of manifest.pairs.entries()) {
        console.log(`Importing ${pair.periodKey} (${index + 1}/${manifest.pairs.length})...`);
        const photoBuffer = (0, fs_1.readFileSync)(pair.photoPath);
        const laminationBuffer = (0, fs_1.readFileSync)(pair.laminationPath);
        await runExcelImport({
            photoBuffer: bufferToArrayBuffer(photoBuffer),
            laminationBuffer: bufferToArrayBuffer(laminationBuffer),
            photoFileName: path_1.default.basename(pair.photoPath),
            laminationFileName: path_1.default.basename(pair.laminationPath),
            allowCreateUsers: true,
            actor: ADMIN_ACTOR,
        });
    }
    console.log("Creating denser income history...");
    await createDummyIncomeHistory(manifest.pairs.map((pair) => pair.periodKey));
    console.log("Recomputing balances and bank totals...");
    await recomputeAllUsersAndBank();
}
if (require.main === module) {
    main()
        .then(() => {
        console.log("Dummy history bootstrap completed");
        process.exit(0);
    })
        .catch((error) => {
        console.error(error);
        process.exit(1);
    });
}
