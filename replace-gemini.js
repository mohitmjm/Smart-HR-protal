const fs = require('fs');
const path = require('path');

function walkDir(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walkDir(file));
        } else if (file.endsWith('.ts')) { 
            results.push(file);
        }
    });
    return results;
}

const files = walkDir('e:/HR-Portal-Innovatrix/HR-main/src');
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    if (content.includes('gemini-2.5-flash')) {
        content = content.replace(/gemini-2\.5-flash/g, 'gemini-3.1-flash-lite');
        fs.writeFileSync(file, content, 'utf8');
        console.log('Updated to Gemini 3.1: ' + file);
    }
});
