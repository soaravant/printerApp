import { initializeApp } from "firebase/app"
import { getFirestore, collection, doc, setDoc, addDoc, Timestamp } from "firebase/firestore"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

// Dummy users data
const dummyUsers = [
  {
    uid: "user1",
    role: "admin" as const,
    displayName: "John Admin",
    department: "IT",
  },
  {
    uid: "user2",
    role: "user" as const,
    displayName: "Sarah Johnson",
    department: "Marketing",
  },
  {
    uid: "user3",
    role: "user" as const,
    displayName: "Mike Chen",
    department: "Engineering",
  },
  {
    uid: "user4",
    role: "user" as const,
    displayName: "Emily Davis",
    department: "Sales",
  },
  {
    uid: "user5",
    role: "user" as const,
    displayName: "Robert Wilson",
    department: "HR",
  },
]

// Function to generate random print jobs
function generateRandomJobs(userId: string, count: number) {
  const jobs = []
  const printerIPs = ["192.168.3.41", "192.168.3.42"]

  for (let i = 0; i < count; i++) {
    // Generate random date within last 3 months
    const daysAgo = Math.floor(Math.random() * 90)
    const timestamp = new Date()
    timestamp.setDate(timestamp.getDate() - daysAgo)

    const pagesBW = Math.floor(Math.random() * 50) + 1
    const pagesColor = Math.floor(Math.random() * 20)
    const scans = Math.floor(Math.random() * 10)
    const deviceIP = printerIPs[Math.floor(Math.random() * printerIPs.length)]

    const cost = pagesBW * 0.05 + pagesColor * 0.15 + scans * 0.02

    jobs.push({
      uid: userId,
      pagesBW,
      pagesColor,
      scans,
      deviceIP,
      timestamp: Timestamp.fromDate(timestamp),
      cost: Number.parseFloat(cost.toFixed(2)),
    })
  }

  return jobs
}

// Function to generate billing records
function generateBillingRecords(userId: string, jobs: any[]) {
  const billingMap = new Map()

  jobs.forEach((job) => {
    const date = job.timestamp.toDate()
    const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`

    if (!billingMap.has(period)) {
      billingMap.set(period, {
        billingId: `${userId}-${period}`,
        uid: userId,
        period,
        totalCost: 0,
        paid: Math.random() > 0.3, // 70% chance of being paid
      })
    }

    const billing = billingMap.get(period)
    billing.totalCost += job.cost
  })

  return Array.from(billingMap.values()).map((billing) => ({
    ...billing,
    totalCost: Number.parseFloat(billing.totalCost.toFixed(2)),
  }))
}

async function populateDatabase() {
  try {
    console.log("Starting to populate database with dummy data...")

    // Add users
    console.log("Adding users...")
    for (const user of dummyUsers) {
      await setDoc(doc(db, "users", user.uid), user)
      console.log(`Added user: ${user.displayName}`)
    }

    // Add jobs for each user
    console.log("Adding print jobs...")
    const allJobs = []

    for (const user of dummyUsers) {
      const jobCount = Math.floor(Math.random() * 30) + 10 // 10-40 jobs per user
      const userJobs = generateRandomJobs(user.uid, jobCount)

      for (const job of userJobs) {
        const docRef = await addDoc(collection(db, "jobs"), job)
        allJobs.push({ id: docRef.id, ...job })
        console.log(
          `Added job for ${user.displayName}: ${job.pagesBW} B&W, ${job.pagesColor} Color, ${job.scans} Scans`,
        )
      }
    }

    // Add billing records
    console.log("Adding billing records...")
    for (const user of dummyUsers) {
      const userJobs = allJobs.filter((job) => job.uid === user.uid)
      const billingRecords = generateBillingRecords(user.uid, userJobs)

      for (const billing of billingRecords) {
        await setDoc(doc(db, "billing", billing.billingId), billing)
        console.log(`Added billing record for ${user.displayName}: ${billing.period} - $${billing.totalCost}`)
      }
    }

    console.log("✅ Database populated successfully!")
    console.log(`Added ${dummyUsers.length} users`)
    console.log(`Added ${allJobs.length} print jobs`)
    console.log("You can now test the UI with realistic data")
  } catch (error) {
    console.error("Error populating database:", error)
  }
}

// Run the population script
populateDatabase()
