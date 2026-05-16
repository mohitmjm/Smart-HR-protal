const fs = require('fs');

const filesToFix = [
  'e:/HR-Portal-Innovatrix/HR-main/src/app/api/leaves/route.ts',
  'e:/HR-Portal-Innovatrix/HR-main/src/app/api/leads/route.ts',
  'e:/HR-Portal-Innovatrix/HR-main/src/lib/langGraph/nodes/actions/applyLeave.ts'
];

filesToFix.forEach(file => {
  if (fs.existsSync(file)) {
    const buffer = fs.readFileSync(file);
    // Convert to string. Invalid utf-8 bytes become  (\uFFFD)
    let str = buffer.toString('utf8');
    // Remove the replacement character entirely to clean it up
    str = str.replace(/\uFFFD/g, '');
    fs.writeFileSync(file, str, 'utf8');
    console.log('Cleaned file:', file);
  } else {
    console.log('File not found:', file);
  }
});
