const fs = require('fs');
const files = [
  '/app/applet/android/app/src/main/assets/public/assets/index-CPm6MPqE.js',
  '/app/applet/android/app/src/main/assets/public/assets/InteractiveToolkit-C2hSgSbx.js'
];

files.forEach(file => {
  if (!fs.existsSync(file)) {
    console.log(`${file} does not exist`);
    return;
  }
  const content = fs.readFileSync(file, 'utf8');
  console.log(`--- File: ${file} (length: ${content.length}) ---`);
  
  // Find interesting words: panda, physics, 4G, poster, toolkit, etc.
  const keywords = ['panda', 'physics', '4g', 'poster', 'toolkit', 'thank you', 'dynamic queue', 'flashcard'];
  keywords.forEach(kw => {
    const regex = new RegExp(`.{0,150}${kw}.{0,150}`, 'gi');
    const matches = content.match(regex);
    if (matches) {
      console.log(`Keyword: ${kw} (${matches.length} matches)`);
      matches.slice(0, 10).forEach((m, idx) => {
        console.log(`  [${idx}]: ${m.trim().replace(/\s+/g, ' ')}`);
      });
    } else {
      console.log(`Keyword: ${kw} (no matches)`);
    }
  });
});
