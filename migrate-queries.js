const fs = require('fs');
const path = require('path');

const jsDir = './js';
const files = fs.readdirSync(jsDir).filter(f => f.endsWith('.js') && !['firebase.js', 'auth.js', 'auth-multi.js', 'script.js', 'utils.js', 'settings.js'].includes(f));

files.forEach(file => {
  let content = fs.readFileSync(path.join(jsDir, file), 'utf8');

  // Replace collection(db, "...") -> collection(db, "users", currentUser.uid, "...")
  content = content.replace(/collection\(db,\s*"([^"]+)"\)/g, (match, col) => {
    if (col === 'users') return match;
    return `collection(db, "users", currentUser.uid, "${col}")`;
  });

  // Replace doc(db, "...", id) -> doc(db, "users", currentUser.uid, "...", id)
  content = content.replace(/doc\(db,\s*"([^"]+)",\s*([^)]+)\)/g, (match, col, id) => {
    if (col === 'users') return match;
    return `doc(db, "users", currentUser.uid, "${col}", ${id})`;
  });

  // Remove where("uid", "==", currentUser.uid), and any trailing comma/spaces
  // Using a robust regex to handle newlines, spaces, and trailing commas
  content = content.replace(/where\("uid",\s*"==",\s*currentUser\.uid\)\s*,?\s*/g, '');

  // If a trailing comma was left in a query call, like query(...,)
  content = content.replace(/,\s*\)/g, ')');

  // Remove the uid field from addDoc/setDoc objects
  content = content.replace(/uid:\s*currentUser\.uid\s*,?\s*/g, '');

  fs.writeFileSync(path.join(jsDir, file), content);
  console.log(`Updated ${file}`);
});
