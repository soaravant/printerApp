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
const utils_1 = require("../lib/utils");
// Utilities
const now = () => new Date();
const ts = (d) => d;
const asDate = (v) => (v && typeof v.toDate === "function" ? v.toDate() : new Date(v));
async function seedPriceTables() {
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
            createdAt: ts(now()),
            updatedAt: ts(now()),
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
            createdAt: ts(now()),
            updatedAt: ts(now()),
        },
    ];
    const batch = db.batch();
    for (const table of priceTables) {
        const ref = db.collection(firebase_schema_1.FIREBASE_COLLECTIONS.PRICE_TABLES).doc(table.id);
        batch.set(ref, table);
    }
    await batch.commit();
    console.log(`Seeded ${priceTables.length} price tables`);
}
async function seedUsers() {
    const db = (0, firebase_admin_1.default)();
    const teams = [
        "Ενωμένοι",
        "Σποριάδες",
        "Καρποφόροι",
        "Ολόφωτοι",
        "Νικητές",
        "Νικηφόροι",
        "Φλόγα",
        "Σύμψυχοι",
    ];
    const users = [];
    // Admin
    users.push({
        uid: "admin-1",
        username: "admin",
        accessLevel: "Διαχειριστής",
        displayName: "Διαχειριστής",
        createdAt: ts(new Date("2024-01-01")),
        userRole: "Άτομο",
        team: "Ενωμένοι",
        role: "admin",
    });
    // Create Υπεύθυνος + 2 users for each team
    const userTuples = [
        [teams[0], 401, 501],
        [teams[1], 402, 503],
        [teams[2], 403, 505],
        [teams[3], 404, 507],
        [teams[4], 405, 509],
        [teams[5], 406, 511],
        [teams[6], 407, 513],
        [teams[7], 408, 515],
    ];
    for (const [team, responsible, firstUser] of userTuples) {
        users.push({
            uid: `user-${responsible}`,
            username: String(responsible),
            accessLevel: "Υπεύθυνος",
            displayName: `Υπεύθυνος ${responsible}`,
            createdAt: ts(now()),
            userRole: "Άτομο",
            team,
            memberOf: [team, `Ναός ${responsible - 400}`, `Τομέας ${responsible - 400}`],
            responsibleFor: [team, `Ναός ${responsible - 400}`, `Τομέας ${responsible - 400}`],
            role: "user",
        });
        users.push({
            uid: `user-${firstUser}`,
            username: String(firstUser),
            accessLevel: "Χρήστης",
            displayName: `Χρήστης ${firstUser}`,
            createdAt: ts(now()),
            userRole: "Άτομο",
            team,
            memberOf: [team, `Ναός ${responsible - 400}`, `Τομέας ${responsible - 400}`],
            role: "user",
        });
        users.push({
            uid: `user-${firstUser + 1}`,
            username: String(firstUser + 1),
            accessLevel: "Χρήστης",
            displayName: `Χρήστης ${firstUser + 1}`,
            createdAt: ts(now()),
            userRole: "Άτομο",
            team,
            memberOf: [team, `Ναός ${responsible - 400}`, `Τομέας ${responsible - 400}`],
            role: "user",
        });
    }
    // Add group accounts (Ομάδα), Ναός, Τομέας similar to dummy data
    const groupDefs = [
        ["team-enwmenoi", 600, "Ενωμένοι", "Ομάδα"],
        ["team-sporiades", 601, "Σποριάδες", "Ομάδα"],
        ["team-karpoforoi", 602, "Καρποφόροι", "Ομάδα"],
        ["team-olofwtoi", 603, "Ολόφωτοι", "Ομάδα"],
        ["team-nikhtes", 604, "Νικητές", "Ομάδα"],
        ["team-nikhforoi", 605, "Νικηφόροι", "Ομάδα"],
        ["team-floga", 606, "Φλόγα", "Ομάδα"],
        ["team-sympsyxoi", 607, "Σύμψυχοι", "Ομάδα"],
        ["naos-1", 700, "Ναός 1", "Ναός"],
        ["naos-2", 701, "Ναός 2", "Ναός"],
        ["naos-3", 703, "Ναός 3", "Ναός"],
        ["naos-4", 704, "Ναός 4", "Ναός"],
        ["naos-5", 705, "Ναός 5", "Ναός"],
        ["naos-6", 706, "Ναός 6", "Ναός"],
        ["naos-7", 707, "Ναός 7", "Ναός"],
        ["naos-8", 708, "Ναός 8", "Ναός"],
        ["tomeas-1", 800, "Τομέας 1", "Τομέας"],
        ["tomeas-2", 801, "Τομέας 2", "Τομέας"],
        ["tomeas-3", 802, "Τομέας 3", "Τομέας"],
        ["tomeas-4", 803, "Τομέας 4", "Τομέας"],
        ["tomeas-5", 804, "Τομέας 5", "Τομέας"],
        ["tomeas-6", 805, "Τομέας 6", "Τομέας"],
        ["tomeas-7", 806, "Τομέας 7", "Τομέας"],
        ["tomeas-8", 807, "Τομέας 8", "Τομέας"],
    ];
    for (const [uid, code, name, role] of groupDefs) {
        users.push({
            uid,
            username: String(code),
            accessLevel: "Χρήστης",
            displayName: name,
            createdAt: ts(now()),
            userRole: role,
            role: "user",
        });
    }
    const batch = db.batch();
    for (const u of users) {
        const ref = db.collection(firebase_schema_1.FIREBASE_COLLECTIONS.USERS).doc(u.uid);
        batch.set(ref, u);
    }
    await batch.commit();
    console.log(`Seeded ${users.length} users`);
}
function randomChoice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}
async function seedJobs() {
    const db = (0, firebase_admin_1.default)();
    // Fetch prices
    const printingSnap = await db
        .collection(firebase_schema_1.FIREBASE_COLLECTIONS.PRICE_TABLES)
        .doc("printing")
        .get();
    const printing = printingSnap.data();
    if (!printing)
        throw new Error("Missing printing price table");
    const lamSnap = await db
        .collection(firebase_schema_1.FIREBASE_COLLECTIONS.PRICE_TABLES)
        .doc("lamination")
        .get();
    const lamination = lamSnap.data();
    if (!lamination)
        throw new Error("Missing lamination price table");
    // Get non-admin users
    const usersSnap = await db.collection(firebase_schema_1.FIREBASE_COLLECTIONS.USERS).get();
    const users = usersSnap.docs
        .map((d) => d.data())
        .filter((u) => u.accessLevel !== "Διαχειριστής");
    const printerNames = ["Canon Color", "Canon B/W", "Brother", "Κυδωνιών"];
    const printTypesAll = [
        "A4BW",
        "A4Color",
        "A3BW",
        "A3Color",
        "RizochartoA3",
        "RizochartoA4",
        "ChartoniA3",
        "ChartoniA4",
        "Autokollito",
    ];
    const batch = db.batch();
    let created = 0;
    const nowDate = new Date();
    for (let monthOffset = 0; monthOffset < 6; monthOffset++) {
        for (const user of users) {
            const jobsCount = Math.floor(Math.random() * 6) + 5; // 5-10 sessions/month
            for (let i = 0; i < jobsCount; i++) {
                const jobDate = new Date(nowDate.getFullYear(), nowDate.getMonth() - monthOffset, Math.floor(Math.random() * 28) + 1);
                const deviceName = randomChoice(printerNames);
                const allowedTypes = deviceName === "Canon Color"
                    ? printTypesAll
                    : ["A4BW"];
                const numJobs = Math.floor(Math.random() * 3) + 1;
                for (let j = 0; j < numJobs; j++) {
                    const type = randomChoice(allowedTypes);
                    const quantity = Math.floor(Math.random() * 8) + 1;
                    const pricePerUnit = printing.prices[type === "RizochartoA3"
                        ? "rizochartoA3"
                        : type === "RizochartoA4"
                            ? "rizochartoA4"
                            : type === "ChartoniA3"
                                ? "chartoniA3"
                                : type === "ChartoniA4"
                                    ? "chartoniA4"
                                    : type === "Autokollito"
                                        ? "autokollito"
                                        : type.charAt(0).toLowerCase() + type.slice(1)];
                    const doc = {
                        jobId: `print-${user.uid}-${monthOffset}-${i}-${j}`,
                        uid: user.uid,
                        username: user.username,
                        userDisplayName: user.displayName,
                        type,
                        quantity,
                        pricePerUnit,
                        totalCost: (0, utils_1.multiplyMoney)(pricePerUnit, quantity),
                        deviceIP: `192.168.1.${100 + Math.floor(Math.random() * 3)}`,
                        deviceName,
                        timestamp: ts(jobDate),
                        status: "completed",
                    };
                    const ref = db
                        .collection(firebase_schema_1.FIREBASE_COLLECTIONS.PRINT_JOBS)
                        .doc(doc.jobId);
                    batch.set(ref, doc);
                    created++;
                }
            }
        }
    }
    // Lamination jobs
    const lamTypes = [
        "A3",
        "A4",
        "A5",
        "cards",
        "spiral",
        "colored_cardboard",
        "plastic_cover",
    ];
    for (let monthOffset = 0; monthOffset < 6; monthOffset++) {
        for (const user of users) {
            const jobsCount = Math.floor(Math.random() * 4) + 3; // 3-6/month
            for (let i = 0; i < jobsCount; i++) {
                const jobDate = new Date(nowDate.getFullYear(), nowDate.getMonth() - monthOffset, Math.floor(Math.random() * 28) + 1);
                const type = randomChoice(lamTypes);
                const quantity = Math.floor(Math.random() * 3) + 1;
                const pricePerUnit = lamination.prices[type];
                const doc = {
                    jobId: `lamination-${user.uid}-${monthOffset}-${i}`,
                    uid: user.uid,
                    username: user.username,
                    userDisplayName: user.displayName,
                    type,
                    quantity,
                    pricePerUnit,
                    totalCost: (0, utils_1.multiplyMoney)(pricePerUnit, quantity),
                    timestamp: ts(jobDate),
                    status: "completed",
                };
                if (Math.random() > 0.7) {
                    doc.notes = "Επείγον";
                }
                const ref = db
                    .collection(firebase_schema_1.FIREBASE_COLLECTIONS.LAMINATION_JOBS)
                    .doc(doc.jobId);
                batch.set(ref, doc);
                created++;
            }
        }
    }
    await batch.commit();
    console.log(`Seeded ${created} jobs (print + lamination)`);
}
function generateIncomePattern(user, totalDebt, billingDate) {
    const income = [];
    const userRole = user.userRole;
    const isHighDebt = totalDebt > 50;
    const isLowDebt = totalDebt < 10;
    let incomeProbability = 0.8;
    let incomeDelay = 15;
    switch (userRole) {
        case "Άτομο":
            incomeProbability = 0.9;
            incomeDelay = 10;
            break;
        case "Ομάδα":
            incomeProbability = 0.7;
            incomeDelay = 20;
            break;
        case "Ναός":
            incomeProbability = 0.6;
            incomeDelay = 25;
            break;
        case "Τομέας":
            incomeProbability = 0.5;
            incomeDelay = 30;
            break;
    }
    if (isHighDebt) {
        incomeProbability *= 0.8;
        incomeDelay += 10;
    }
    else if (isLowDebt) {
        incomeProbability *= 1.2;
        incomeDelay -= 5;
    }
    if (Math.random() < incomeProbability) {
        if (Math.random() < 0.7) {
            const incomeDate = new Date(billingDate.getTime() + (incomeDelay + Math.random() * 10) * 24 * 60 * 60 * 1000);
            income.push({ amount: (0, utils_1.roundMoney)(totalDebt), timestamp: incomeDate });
        }
        else {
            const numPayments = Math.floor(Math.random() * 3) + 2;
            let remainingDebt = totalDebt;
            for (let i = 0; i < numPayments && remainingDebt > 0; i++) {
                const incomeAmount = i === numPayments - 1 ? remainingDebt : (0, utils_1.roundMoney)(remainingDebt * (0.3 + Math.random() * 0.4));
                const incomeDate = new Date(billingDate.getTime() + (incomeDelay + i * 7 + Math.random() * 5) * 24 * 60 * 60 * 1000);
                income.push({ amount: (0, utils_1.roundMoney)(incomeAmount), timestamp: incomeDate });
                remainingDebt = (0, utils_1.roundMoney)(remainingDebt - incomeAmount);
            }
        }
    }
    else {
        if (Math.random() < 0.3) {
            const lateIncomeDate = new Date(billingDate.getTime() + (60 + Math.random() * 30) * 24 * 60 * 60 * 1000);
            const lateIncomeAmount = (0, utils_1.roundMoney)(totalDebt * (0.5 + Math.random() * 0.3));
            income.push({ amount: lateIncomeAmount, timestamp: lateIncomeDate });
        }
    }
    income.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    return income;
}
function computeDebtsAndBankForUser(events) {
    events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    let printDebt = 0;
    let laminationDebt = 0;
    let totalCredit = 0;
    let printBank = 0;
    let laminationBank = 0;
    for (const e of events) {
        if (e.kind === "print") {
            if (totalCredit > 0) {
                if (e.amount <= totalCredit) {
                    totalCredit = (0, utils_1.roundMoney)(totalCredit - e.amount);
                }
                else {
                    const remainder = (0, utils_1.roundMoney)(e.amount - totalCredit);
                    totalCredit = 0;
                    printDebt = (0, utils_1.roundMoney)(printDebt + remainder);
                }
            }
            else {
                printDebt = (0, utils_1.roundMoney)(printDebt + e.amount);
            }
        }
        else if (e.kind === "lamination") {
            if (totalCredit > 0) {
                if (e.amount <= totalCredit) {
                    totalCredit = (0, utils_1.roundMoney)(totalCredit - e.amount);
                }
                else {
                    const remainder = (0, utils_1.roundMoney)(e.amount - totalCredit);
                    totalCredit = 0;
                    laminationDebt = (0, utils_1.roundMoney)(laminationDebt + remainder);
                }
            }
            else {
                laminationDebt = (0, utils_1.roundMoney)(laminationDebt + e.amount);
            }
        }
        else {
            // income: pay lamination first, then print; leftover increases credit
            let remaining = e.amount;
            if (laminationDebt > 0) {
                const payL = Math.min(remaining, laminationDebt);
                laminationDebt = (0, utils_1.roundMoney)(laminationDebt - payL);
                remaining = (0, utils_1.roundMoney)(remaining - payL);
                laminationBank = (0, utils_1.roundMoney)(laminationBank + payL);
            }
            if (remaining > 0 && printDebt > 0) {
                const payP = Math.min(remaining, printDebt);
                printDebt = (0, utils_1.roundMoney)(printDebt - payP);
                remaining = (0, utils_1.roundMoney)(remaining - payP);
                printBank = (0, utils_1.roundMoney)(printBank + payP);
            }
            if (remaining > 0) {
                // credit goes to totalCredit; and business rule allocates remaining to print bank
                totalCredit = (0, utils_1.roundMoney)(totalCredit + remaining);
                printBank = (0, utils_1.roundMoney)(printBank + remaining);
                remaining = 0;
            }
        }
    }
    const totalDebt = (0, utils_1.roundMoney)(printDebt + laminationDebt - totalCredit);
    return { debts: { printDebt, laminationDebt, totalDebt }, bank: { printBank, laminationBank } };
}
async function seedIncomeAndDebts() {
    const db = (0, firebase_admin_1.default)();
    // Load users
    const usersSnap = await db.collection(firebase_schema_1.FIREBASE_COLLECTIONS.USERS).get();
    const users = usersSnap.docs.map((d) => d.data());
    // Load jobs
    const printSnap = await db.collection(firebase_schema_1.FIREBASE_COLLECTIONS.PRINT_JOBS).get();
    const lamSnap = await db.collection(firebase_schema_1.FIREBASE_COLLECTIONS.LAMINATION_JOBS).get();
    const printJobs = printSnap.docs.map((d) => d.data());
    const laminationJobs = lamSnap.docs.map((d) => d.data());
    // Group jobs by user and by period (YYYY-MM)
    const jobsByUserByPeriod = new Map();
    const toPeriod = (date) => asDate(date).toISOString().slice(0, 7);
    for (const pj of printJobs) {
        const period = toPeriod(pj.timestamp);
        let perUser = jobsByUserByPeriod.get(pj.uid);
        if (!perUser) {
            perUser = new Map();
            jobsByUserByPeriod.set(pj.uid, perUser);
        }
        const agg = perUser.get(period) || { printTotal: 0, laminationTotal: 0 };
        agg.printTotal = (0, utils_1.roundMoney)(agg.printTotal + pj.totalCost);
        perUser.set(period, agg);
    }
    for (const lj of laminationJobs) {
        const period = toPeriod(lj.timestamp);
        let perUser = jobsByUserByPeriod.get(lj.uid);
        if (!perUser) {
            perUser = new Map();
            jobsByUserByPeriod.set(lj.uid, perUser);
        }
        const agg = perUser.get(period) || { printTotal: 0, laminationTotal: 0 };
        agg.laminationTotal = (0, utils_1.roundMoney)(agg.laminationTotal + lj.totalCost);
        perUser.set(period, agg);
    }
    // Generate incomes and compute debts/bank
    const incomeBatch = db.batch();
    const userUpdateBatch = db.batch();
    let incomesCreated = 0;
    let bankTotals = { printBank: 0, laminationBank: 0 };
    for (const user of users) {
        const perPeriod = jobsByUserByPeriod.get(user.uid);
        const incomesForUser = [];
        if (perPeriod && perPeriod.size > 0) {
            for (const [period, totals] of perPeriod.entries()) {
                const [year, month] = period.split("-").map((n) => parseInt(n, 10));
                const billingDate = new Date(year, month - 1, 1);
                const totalDebtForPeriod = (0, utils_1.roundMoney)((totals.printTotal || 0) + (totals.laminationTotal || 0));
                if (totalDebtForPeriod <= 0)
                    continue;
                const pattern = generateIncomePattern(user, totalDebtForPeriod, billingDate);
                for (const inc of pattern) {
                    const incomeDoc = {
                        incomeId: `income-${user.uid}-${period}-${inc.timestamp.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
                        uid: user.uid,
                        username: user.username,
                        userDisplayName: user.displayName,
                        amount: (0, utils_1.roundMoney)(inc.amount),
                        timestamp: ts(inc.timestamp),
                    };
                    incomesForUser.push(incomeDoc);
                }
            }
        }
        // Write incomes for this user
        for (const inc of incomesForUser) {
            const ref = db.collection(firebase_schema_1.FIREBASE_COLLECTIONS.INCOME).doc(inc.incomeId);
            incomeBatch.set(ref, inc);
            incomesCreated++;
        }
        // Compute debts and bank for this user using all events
        const events = [];
        for (const pj of printJobs.filter((j) => j.uid === user.uid)) {
            events.push({ kind: "print", amount: pj.totalCost, timestamp: asDate(pj.timestamp) });
        }
        for (const lj of laminationJobs.filter((j) => j.uid === user.uid)) {
            events.push({ kind: "lamination", amount: lj.totalCost, timestamp: asDate(lj.timestamp) });
        }
        for (const inc of incomesForUser) {
            events.push({ kind: "income", amount: inc.amount, timestamp: asDate(inc.timestamp) });
        }
        const { debts, bank } = computeDebtsAndBankForUser(events);
        bankTotals.printBank = (0, utils_1.roundMoney)(bankTotals.printBank + bank.printBank);
        bankTotals.laminationBank = (0, utils_1.roundMoney)(bankTotals.laminationBank + bank.laminationBank);
        // Update user document with derived debts
        const userRef = db.collection(firebase_schema_1.FIREBASE_COLLECTIONS.USERS).doc(user.uid);
        userUpdateBatch.update(userRef, {
            printDebt: debts.printDebt,
            laminationDebt: debts.laminationDebt,
            totalDebt: debts.totalDebt,
        });
    }
    await incomeBatch.commit();
    await userUpdateBatch.commit();
    console.log(`Seeded ${incomesCreated} income records and updated user debts`);
    // Write bank aggregate
    const bankDoc = {
        bankId: "main-bank",
        printBank: bankTotals.printBank,
        laminationBank: bankTotals.laminationBank,
        timestamp: ts(new Date()),
        lastUpdated: ts(new Date()),
    };
    await db.collection(firebase_schema_1.FIREBASE_COLLECTIONS.BANK).doc(bankDoc.bankId).set(bankDoc);
    console.log(`Bank totals saved (print: ${bankDoc.printBank}, lamination: ${bankDoc.laminationBank})`);
}
async function main() {
    await seedPriceTables();
    await seedUsers();
    await seedJobs();
    await seedIncomeAndDebts();
}
exports.main = main;
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
