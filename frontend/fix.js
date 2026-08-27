const fs = require('fs');
const path = require('path');

function replaceInDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      replaceInDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Fix double quotes mapping
      content = content.replace(/\"http:\/\/localhost:1337([^\"]+)\"/g, '\`${process.env.NEXT_PUBLIC_STRAPI_URL || \'http://localhost:1337\'}$1\`');
      
      // Fix template literals
      content = content.replace(/http:\/\/localhost:1337/g, '${process.env.NEXT_PUBLIC_STRAPI_URL || \'http://localhost:1337\'}');
      
      // Avoid double replacing if it got nested (just in case)
      content = content.replace(/\$\{process\.env\.NEXT_PUBLIC_STRAPI_URL \|\| 'http:\/\/localhost:1337'\}\$\{process\.env/g, '${process.env');
      
      fs.writeFileSync(fullPath, content);
    }
  }
}

replaceInDir('./src');
console.log('Replaced all API URLs!');
