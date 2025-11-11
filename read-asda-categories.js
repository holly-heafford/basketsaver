/**
 * Read and display ASDA_Complete_Categories.xlsx file contents
 */

const XLSX = require('xlsx');
const path = require('path');

const excelPath = path.join(__dirname, 'Supermarket Categories', 'ASDA_Complete_Categories.xlsx');

console.log('Reading Excel file:', excelPath);

// Read the Excel file
const workbook = XLSX.readFile(excelPath);

// Get the first sheet name
const sheetName = workbook.SheetNames[0];
console.log('\nSheet name:', sheetName);

// Get the worksheet
const worksheet = workbook.Sheets[sheetName];

// Convert to JSON
const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

console.log('\nTotal rows:', data.length);
console.log('\nFirst 20 rows:');
console.log('='.repeat(80));

data.slice(0, 20).forEach((row, index) => {
  console.log(`Row ${index}:`, row);
});

console.log('\n' + '='.repeat(80));
console.log('Total categories found:', data.length - 1); // Assuming first row is header

// Try to convert to objects if there are headers
const dataWithHeaders = XLSX.utils.sheet_to_json(worksheet);
console.log('\nSample data (first 5 entries with headers):');
dataWithHeaders.slice(0, 5).forEach((row, index) => {
  console.log(`\n${index + 1}.`, JSON.stringify(row, null, 2));
});
