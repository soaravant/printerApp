"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EXPECTED_TOMEIS_NAMES = exports.EXPECTED_NAOI_NAMES = exports.OFFICIAL_TEAM_NAMES = void 0;
exports.isOfficialTeamName = isOfficialTeamName;
exports.getMissingManagedEntityUsers = getMissingManagedEntityUsers;
const db_population_data_json_1 = __importDefault(require("../db-population-data.json"));
const data = db_population_data_json_1.default;
exports.OFFICIAL_TEAM_NAMES = [
    "Ενωμένοι",
    "Σποριάδες",
    "Καρποφόροι",
    "Ολόφωτοι",
    "Νικητές",
    "Νικηφόροι",
    "Φλόγα",
    "Σύμψυχοι",
];
const OFFICIAL_TEAM_NAME_SET = new Set(exports.OFFICIAL_TEAM_NAMES);
exports.EXPECTED_NAOI_NAMES = data.naos.map((entry) => entry.name);
exports.EXPECTED_TOMEIS_NAMES = (data.tomeis || []).map((entry) => entry.name);
function isOfficialTeamName(value) {
    if (!value)
        return false;
    return OFFICIAL_TEAM_NAME_SET.has(value.trim());
}
function normalizeManagedRole(role) {
    return role === "Τμήμα" ? "Ναός" : role;
}
function getMissingManagedEntityUsers(users) {
    const existingTeams = new Set();
    const existingNaoi = new Set();
    const existingTomeis = new Set();
    users.forEach((user) => {
        const name = String(user.displayName || "").trim();
        if (!name)
            return;
        switch (normalizeManagedRole(user.userRole)) {
            case "Ομάδα":
                if (isOfficialTeamName(name)) {
                    existingTeams.add(name);
                }
                break;
            case "Ναός":
                existingNaoi.add(name);
                break;
            case "Τομέας":
                existingTomeis.add(name);
                break;
            default:
                break;
        }
    });
    const missingTeams = exports.OFFICIAL_TEAM_NAMES.filter((name) => !existingTeams.has(name));
    const missingNaoi = exports.EXPECTED_NAOI_NAMES.filter((name) => !existingNaoi.has(name));
    const missingTomeis = exports.EXPECTED_TOMEIS_NAMES.filter((name) => !existingTomeis.has(name));
    return {
        missingTeams,
        missingNaoi,
        missingTomeis,
        hasIssues: missingTeams.length > 0 || missingNaoi.length > 0 || missingTomeis.length > 0,
    };
}
