import populationData from "../db-population-data.json"

import type { FirebaseUser } from "@/lib/firebase-schema"

type PopulationEntry = { name: string; code: number }
type PopulationData = {
  teams: PopulationEntry[]
  naos: PopulationEntry[]
  tomeis?: PopulationEntry[]
}

const data = populationData as PopulationData

export const OFFICIAL_TEAM_NAMES: string[] = [
  "Ενωμένοι",
  "Σποριάδες",
  "Καρποφόροι",
  "Ολόφωτοι",
  "Νικητές",
  "Νικηφόροι",
  "Φλόγα",
  "Σύμψυχοι",
]

const OFFICIAL_TEAM_NAME_SET = new Set<string>(OFFICIAL_TEAM_NAMES)

export const EXPECTED_NAOI_NAMES = data.naos.map((entry) => entry.name)
export const EXPECTED_TOMEIS_NAMES = (data.tomeis || []).map((entry) => entry.name)

export function isOfficialTeamName(value: string | null | undefined): value is string {
  if (!value) return false
  return OFFICIAL_TEAM_NAME_SET.has(value.trim())
}

function normalizeManagedRole(role: FirebaseUser["userRole"] | string | null | undefined) {
  return role === "Τμήμα" ? "Ναός" : role
}

export function getMissingManagedEntityUsers(users: Array<Pick<FirebaseUser, "userRole" | "displayName">>) {
  const existingTeams = new Set<string>()
  const existingNaoi = new Set<string>()
  const existingTomeis = new Set<string>()

  users.forEach((user) => {
    const name = String(user.displayName || "").trim()
    if (!name) return

    switch (normalizeManagedRole(user.userRole)) {
      case "Ομάδα":
        if (isOfficialTeamName(name)) {
          existingTeams.add(name)
        }
        break
      case "Ναός":
        existingNaoi.add(name)
        break
      case "Τομέας":
        existingTomeis.add(name)
        break
      default:
        break
    }
  })

  const missingTeams = OFFICIAL_TEAM_NAMES.filter((name) => !existingTeams.has(name))
  const missingNaoi = EXPECTED_NAOI_NAMES.filter((name) => !existingNaoi.has(name))
  const missingTomeis = EXPECTED_TOMEIS_NAMES.filter((name) => !existingTomeis.has(name))

  return {
    missingTeams,
    missingNaoi,
    missingTomeis,
    hasIssues: missingTeams.length > 0 || missingNaoi.length > 0 || missingTomeis.length > 0,
  }
}
