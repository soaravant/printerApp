"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.coerceToDate = coerceToDate;
exports.computeDebtsAndBankForUser = computeDebtsAndBankForUser;
const utils_1 = require("@/lib/utils");
function coerceToDate(value) {
    if (!value)
        return null;
    if (value instanceof Date)
        return Number.isNaN(value.getTime()) ? null : value;
    if (typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
        const next = value.toDate();
        return Number.isNaN(next.getTime()) ? null : next;
    }
    if (typeof value === "object" && value !== null) {
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
            const next = new Date(seconds * 1000 + Math.floor(nanoseconds / 1000000));
            return Number.isNaN(next.getTime()) ? null : next;
        }
    }
    const next = new Date(value);
    return Number.isNaN(next.getTime()) ? null : next;
}
function computeDebtsAndBankForUser(events, openingBalances) {
    const sortedEvents = [...events].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    const openingPrintDebt = (0, utils_1.roundMoney)(Number((openingBalances === null || openingBalances === void 0 ? void 0 : openingBalances.printDebt) || 0));
    const openingLaminationDebt = (0, utils_1.roundMoney)(Number((openingBalances === null || openingBalances === void 0 ? void 0 : openingBalances.laminationDebt) || 0));
    let printDebt = Math.max(0, openingPrintDebt);
    let laminationDebt = Math.max(0, openingLaminationDebt);
    let totalCredit = (0, utils_1.roundMoney)(Math.max(0, -openingPrintDebt) + Math.max(0, -openingLaminationDebt));
    let printBank = 0;
    let laminationBank = 0;
    for (const event of sortedEvents) {
        if (event.kind === "print") {
            if (totalCredit > 0) {
                if (event.amount <= totalCredit) {
                    totalCredit = (0, utils_1.roundMoney)(totalCredit - event.amount);
                }
                else {
                    const remainder = (0, utils_1.roundMoney)(event.amount - totalCredit);
                    totalCredit = 0;
                    printDebt = (0, utils_1.roundMoney)(printDebt + remainder);
                }
            }
            else {
                printDebt = (0, utils_1.roundMoney)(printDebt + event.amount);
            }
            continue;
        }
        if (event.kind === "lamination") {
            if (totalCredit > 0) {
                if (event.amount <= totalCredit) {
                    totalCredit = (0, utils_1.roundMoney)(totalCredit - event.amount);
                }
                else {
                    const remainder = (0, utils_1.roundMoney)(event.amount - totalCredit);
                    totalCredit = 0;
                    laminationDebt = (0, utils_1.roundMoney)(laminationDebt + remainder);
                }
            }
            else {
                laminationDebt = (0, utils_1.roundMoney)(laminationDebt + event.amount);
            }
            continue;
        }
        let remaining = event.amount;
        if (laminationDebt > 0) {
            const laminationPayment = Math.min(remaining, laminationDebt);
            laminationDebt = (0, utils_1.roundMoney)(laminationDebt - laminationPayment);
            remaining = (0, utils_1.roundMoney)(remaining - laminationPayment);
            laminationBank = (0, utils_1.roundMoney)(laminationBank + laminationPayment);
        }
        if (remaining > 0 && printDebt > 0) {
            const printPayment = Math.min(remaining, printDebt);
            printDebt = (0, utils_1.roundMoney)(printDebt - printPayment);
            remaining = (0, utils_1.roundMoney)(remaining - printPayment);
            printBank = (0, utils_1.roundMoney)(printBank + printPayment);
        }
        if (remaining > 0) {
            totalCredit = (0, utils_1.roundMoney)(totalCredit + remaining);
            printBank = (0, utils_1.roundMoney)(printBank + remaining);
        }
    }
    return {
        debts: {
            printDebt,
            laminationDebt,
            totalDebt: (0, utils_1.roundMoney)(printDebt + laminationDebt - totalCredit),
        },
        bank: {
            printBank,
            laminationBank,
        },
    };
}
