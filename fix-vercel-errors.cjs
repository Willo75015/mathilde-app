// fix-vercel-errors.cjs
const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing TypeScript errors for Vercel deployment...');

// Fix 1: Add missing FC import
function fixFCImport(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Si le fichier utilise FC mais ne l'importe pas
  if (content.includes(': FC') && !content.includes('FC') && !content.includes('React.FC')) {
    // Ajouter FC à l'import React existant
    if (content.includes("import React from 'react'")) {
      content = content.replace(
        "import React from 'react'",
        "import React, { FC } from 'react'"
      );
    } else if (content.includes("import { ")) {
      // Ajouter FC à un import existant
      content = content.replace(
        /import \{ ([^}]+) \} from 'react'/,
        (match, imports) => {
          if (!imports.includes('FC')) {
            return `import { ${imports}, FC } from 'react'`;
          }
          return match;
        }
      );
    } else {
      // Ajouter un nouvel import
      content = `import { FC } from 'react';\n` + content;
    }
    
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed FC import in ${filePath}`);
  }
}

// Fix 2: Remove duplicate imports
function fixDuplicateImports(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Trouver tous les imports
  const importRegex = /import\s+(?:(?:\{[^}]*\})|(?:\*\s+as\s+\w+)|(?:\w+))\s+from\s+['"][^'"]+['"]/g;
  const imports = content.match(importRegex) || [];
  
  // Détecter les doublons
  const seen = new Set();
  const duplicates = [];
  
  imports.forEach(imp => {
    const normalized = imp.replace(/\s+/g, ' ').trim();
    if (seen.has(normalized)) {
      duplicates.push(imp);
    }
    seen.add(normalized);
  });
  
  // Supprimer les doublons
  duplicates.forEach(dup => {
    const firstIndex = content.indexOf(dup);
    const lastIndex = content.lastIndexOf(dup);
    if (firstIndex !== lastIndex) {
      content = content.substring(0, lastIndex) + content.substring(lastIndex + dup.length);
      console.log(`✅ Removed duplicate import in ${filePath}`);
    }
  });
  
  fs.writeFileSync(filePath, content);
}

// Fix 3: Fix Button href to onClick
function fixButtonHref(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Remplacer href par onClick sur les Button
  if (content.includes('<Button') && content.includes('href=')) {
    content = content.replace(
      /<Button([^>]*?)href="([^"]+)"([^>]*?)>/g,
      (match, before, url, after) => {
        return `<Button${before}onClick={() => window.location.href='${url}'}${after}>`;
      }
    );
    
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed Button href in ${filePath}`);
  }
}

// Parcourir tous les fichiers TSX
function processFiles(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      processFiles(filePath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      try {
        fixFCImport(filePath);
        fixDuplicateImports(filePath);
        if (file.endsWith('.tsx')) {
          fixButtonHref(filePath);
        }
      } catch (error) {
        console.error(`❌ Error processing ${filePath}:`, error.message);
      }
    }
  });
}

// Lancer le fix
processFiles('./src');

console.log('✅ Vercel error fixes completed!');
