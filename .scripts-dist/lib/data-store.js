"use strict";
// Simple in-memory data store for demo purposes
// In production, this would be replaced with a real database
Object.defineProperty(exports, "__esModule", { value: true });
exports.dataStore = void 0;
// Simple data storage using localStorage
class DataStore {
    getFromStorage(key) {
        if (typeof window === "undefined")
            return [];
        const data = localStorage.getItem(key);
        return data
            ? JSON.parse(data, (key, value) => {
                // Convert date strings back to Date objects
                if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
                    return new Date(value);
                }
                return value;
            })
            : [];
    }
    saveToStorage(key, data) {
        if (typeof window === "undefined")
            return;
        localStorage.setItem(key, JSON.stringify(data));
    }
    // Users
    getUsers() {
        return this.getFromStorage("users");
    }
    saveUsers(users) {
        this.saveToStorage("users", users);
    }
    // Print Jobs
    getPrintJobs() {
        return this.getFromStorage("printJobs");
    }
    savePrintJobs(jobs) {
        this.saveToStorage("printJobs", jobs);
    }
    addPrintJob(job) {
        const jobs = this.getPrintJobs();
        jobs.push(job);
        this.savePrintJobs(jobs);
    }
    // Billing Records
    getBillingRecords() {
        return this.getFromStorage("billingRecords");
    }
    saveBillingRecords(records) {
        this.saveToStorage("billingRecords", records);
    }
    updateBillingRecord(billingId, updates) {
        const records = this.getBillingRecords();
        const index = records.findIndex((r) => r.billingId === billingId);
        if (index !== -1) {
            records[index] = { ...records[index], ...updates, lastUpdated: new Date() };
            this.saveBillingRecords(records);
        }
    }
    // Price Tables
    getPriceTables() {
        return this.getFromStorage("priceTables");
    }
    savePriceTables(tables) {
        this.saveToStorage("priceTables", tables);
    }
    addPriceTable(table) {
        const tables = this.getPriceTables();
        // Αν υπάρχει ήδη τιμοκατάλογος με το ίδιο ID, αντικατάστησέ τον
        const existingIndex = tables.findIndex((t) => t.id === table.id);
        if (existingIndex !== -1) {
            tables[existingIndex] = table;
        }
        else {
            tables.push(table);
        }
        this.savePriceTables(tables);
    }
    updatePriceTable(id, updates) {
        const tables = this.getPriceTables();
        const index = tables.findIndex((t) => t.id === id);
        if (index !== -1) {
            tables[index] = { ...tables[index], ...updates, updatedAt: new Date() };
            this.savePriceTables(tables);
        }
    }
    // Βοηθητικές μέθοδοι για στατιστικά
    getTotalCostForUser(uid) {
        const jobs = this.getPrintJobs().filter((job) => job.uid === uid);
        return jobs.reduce((total, job) => total + job.totalCost, 0);
    }
    getUnpaidAmountForUser(uid) {
        const billingRecords = this.getBillingRecords().filter((record) => record.uid === uid && !record.paid);
        return billingRecords.reduce((total, record) => total + record.remainingBalance, 0);
    }
    getJobsCountForUser(uid) {
        return this.getPrintJobs().filter((job) => job.uid === uid).length;
    }
    // Καθαρισμός όλων των δεδομένων
    clearAllData() {
        if (typeof window === "undefined")
            return;
        localStorage.removeItem("users");
        localStorage.removeItem("printJobs");
        localStorage.removeItem("billingRecords");
        localStorage.removeItem("priceTables");
    }
}
exports.dataStore = new DataStore();
