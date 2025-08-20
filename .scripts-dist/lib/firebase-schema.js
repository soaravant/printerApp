"use strict";
// Firebase Schema for Firestore (single source of truth)
// Central place to define collections and document shapes used by seed/clear scripts
Object.defineProperty(exports, "__esModule", { value: true });
exports.FIREBASE_COLLECTIONS = void 0;
// ============================================================================
// FIRESTORE COLLECTION NAMES (align with firestore.rules)
// ============================================================================
exports.FIREBASE_COLLECTIONS = {
    USERS: "users",
    PRICE_TABLES: "priceTables",
    PRINT_JOBS: "printJobs",
    LAMINATION_JOBS: "laminationJobs",
    INCOME: "income",
    BANK: "bank",
    TRANSACTIONS: "transactions",
    BILLING: "billing",
    SETTINGS: "settings",
};
