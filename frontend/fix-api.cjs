const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src', 'pages');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx') && f !== 'ProductManagement.jsx');

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  if (content.includes('fetch(') && !content.includes('import { API_BASE }')) {
    // Import API_BASE
    content = content.replace(/import \{.*\} from 'react';/, match => match + "\nimport { API_BASE } from '../utils/api';");
    
    // Replace '/api/...' with `${API_BASE}/...`
    content = content.replace(/fetch\('\/api/g, "fetch(`${API_BASE}");
    content = content.replace(/fetch\(`\/api/g, "fetch(`${API_BASE}");
    
    // If the string was enclosed in single quotes, change to backticks
    // fetch(`${API_BASE}/technicians') -> fetch(`${API_BASE}/technicians`)
    content = content.replace(/fetch\(`\$\{API_BASE\}(.*?)'\)/g, "fetch(`${API_BASE}$1`)");

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file}`);
  }
}
