const xlsx = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '../ΦΩΤΟΤΥΠΙΚΟ.xlsx');
const workbook = xlsx.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];

const data = xlsx.utils.sheet_to_json(sheet, { header: "A", defval: null });

// Rows 4 to 172 usually have data
const users = [];
for (let i = 3; i < 172; i++) {
    const row = data[i];
    if (!row) continue;
    
    const name = row['B'];
    const code = row['C'];
    
    if (code && !isNaN(Number(code))) {
        users.push({ name, code });
    }
}

console.log(JSON.stringify(users.slice(0, 50), null, 2));
console.log("Total users found:", users.length);
