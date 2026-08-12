const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'pages');
const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.html'));

let updatedCount = 0;

for (const file of files) {
  const filePath = path.join(pagesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // 1. Make Logo clickable to go home
  const logoTarget = '<div class="logo">LifeSync <span>AI</span></div>';
  const logoReplacement = '<div class="logo" onclick="window.location.href=\'../index.html\'" style="cursor: pointer;" title="Back to Home">LifeSync <span>AI</span></div>';
  if (content.includes(logoTarget)) {
    content = content.replace(logoTarget, logoReplacement);
    changed = true;
  }

  // 2. Add Back Button next to mobile menu button
  const menuBtnTarget = '</button>\n        <div>\n          <h1>';
  // Check if it already has the back button
  if (!content.includes('back-nav-btn') && content.includes(menuBtnTarget)) {
    const backBtnHtml = '</button>\n        <button onclick="history.back()" class="icon-btn back-nav-btn" title="Go Back" style="margin-right: 1rem;"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg></button>\n        <div>\n          <h1>';
    content = content.replace(menuBtnTarget, backBtnHtml);
    changed = true;
  } else if (!content.includes('back-nav-btn') && content.includes('</button>\r\n        <div>\r\n          <h1>')) {
    // Windows CRLF
    const menuBtnTargetCRLF = '</button>\r\n        <div>\r\n          <h1>';
    const backBtnHtmlCRLF = '</button>\r\n        <button onclick="history.back()" class="icon-btn back-nav-btn" title="Go Back" style="margin-right: 1rem;"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg></button>\r\n        <div>\r\n          <h1>';
    content = content.replace(menuBtnTargetCRLF, backBtnHtmlCRLF);
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    updatedCount++;
    console.log(`Updated ${file}`);
  }
}

console.log(`Successfully updated ${updatedCount} files.`);
