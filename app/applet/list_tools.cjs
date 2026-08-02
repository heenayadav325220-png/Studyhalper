const fs = require('fs');

const file = '/app/applet/android/app/src/main/assets/public/assets/InteractiveToolkit-C2hSgSbx.js';
if (!fs.existsSync(file)) {
  console.log('File does not exist');
  process.exit(1);
}

const content = fs.readFileSync(file, 'utf8');

// Let's find all the functions, tool definitions, etc.
// We can extract lines or blocks that have certain keywords.
const lines = content.split('\n');
console.log(`Total lines: ${lines.length}`);

// Since it's minified into one or few lines, split by semi-colons or common JS bundle structures to format it nicely.
const formatted = content.replace(/([;{}])/g, '$1\n');
fs.writeFileSync('/src/formatted_toolkit.txt', formatted);
console.log('Formatted toolkit file written to /src/formatted_toolkit.txt');
