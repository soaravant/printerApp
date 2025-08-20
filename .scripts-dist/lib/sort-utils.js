"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toggleSort = exports.sortData = void 0;
function sortData(data, sortConfig) {
    if (!sortConfig)
        return data;
    return [...data].sort((a, b) => {
        const aValue = getNestedValue(a, sortConfig.key);
        const bValue = getNestedValue(b, sortConfig.key);
        // Handle null/undefined values
        if (aValue == null && bValue == null)
            return 0;
        if (aValue == null)
            return sortConfig.direction === 'asc' ? -1 : 1;
        if (bValue == null)
            return sortConfig.direction === 'asc' ? 1 : -1;
        // Handle different data types
        if (typeof aValue === 'number' && typeof bValue === 'number') {
            return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
        }
        if (aValue instanceof Date && bValue instanceof Date) {
            return sortConfig.direction === 'asc'
                ? aValue.getTime() - bValue.getTime()
                : bValue.getTime() - aValue.getTime();
        }
        // Handle string values
        const aString = String(aValue).toLowerCase();
        const bString = String(bValue).toLowerCase();
        if (sortConfig.direction === 'asc') {
            return aString.localeCompare(bString, 'el');
        }
        else {
            return bString.localeCompare(aString, 'el');
        }
    });
}
exports.sortData = sortData;
function getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => {
        return current && current[key] !== undefined ? current[key] : null;
    }, obj);
}
function toggleSort(currentSort, newKey) {
    if ((currentSort === null || currentSort === void 0 ? void 0 : currentSort.key) === newKey) {
        return {
            key: newKey,
            direction: currentSort.direction === 'asc' ? 'desc' : 'asc'
        };
    }
    // Date columns should default to descending order (latest first)
    const dateColumns = ['timestamp', 'period', 'dueDate', 'lastPayment'];
    const isDateColumn = dateColumns.includes(newKey);
    // Money amount columns should default to descending order (largest first)
    const moneyColumns = ['totalCost', 'remainingBalance', 'paidAmount', 'amount', 'cost'];
    const isMoneyColumn = moneyColumns.includes(newKey);
    return {
        key: newKey,
        direction: (isDateColumn || isMoneyColumn) ? 'desc' : 'asc'
    };
}
exports.toggleSort = toggleSort;
