const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? 
      walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

let changedFiles = 0;

walkDir('src/app/api', (file) => {
  if (!file.endsWith('.ts')) return;
  const fullPath = path.resolve('e:/tielo-main/tielo-main', file);
  let content = fs.readFileSync(fullPath, 'utf8');
  
  const originalImport = "import { currentUser } from '@clerk/nextjs/server';";
  const newImport = "import { currentUser } from '@/lib/devAuthWrapper';";
  
  if (content.includes(originalImport)) {
    content = content.replace(originalImport, newImport);
    fs.writeFileSync(fullPath, content);
    changedFiles++;
    console.log('Updated', file);
  } else {
    // For when it's imported with other things, though maybe not in these files.
    // In our grep search, they were imported exactly as `import { currentUser } from '@clerk/nextjs/server';`
    // wait, in profile/route.ts it was `import { currentUser } from '@clerk/nextjs/server';`
  }
});

console.log('Total files updated: ' + changedFiles);
