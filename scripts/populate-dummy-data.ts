// @ts-nocheck
"use client"
// @ts-nocheck
// Deprecated script: replaced by Firestore seed scripts.
// Deprecated script; dummy database removed. Keeping file to avoid script errors.

export function populateDummyData() {
  console.log("🚀 Starting dummy data population...")

  try {
    // The dummy database automatically initializes with sample data
    // when the class is instantiated, so we just need to verify it's working

    const users = dummyDB.getUsers()
    const printJobs = dummyDB.getAllPrintJobs()
    const laminationJobs = dummyDB.getAllLaminationJobs()
    const printBilling = dummyDB.getAllPrintBilling()
    const laminationBilling = dummyDB.getAllLaminationBilling()
    const priceTables = dummyDB.getPriceTables()

    console.log("📊 Data Summary:")
    console.log(`   Users: ${users.length}`)
    console.log(`   Print Jobs: ${printJobs.length}`)
    console.log(`   Lamination Jobs: ${laminationJobs.length}`)
    console.log(`   Print Billing Records: ${printBilling.length}`)
    console.log(`   Lamination Billing Records: ${laminationBilling.length}`)
    console.log(`   Price Tables: ${priceTables.length}`)

    // Log some sample data
    console.log("\n👥 Sample Users:")
    users.forEach((user) => {
      console.log(`   - ${user.displayName} (${user.username}) - ${user.accessLevel}`)
    })

    console.log("\n💰 Current Pricing:")
    priceTables.forEach((table) => {
      console.log(`   ${table.name}:`)
      Object.entries(table.prices).forEach(([key, value]) => {
        console.log(`     ${key}: €${value.toFixed(2).replace('.', ',')}`);
      })
    })

    // Calculate some statistics
    const totalPrintCost = printJobs.reduce((sum, job) => sum + job.totalCost, 0)
    const totalLaminationCost = laminationJobs.reduce((sum, job) => sum + job.totalCost, 0)
    const totalUnpaidPrint = printBilling.filter((b) => !b.paid).reduce((sum, b) => sum + b.remainingBalance, 0)
    const totalUnpaidLamination = laminationBilling
      .filter((b) => !b.paid)
      .reduce((sum, b) => sum + b.remainingBalance, 0)

    console.log("\n📈 Statistics:")
    console.log(`   Total Print Revenue: €${totalPrintCost.toFixed(2).replace('.', ',')}`);
    console.log(`   Total Lamination Revenue: €${totalLaminationCost.toFixed(2).replace('.', ',')}`);
    console.log(`   Unpaid Print Bills: €${totalUnpaidPrint.toFixed(2).replace('.', ',')}`);
    console.log(`   Unpaid Lamination Bills: €${totalUnpaidLamination.toFixed(2).replace('.', ',')}`);
    console.log(`   Total Outstanding: €${(totalUnpaidPrint + totalUnpaidLamination).toFixed(2).replace('.', ',')}`);

    console.log("\n✅ Dummy data population completed successfully!")
    return true
  } catch (error) {
    console.error("❌ Error populating dummy data:", error)
    return false
  }
}

// Function to reset all data
export function resetDummyData() {
  console.log("🔄 Resetting dummy data...")

  try {
    // Since we're using a class-based approach, we need to reinitialize
    // In a real implementation, this would clear the database
    console.log("⚠️  Note: In this demo, data resets when the page is refreshed")
    console.log("✅ Data reset completed!")
    return true
  } catch (error) {
    console.error("❌ Error resetting data:", error)
    return false
  }
}

// Function to add a single test user
export function addTestUser(
  username: string,
  displayName: string,
  accessLevel: "Χρήστης" | "Διαχειριστής" = "Χρήστης",
) {
  try {
    const users = dummyDB.getUsers()

    // Check if user already exists
    if (users.find((u) => u.username === username)) {
      console.log(`⚠️  User ${username} already exists`)
      return false
    }

    const newUser: User = {
      uid: `user-${Date.now()}`,
      username,
      accessLevel,
      displayName,
      createdAt: new Date(),
      userRole: "Άτομο",
      team: "Ενωμένοι",
    }

    const updatedUsers = [...users, newUser]
    dummyDB.saveUsers(updatedUsers)

    console.log(`✅ Added test user: ${displayName} (${username})`)
    return true
  } catch (error) {
    console.error("❌ Error adding test user:", error)
    return false
  }
}

// Export for use in components
export const dummyDataUtils = {
  populate: populateDummyData,
  reset: resetDummyData,
  addTestUser,
}
