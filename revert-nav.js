const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'pages');
const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.html'));

let updatedCount = 0;

for (const file of files) {
  const filePath = path.join(pagesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Revert back button
  const backBtnHtml1 = '<button onclick="history.back()" class="icon-btn back-nav-btn" title="Go Back" style="margin-right: 1rem;"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg></button>\n        ';
  const backBtnHtml2 = '<button onclick="history.back()" class="icon-btn back-nav-btn" title="Go Back" style="margin-right: 1rem;"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg></button>\r\n        ';
  
  if (content.includes(backBtnHtml1)) {
    content = content.replace(backBtnHtml1, '');
    changed = true;
  }
  if (content.includes(backBtnHtml2)) {
    content = content.replace(backBtnHtml2, '');
    changed = true;
  }

  // Also I'll remove the back button if it's missing the trailing newline
  const backBtnBare = '<button onclick="history.back()" class="icon-btn back-nav-btn" title="Go Back" style="margin-right: 1rem;"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg></button>';
  if (content.includes(backBtnBare)) {
      content = content.replace(backBtnBare, '');
      changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    updatedCount++;
    console.log(`Reverted ${file}`);
  }
}

console.log(`Successfully reverted ${updatedCount} files.`);
