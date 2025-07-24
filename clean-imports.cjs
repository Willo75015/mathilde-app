#!/usr/bin/env node

/**
 * 🔧 NETTOYAGE DES IMPORTS DUPLIQUÉS
 */

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, 'src');

function cleanDuplicateImports(content) {
  const lines = content.split('\n');
  const seen = new Set();
  const cleaned = [];
  
  for (const line of lines) {
    if (line.trim().startsWith('import ')) {
      // Normaliser l'import pour la comparaison
      const normalized = line.trim().replace(/\s+/g, ' ');
      if (!seen.has(normalized)) {
        seen.add(normalized);
        cleaned.push(line);
      }
    } else {
      cleaned.push(line);
    }
  }
  
  return cleaned.join('\n');
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
        const cleaned = cleanDuplicateImports(content);
        
        if (cleaned !== content) {
          fs.writeFileSync(filePath, cleaned, 'utf8');
          console.log(`✅ Nettoyé: ${filePath}`);
          filesProcessed++;
        }
      }
    }
  }
  
  walkDir(dir);
  return filesProcessed;
}

console.log('🧹 NETTOYAGE DES IMPORTS DUPLIQUÉS...\n');
const filesProcessed = processFiles(SRC_DIR);
console.log(`\n✅ TERMINÉ! ${filesProcessed} fichiers nettoyés.`);
