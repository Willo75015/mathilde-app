#!/usr/bin/env node

/**
 * 🔧 CORRECTION SPÉCIFIQUE DES ERREURS ICON CASSÉES
 */

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, 'src');

function fixBrokenIcons(content, filePath) {
  let fixed = content;
  
  // Corriger "icon: current:" vers "icon: Calendar, current:"
  fixed = fixed.replace(/icon:\s*current:/g, 'icon: Calendar, current:');
  
  // Corriger les exports cassés comme "export { default as} from './''"
  fixed = fixed.replace(/export\s*\{\s*default\s+as\s*\}\s*from\s*['"][^'"]*['"]/g, '');
  
  // Nettoyer les lignes vides multiples
  fixed = fixed.replace(/\n\s*\n\s*\n/g, '\n\n');
  
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
        const fixed = fixBrokenIcons(content, filePath);
        
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

console.log('🔧 CORRECTION DES ERREURS ICON CASSÉES...\n');
const filesProcessed = processFiles(SRC_DIR);
console.log(`\n✅ TERMINÉ! ${filesProcessed} fichiers corrigés.`);
