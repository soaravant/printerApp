"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDynamicFilterOptions = exports.calculatePrintCost = exports.calculatePrintJobTotal = exports.formatMoney = exports.subtractMoney = exports.multiplyMoney = exports.addMoney = exports.roundMoney = exports.toLocalISOString = exports.formatGreekDateTime = exports.formatGreekDate = exports.normalizeGreek = exports.cn = void 0;
const clsx_1 = require("clsx");
const tailwind_merge_1 = require("tailwind-merge");
function cn(...inputs) {
    return (0, tailwind_merge_1.twMerge)((0, clsx_1.clsx)(inputs));
}
exports.cn = cn;
// Normalize Greek text by removing diacritics (τόνοι) and lowercasing
// Example: "Άγγελος" -> "αγγελος"
function normalizeGreek(input) {
    return input
        .normalize("NFD")
        .replace(/\p{Diacritic}+/gu, "")
        .toLowerCase();
}
exports.normalizeGreek = normalizeGreek;
/**
 * Formats a date in Greek locale (el-GR)
 * @param date - Date to format
 * @param options - Intl.DateTimeFormatOptions for custom formatting
 * @returns Formatted date string in Greek format
 */
function formatGreekDate(date, options) {
    const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    return dateObj.toLocaleDateString("el-GR", options);
}
exports.formatGreekDate = formatGreekDate;
/**
 * Formats a date in Greek locale with time
 * @param date - Date to format
 * @param options - Intl.DateTimeFormatOptions for custom formatting
 * @returns Formatted date and time string in Greek format
 */
function formatGreekDateTime(date, options) {
    const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    return dateObj.toLocaleString("el-GR", options);
}
exports.formatGreekDateTime = formatGreekDateTime;
/**
 * Converts a date to ISO date string (YYYY-MM-DD) without timezone issues
 * @param date - Date to convert
 * @returns ISO date string in local timezone
 */
function toLocalISOString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
exports.toLocalISOString = toLocalISOString;
/**
 * Money calculation utilities to prevent floating-point precision errors
 * and ensure consistent 2-decimal place rounding for currency values.
 */
/**
 * Rounds a number to exactly 2 decimal places for money calculations.
 * This prevents floating-point precision errors that can cause 1 cent overflows.
 *
 * @param value - The number to round
 * @returns The number rounded to 2 decimal places
 */
function roundMoney(value) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
}
exports.roundMoney = roundMoney;
/**
 * Adds multiple money values together with proper rounding to prevent precision errors.
 *
 * @param values - Array of money values to add
 * @returns The sum rounded to 2 decimal places
 */
function addMoney(...values) {
    const sum = values.reduce((acc, val) => acc + val, 0);
    return roundMoney(sum);
}
exports.addMoney = addMoney;
/**
 * Multiplies a money value by a quantity with proper rounding.
 *
 * @param price - The price per unit
 * @param quantity - The quantity
 * @returns The total cost rounded to 2 decimal places
 */
function multiplyMoney(price, quantity) {
    return roundMoney(price * quantity);
}
exports.multiplyMoney = multiplyMoney;
/**
 * Subtracts one money value from another with proper rounding.
 *
 * @param total - The total amount
 * @param paid - The amount paid
 * @returns The remaining balance rounded to 2 decimal places
 */
function subtractMoney(total, paid) {
    return roundMoney(total - paid);
}
exports.subtractMoney = subtractMoney;
/**
 * Formats a money value for display with proper Greek formatting.
 *
 * @param value - The money value to format
 * @returns Formatted string with € symbol and comma as decimal separator
 */
function formatMoney(value) {
    return `€${roundMoney(value).toFixed(2).replace('.', ',')}`;
}
exports.formatMoney = formatMoney;
/**
 * Calculates the total cost for a print job with proper rounding.
 *
 * @param costs - Object containing individual cost components
 * @returns The total cost rounded to 2 decimal places
 */
function calculatePrintJobTotal(costs) {
    return addMoney(costs.costA4BW, costs.costA4Color, costs.costA3BW, costs.costA3Color, costs.costRizochartoA3, costs.costRizochartoA4, costs.costChartoniA3, costs.costChartoniA4, costs.costAutokollito);
}
exports.calculatePrintJobTotal = calculatePrintJobTotal;
/**
 * Calculates individual costs for print job components with proper rounding.
 *
 * @param pages - Number of pages
 * @param pricePerPage - Price per page
 * @returns The cost rounded to 2 decimal places
 */
function calculatePrintCost(pages, pricePerPage) {
    return multiplyMoney(pricePerPage, pages);
}
exports.calculatePrintCost = calculatePrintCost;
// Utility functions for dynamic filter options
const getDynamicFilterOptions = (users) => {
    const teams = new Set();
    const naoi = new Set();
    const tomeis = new Set();
    users.forEach(user => {
        // Extract teams from user data
        if (user.team) {
            teams.add(user.team);
        }
        // Extract ναοί from user data (users with userRole "Ναός")
        if (user.userRole === "Ναός") {
            naoi.add(user.displayName);
        }
        // Extract τομείς from user data (users with userRole "Τομέας")
        if (user.userRole === "Τομέας") {
            tomeis.add(user.displayName);
        }
        // Also extract from memberOf arrays for individual users
        if (user.memberOf && Array.isArray(user.memberOf)) {
            user.memberOf.forEach((member) => {
                if (member.includes("Ναός")) {
                    naoi.add(member);
                }
                else if (member.includes("Τομέας")) {
                    tomeis.add(member);
                }
                else {
                    // Assume it's a team if it doesn't contain "Ναός" or "Τομέας"
                    teams.add(member);
                }
            });
        }
    });
    // Define the specific order for teams
    const teamOrder = [
        "Ενωμένοι",
        "Σποριάδες",
        "Καρποφόροι",
        "Ολόφωτοι",
        "Νικητές",
        "Νικηφόροι",
        "Φλόγα",
        "Σύμψυχοι"
    ];
    // Sort teams according to the predefined order, with any additional teams at the end
    const sortedTeams = Array.from(teams).sort((a, b) => {
        const aIndex = teamOrder.indexOf(a);
        const bIndex = teamOrder.indexOf(b);
        // If both teams are in the predefined order, sort by their position
        if (aIndex !== -1 && bIndex !== -1) {
            return aIndex - bIndex;
        }
        // If only one team is in the predefined order, prioritize it
        if (aIndex !== -1)
            return -1;
        if (bIndex !== -1)
            return 1;
        // If neither team is in the predefined order, sort alphabetically
        return a.localeCompare(b);
    });
    return {
        teams: sortedTeams,
        naoi: Array.from(naoi).sort(),
        tomeis: Array.from(tomeis).sort()
    };
};
exports.getDynamicFilterOptions = getDynamicFilterOptions;
