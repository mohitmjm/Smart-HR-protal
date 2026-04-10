const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = dir + '/' + file;
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('./src');

for (const f of files) {
  let c = fs.readFileSync(f, 'utf8');
  
  // Replace direct @clerk/nextjs useUser destructurings with the dev safe version
  if (c.includes('@clerk/nextjs') && !c.includes('useDevSafeClerk') && !c.includes('useDevSafeUser as useUser')) {
    
    // Quick regex to find import { useUser, ...} from '@clerk/nextjs'
    const modified = c.replace(/import\s+\{([^}]+)\}\s+from\s+['"]@clerk\/nextjs['"]/g, (match, importsStr) => {
      const imports = importsStr.split(',').map(x => x.trim()).filter(Boolean);
      
      const requiresPatching = imports.includes('useUser') || imports.includes('useAuth') || imports.includes('useClerk');
      
      if (!requiresPatching) return match;

      const safeImports = imports.map(x => {
        if (x === 'useUser') return 'useDevSafeUser as useUser';
        if (x === 'useAuth') return 'useDevSafeAuth as useAuth';
        if (x === 'useClerk') return 'useDevSafeClerk as useClerk';
        return x;
      });

      return `import { ${safeImports.join(', ')} } from '@/lib/hooks/useDevSafeClerk';`;
    });
    
    if (modified !== c) {
      fs.writeFileSync(f, modified);
      console.log('Patched', f);
    }
  }
}
