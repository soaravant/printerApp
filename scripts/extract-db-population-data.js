const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

const filePath = path.join(__dirname, '../ΦΩΤΟΤΥΠΙΚΟ.xlsx');
const workbook = xlsx.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];

const data = xlsx.utils.sheet_to_json(sheet, { header: "A", defval: null });

const usersList = [];
const teamsList = [];
const naosList = [];
const tomeisList = [];

const teamNames = [
    "Ενωμένοι", "Σποριάδες", "Καρποφόροι", "Ολόφωτοι", "Νικητές", "Νικηφόροι Jr",
    "Καθαριότητας", "Λατρευτικός", "Καλλιτεχνικός", "Αθλητικός", "Βιβλιοθήκης",
    "Μουσικός", "Φωτογραφικός", "Εκδοτικός", "Υπολογιστών", "Φαρμακείου",
    "Αγάπης", "Ψυχαγωγικός", "Μήνυμα", "Audio", "Εργαστηρίου"
];

for (let i = 3; i < 172; i++) {
    const row = data[i];
    if (!row) continue;

    const name = row['B'];
    const code = row['C'];

    if (code && !isNaN(Number(code)) && name) {
        const entry = { name: name.trim(), code: Number(code) };
        const upperName = entry.name.toUpperCase();

        if (upperName.startsWith('Ι.Ν.') || upperName.startsWith('Ι. Ν.')) {
            naosList.push(entry);
        } else if (upperName.includes('ΤΟΜΕ')) {
            tomeisList.push(entry);
        } else if (teamNames.some(t => upperName.includes(t.toUpperCase()))) {
            teamsList.push(entry);
        } else {
            usersList.push(entry);
        }
    }
}

const result = {
    users: usersList,
    teams: teamsList,
    naos: naosList,
    tomeis: tomeisList
};

fs.writeFileSync(path.join(__dirname, '../db-population-data.json'), JSON.stringify(result, null, 2));

console.log(`Extracted: ${usersList.length} users, ${teamsList.length} teams, ${naosList.length} naos, ${tomeisList.length} tomeis.`);
