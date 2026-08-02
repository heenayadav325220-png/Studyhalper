const fs = require('fs');

const file = '/app/applet/android/app/src/main/assets/public/assets/InteractiveToolkit-C2hSgSbx.js';
if (!fs.existsSync(file)) {
  console.log('File does not exist');
  process.exit(1);
}

const content = fs.readFileSync(file, 'utf8');

// Format
const formatted = content.replace(/([;{}])/g, '$1\n');
if (!fs.existsSync('src')) {
  fs.mkdirSync('src');
}
fs.writeFileSync('src/formatted_toolkit.txt', formatted);
console.log('Formatted toolkit file written to src/formatted_toolkit.txt');
