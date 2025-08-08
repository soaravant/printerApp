/* eslint-disable no-console */
import { Timestamp } from "../lib/firebase-schema"
import getAdminDb from "./utils/firebase-admin"
import {
  FIREBASE_COLLECTIONS,
  FirebaseUser,
  FirebasePriceTable,
  FirebasePrintJob,
  FirebaseLaminationJob,
} from "../lib/firebase-schema"

// Utilities
const now = () => new Date()
const ts = (d: Date): Timestamp => d

async function seedPriceTables() {
  const db = getAdminDb()
  const priceTables: FirebasePriceTable[] = [
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
  ]

  const batch = db.batch()
  for (const table of priceTables) {
    const ref = db.collection(FIREBASE_COLLECTIONS.PRICE_TABLES).doc(table.id)
    batch.set(ref, table)
  }
  await batch.commit()
  console.log(`Seeded ${priceTables.length} price tables`)
}

async function seedUsers() {
  const db = getAdminDb()
  const teams = [
    "Ενωμένοι",
    "Σποριάδες",
    "Καρποφόροι",
    "Ολόφωτοι",
    "Νικητές",
    "Νικηφόροι",
    "Φλόγα",
    "Σύμψυχοι",
  ] as const

  const users: FirebaseUser[] = []

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
  })

  // Create Υπεύθυνος + 2 users for each team
  const userTuples: Array<[string, number, number]> = [
    [teams[0], 401, 501],
    [teams[1], 402, 503],
    [teams[2], 403, 505],
    [teams[3], 404, 507],
    [teams[4], 405, 509],
    [teams[5], 406, 511],
    [teams[6], 407, 513],
    [teams[7], 408, 515],
  ]

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
    })
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
    })
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
    })
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
  ] as const

  for (const [uid, code, name, role] of groupDefs) {
    users.push({
      uid,
      username: String(code),
      accessLevel: "Χρήστης",
      displayName: name,
      createdAt: ts(now()),
      userRole: role as FirebaseUser["userRole"],
      role: "user",
    })
  }

  const batch = db.batch()
  for (const u of users) {
    const ref = db.collection(FIREBASE_COLLECTIONS.USERS).doc(u.uid)
    batch.set(ref, u)
  }
  await batch.commit()
  console.log(`Seeded ${users.length} users`)
}

function randomChoice<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

async function seedJobs() {
  const db = getAdminDb()
  // Fetch prices
  const printingSnap = await db
    .collection(FIREBASE_COLLECTIONS.PRICE_TABLES)
    .doc("printing")
    .get()
  const printing = printingSnap.data() as FirebasePriceTable | undefined
  if (!printing) throw new Error("Missing printing price table")

  const lamSnap = await db
    .collection(FIREBASE_COLLECTIONS.PRICE_TABLES)
    .doc("lamination")
    .get()
  const lamination = lamSnap.data() as FirebasePriceTable | undefined
  if (!lamination) throw new Error("Missing lamination price table")

  // Get non-admin users
  const usersSnap = await db.collection(FIREBASE_COLLECTIONS.USERS).get()
  const users = usersSnap.docs
    .map((d) => d.data() as FirebaseUser)
   .filter((u) => u.accessLevel !== "Διαχειριστής")

  const printerNames = ["Canon Color", "Canon B/W", "Brother", "Κυδωνιών"] as const
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
  ] as const

  const batch = db.batch()
  let created = 0

  const nowDate = new Date()
  for (let monthOffset = 0; monthOffset < 3; monthOffset++) {
    for (const user of users) {
      const jobsCount = Math.floor(Math.random() * 6) + 5 // 5-10 sessions/month
      for (let i = 0; i < jobsCount; i++) {
        const jobDate = new Date(
          nowDate.getFullYear(),
          nowDate.getMonth() - monthOffset,
          Math.floor(Math.random() * 28) + 1,
        )
        const deviceName = randomChoice(printerNames)

        const allowedTypes =
          deviceName === "Canon Color"
            ? printTypesAll
            : (["A4BW"] as const)
        const numJobs = Math.floor(Math.random() * 3) + 1
        for (let j = 0; j < numJobs; j++) {
          const type = randomChoice(allowedTypes)
          const quantity = Math.floor(Math.random() * 8) + 1
          const pricePerUnit = (printing.prices as any)[
            type === "RizochartoA3"
              ? "rizochartoA3"
              : type === "RizochartoA4"
              ? "rizochartoA4"
              : type === "ChartoniA3"
              ? "chartoniA3"
              : type === "ChartoniA4"
              ? "chartoniA4"
              : type === "Autokollito"
              ? "autokollito"
              : type.charAt(0).toLowerCase() + type.slice(1)
          ] as number

          const doc: FirebasePrintJob = {
            jobId: `print-${user.uid}-${monthOffset}-${i}-${j}`,
            uid: user.uid,
            username: user.username,
            userDisplayName: user.displayName,
            type,
            quantity,
            pricePerUnit,
            totalCost: +(pricePerUnit * quantity).toFixed(2),
            deviceIP: `192.168.1.${100 + Math.floor(Math.random() * 3)}`,
            deviceName,
            timestamp: ts(jobDate),
            status: "completed",
          }
          const ref = db
            .collection(FIREBASE_COLLECTIONS.PRINT_JOBS)
            .doc(doc.jobId)
          batch.set(ref, doc)
          created++
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
  ] as const

  for (let monthOffset = 0; monthOffset < 3; monthOffset++) {
    for (const user of users) {
      const jobsCount = Math.floor(Math.random() * 4) + 3 // 3-6/month
      for (let i = 0; i < jobsCount; i++) {
        const jobDate = new Date(
          nowDate.getFullYear(),
          nowDate.getMonth() - monthOffset,
          Math.floor(Math.random() * 28) + 1,
        )
        const type = randomChoice(lamTypes)
        const quantity = Math.floor(Math.random() * 3) + 1
        const pricePerUnit = (lamination.prices as any)[type] as number
        const doc: FirebaseLaminationJob = {
          jobId: `lamination-${user.uid}-${monthOffset}-${i}`,
          uid: user.uid,
          username: user.username,
          userDisplayName: user.displayName,
          type,
          quantity,
          pricePerUnit,
          totalCost: +(pricePerUnit * quantity).toFixed(2),
          timestamp: ts(jobDate),
          status: "completed",
          notes: Math.random() > 0.7 ? "Επείγον" : undefined,
        }
        const ref = db
          .collection(FIREBASE_COLLECTIONS.LAMINATION_JOBS)
          .doc(doc.jobId)
        batch.set(ref, doc)
        created++
      }
    }
  }

  await batch.commit()
  console.log(`Seeded ${created} jobs (print + lamination)`) 
}

export async function main() {
  await seedPriceTables()
  await seedUsers()
  await seedJobs()
}

if (require.main === module) {
  main()
    .then(() => {
      console.log("Firestore seed completed")
      process.exit(0)
    })
    .catch((err) => {
      console.error(err)
      process.exit(1)
    })
}


