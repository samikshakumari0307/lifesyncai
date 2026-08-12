const fs = require('fs');
const path = require('path');
const dir = './pages';

const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

files.forEach(f => {
  const p = path.join(dir, f);
  let content = fs.readFileSync(p, 'utf8');
  
  // Remove cursor and background elements
  content = content.replace(/<div class="cursor-dot"><\/div>\s*/g, '');
  content = content.replace(/<div class="cursor-outline"><\/div>\s*/g, '');
  content = content.replace(/<div class="noise-overlay"><\/div>\s*/g, '');
  content = content.replace(/<div class="grid-background"[^>]*><\/div>\s*/g, '');
  
  fs.writeFileSync(p, content);
  console.log('Cleaned ' + f);
});
