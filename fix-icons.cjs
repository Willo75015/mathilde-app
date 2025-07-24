#!/usr/bin/env node

/**
 * 🔧 CORRECTION AUTOMATIQUE DES ICON: VIDES
 */

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, 'src');

function fixEmptyIcons(content, filePath) {
  let fixed = content;
  
  // Remplacer icon:} par icon: Clock}
  fixed = fixed.replace(/icon:\s*}/g, 'icon: Clock }');
  
  // Remplacer icon:, par icon: Clock,
  fixed = fixed.replace(/icon:\s*,/g, 'icon: Clock,');
  
  // Remplacer icon:\n par icon: Clock,\n
  fixed = fixed.replace(/icon:\s*\n/g, 'icon: Clock,\n');
  
  return fixed;
}

function processFiles(dir) {
  let filesProcessed = 0;
  
  function walkDir(currentPath) {
    const files = fs.readdirSync(currentPath);
    
    for (const file of files) {
      const filePath = path.join(currentPath, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        if (!['node_modules', 'dist', 'build', '.git'].includes(file)) {
          walkDir(filePath);
        }
      } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        const content = fs.readFileSync(filePath, 'utf8');
        const fixed = fixEmptyIcons(content, filePath);
        
        if (fixed !== content) {
          fs.writeFileSync(filePath, fixed, 'utf8');
          console.log(`✅ Corrigé: ${filePath}`);
          filesProcessed++;
        }
      }
    }
  }
  
  walkDir(dir);
  return filesProcessed;
}

console.log('🔧 CORRECTION DES ICON: VIDES...\n');
const filesProcessed = processFiles(SRC_DIR);
console.log(`\n✅ TERMINÉ! ${filesProcessed} fichiers corrigés.`);
