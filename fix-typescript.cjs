#!/usr/bin/env node

/**
 * 🔧 SCRIPT DE CORRECTION TYPESCRIPT AUTOMATIQUE
 * Corrige automatiquement les erreurs TypeScript courantes
 */

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, 'src');

// Fonction pour lire un fichier
function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error(`❌ Erreur lecture ${filePath}:`, error.message);
    return null;
  }
}

// Fonction pour écrire un fichier
function writeFile(filePath, content) {
  try {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Corrigé: ${filePath}`);
    return true;
  } catch (error) {
    console.error(`❌ Erreur écriture ${filePath}:`, error.message);
    return false;
  }
}

// Fonction pour corriger les imports non utilisés
function fixUnusedImports(content, filePath) {
  let fixed = content;
  
  // Supprimer les imports React non utilisés (sauf si React.FC est utilisé)
  if (!fixed.includes('React.FC') && !fixed.includes('React.Component') && 
      !fixed.includes('React.useRef') && !fixed.includes('React.useState') &&
      !fixed.includes('React.useEffect') && !fixed.includes('React.memo')) {
    
    // Remplacer "import React from 'react'" par rien si pas utilisé
    fixed = fixed.replace(/import\s+React\s+from\s+['"]react['"];?\s*\n/g, '');
    
    // Remplacer "import React, { ... } from 'react'" par "import { ... } from 'react'"
    fixed = fixed.replace(/import\s+React,\s*\{\s*([^}]+)\s*\}\s*from\s+['"]react['"];?/g, 
                         "import { $1 } from 'react';");
  }
  
  // Supprimer les imports Calendar non utilisés
  if (!fixed.includes('<Calendar') && !fixed.includes('Calendar.') && 
      !fixed.includes('Calendar(') && !fixed.includes('{Calendar}')) {
    fixed = fixed.replace(/,?\s*Calendar\s*,?/g, (match) => {
      // Si c'est juste ", Calendar," -> supprimer 
      if (match.startsWith(',') && match.endsWith(',')) return ',';
      // Si c'est "Calendar," en début -> supprimer
      if (match.endsWith(',')) return '';
      // Si c'est ", Calendar" en fin -> supprimer
      if (match.startsWith(',')) return '';
      // Sinon juste supprimer
      return '';
    });
    
    // Nettoyer les virgules doubles
    fixed = fixed.replace(/,\s*,/g, ',');
    fixed = fixed.replace(/\{\s*,/g, '{');
    fixed = fixed.replace(/,\s*\}/g, '}');
  }
  
  return fixed;
}

// Fonction pour corriger les types React
function fixReactTypes(content) {
  let fixed = content;
  
  // Remplacer React.FC par FC avec import approprié
  if (fixed.includes('React.FC') && !fixed.includes('import { FC')) {
    // Ajouter l'import FC si pas déjà là
    if (fixed.includes("from 'react'")) {
      fixed = fixed.replace(
        /import\s*\{\s*([^}]+)\s*\}\s*from\s*['"]react['"];?/,
        (match, imports) => {
          if (!imports.includes('FC')) {
            return `import { ${imports.trim()}, FC } from 'react';`;
          }
          return match;
        }
      );
    } else {
      // Ajouter un nouvel import
      fixed = `import { FC } from 'react';\n${fixed}`;
    }
    
    // Remplacer React.FC par FC
    fixed = fixed.replace(/React\.FC/g, 'FC');
  }
  
  // Corriger les RefObject types
  fixed = fixed.replace(
    /React\.RefObject<([^>]+)\s*\|\s*null>/g, 
    'RefObject<$1>'
  );
  
  // Ajouter l'import RefObject si nécessaire
  if (fixed.includes('RefObject<') && !fixed.includes('import { RefObject')) {
    if (fixed.includes("from 'react'")) {
      fixed = fixed.replace(
        /import\s*\{\s*([^}]+)\s*\}\s*from\s*['"]react['"];?/,
        (match, imports) => {
          if (!imports.includes('RefObject')) {
            return `import { ${imports.trim()}, RefObject } from 'react';`;
          }
          return match;
        }
      );
    }
  }
  
  return fixed;
}

// Fonction pour parcourir récursivement les fichiers
function processFiles(dir) {
  let filesProcessed = 0;
  
  function walkDir(currentPath) {
    const files = fs.readdirSync(currentPath);
    
    for (const file of files) {
      const filePath = path.join(currentPath, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        // Ignorer node_modules, dist, etc.
        if (!['node_modules', 'dist', 'build', '.git'].includes(file)) {
          walkDir(filePath);
        }
      } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        // Traiter les fichiers TypeScript/React
        const content = readFile(filePath);
        if (content) {
          let fixed = content;
          fixed = fixUnusedImports(fixed, filePath);
          fixed = fixReactTypes(fixed);
          
          // Seulement écrire si le contenu a changé
          if (fixed !== content) {
            writeFile(filePath, fixed);
            filesProcessed++;
          }
        }
      }
    }
  }
  
  walkDir(dir);
  return filesProcessed;
}

// Script principal
function main() {
  console.log('🔧 CORRECTION TYPESCRIPT EN COURS...\n');
  
  const filesProcessed = processFiles(SRC_DIR);
  
  console.log(`\n✅ TERMINÉ! ${filesProcessed} fichiers corrigés.`);
  console.log('\n🚀 Vous pouvez maintenant essayer: npm run build');
}

// Exécuter le script
if (require.main === module) {
  main();
}

module.exports = { fixUnusedImports, fixReactTypes };
