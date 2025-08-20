"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dummyDataUtils = exports.addTestUser = exports.resetDummyData = exports.populateDummyData = void 0;
const dummy_database_1 = require("@/lib/dummy-database");
function populateDummyData() {
    console.log("🚀 Starting dummy data population...");
    try {
        // The dummy database automatically initializes with sample data
        // when the class is instantiated, so we just need to verify it's working
        const users = dummy_database_1.dummyDB.getUsers();
        const printJobs = dummy_database_1.dummyDB.getAllPrintJobs();
        const laminationJobs = dummy_database_1.dummyDB.getAllLaminationJobs();
        const printBilling = dummy_database_1.dummyDB.getAllPrintBilling();
        const laminationBilling = dummy_database_1.dummyDB.getAllLaminationBilling();
        const priceTables = dummy_database_1.dummyDB.getPriceTables();
        console.log("📊 Data Summary:");
        console.log(`   Users: ${users.length}`);
        console.log(`   Print Jobs: ${printJobs.length}`);
        console.log(`   Lamination Jobs: ${laminationJobs.length}`);
        console.log(`   Print Billing Records: ${printBilling.length}`);
        console.log(`   Lamination Billing Records: ${laminationBilling.length}`);
        console.log(`   Price Tables: ${priceTables.length}`);
        // Log some sample data
        console.log("\n👥 Sample Users:");
        users.forEach((user) => {
            console.log(`   - ${user.displayName} (${user.username}) - ${user.accessLevel}`);
        });
        console.log("\n💰 Current Pricing:");
        priceTables.forEach((table) => {
            console.log(`   ${table.name}:`);
            Object.entries(table.prices).forEach(([key, value]) => {
                console.log(`     ${key}: €${value.toFixed(2).replace('.', ',')}`);
            });
        });
        // Calculate some statistics
        const totalPrintCost = printJobs.reduce((sum, job) => sum + job.totalCost, 0);
        const totalLaminationCost = laminationJobs.reduce((sum, job) => sum + job.totalCost, 0);
        const totalUnpaidPrint = printBilling.filter((b) => !b.paid).reduce((sum, b) => sum + b.remainingBalance, 0);
        const totalUnpaidLamination = laminationBilling
            .filter((b) => !b.paid)
            .reduce((sum, b) => sum + b.remainingBalance, 0);
        console.log("\n📈 Statistics:");
        console.log(`   Total Print Revenue: €${totalPrintCost.toFixed(2).replace('.', ',')}`);
        console.log(`   Total Lamination Revenue: €${totalLaminationCost.toFixed(2).replace('.', ',')}`);
        console.log(`   Unpaid Print Bills: €${totalUnpaidPrint.toFixed(2).replace('.', ',')}`);
        console.log(`   Unpaid Lamination Bills: €${totalUnpaidLamination.toFixed(2).replace('.', ',')}`);
        console.log(`   Total Outstanding: €${(totalUnpaidPrint + totalUnpaidLamination).toFixed(2).replace('.', ',')}`);
        console.log("\n✅ Dummy data population completed successfully!");
        return true;
    }
    catch (error) {
        console.error("❌ Error populating dummy data:", error);
        return false;
    }
}
exports.populateDummyData = populateDummyData;
// Function to reset all data
function resetDummyData() {
    console.log("🔄 Resetting dummy data...");
    try {
        // Since we're using a class-based approach, we need to reinitialize
        // In a real implementation, this would clear the database
        console.log("⚠️  Note: In this demo, data resets when the page is refreshed");
        console.log("✅ Data reset completed!");
        return true;
    }
    catch (error) {
        console.error("❌ Error resetting data:", error);
        return false;
    }
}
exports.resetDummyData = resetDummyData;
// Function to add a single test user
function addTestUser(username, displayName, accessLevel = "Χρήστης") {
    try {
        const users = dummy_database_1.dummyDB.getUsers();
        // Check if user already exists
        if (users.find((u) => u.username === username)) {
            console.log(`⚠️  User ${username} already exists`);
            return false;
        }
        const newUser = {
            uid: `user-${Date.now()}`,
            username,
            accessLevel,
            displayName,
            createdAt: new Date(),
            userRole: "Άτομο",
            team: "Ενωμένοι",
        };
        const updatedUsers = [...users, newUser];
        dummy_database_1.dummyDB.saveUsers(updatedUsers);
        console.log(`✅ Added test user: ${displayName} (${username})`);
        return true;
    }
    catch (error) {
        console.error("❌ Error adding test user:", error);
        return false;
    }
}
exports.addTestUser = addTestUser;
// Export for use in components
exports.dummyDataUtils = {
    populate: populateDummyData,
    reset: resetDummyData,
    addTestUser,
};
