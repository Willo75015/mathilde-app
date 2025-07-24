#!/usr/bin/env node

/**
 * 🔧 FIX MASSIF DES ERREURS REACT.FC ET IMPORTS
 * Corrige toutes les erreurs TypeScript causées par mon script précédent
 */

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, 'src');
let totalFixed = 0;

console.log('🔧 DÉMARRAGE DU FIX MASSIF REACT.FC...\n');

function fixReactImports(content, filePath) {
  let fixed = content;
  let hasChanges = false;
  
  // 1. CORRIGER LES ERREURS FC - Remplacer React.FC par des fonctions normales
  if (fixed.includes('Cannot find name \'FC\'') || fixed.includes(': FC<') || fixed.includes(': FC =')) {
    // Supprimer les types FC et les remplacer par des fonctions normales
    fixed = fixed.replace(/const\s+(\w+):\s*FC<([^>]*)>\s*=\s*\(/g, 'const $1 = (');
    fixed = fixed.replace(/const\s+(\w+):\s*FC\s*=\s*\(/g, 'const $1 = (');
    fixed = fixed.replace(/export\s+const\s+(\w+):\s*FC<([^>]*)>\s*=\s*\(/g, 'export const $1 = (');
    fixed = fixed.replace(/export\s+const\s+(\w+):\s*FC\s*=\s*\(/g, 'export const $1 = (');
    hasChanges = true;
  }
  
  // 2. AJOUTER LES IMPORTS REACT MANQUANTS
  const hasReactUsage = fixed.includes('useState') || fixed.includes('useEffect') || fixed.includes('JSX.Element') || fixed.includes('<') || fixed.includes('React.');
  const hasReactImport = fixed.includes('import React') || fixed.includes('import { React') || fixed.includes('from \'react\'');
  
  if (hasReactUsage && !hasReactImport) {
    // Ajouter import React en première ligne
    fixed = `import React from 'react'\n${fixed}`;
    hasChanges = true;
  }
  
  // 3. CORRIGER LES IMPORTS D'ICÔNES MANQUANTES
  const iconsToFix = [
    'Clock',
    'FilterDays',
    'Calendar'
  ];
  
  iconsToFix.forEach(icon => {
    if (fixed.includes(`Cannot find name '${icon}'`) || (fixed.includes(icon) && !fixed.includes(`import.*${icon}.*from.*lucide-react`))) {
      // Vérifier si il y a déjà un import lucide-react
      const lucideImportMatch = fixed.match(/import\s*\{([^}]+)\}\s*from\s*['"]lucide-react['"]/);
      if (lucideImportMatch) {
        // Ajouter l'icône à l'import existant
        const existingIcons = lucideImportMatch[1];
        if (!existingIcons.includes(icon)) {
          fixed = fixed.replace(
            /import\s*\{([^}]+)\}\s*from\s*['"]lucide-react['"]/,
            `import { ${existingIcons.trim()}, ${icon} } from 'lucide-react'`
          );
          hasChanges = true;
        }
      } else {
        // Créer un nouvel import lucide-react
        const reactImportMatch = fixed.match(/import.*from\s*['"]react['"]/);
        if (reactImportMatch) {
          fixed = fixed.replace(
            /(import.*from\s*['"]react['"])/,
            `$1\nimport { ${icon} } from 'lucide-react'`
          );
          hasChanges = true;
        }
      }
    }
  });
  
  // 4. CORRIGER LES EXPORTS CASSÉS
  fixed = fixed.replace(/export\s+{\s*default\s+as\s*}\s*from\s*['"][^'"]*['"]/g, '');
  fixed = fixed.replace(/export\s+default\s*$/g, 'export default CalendarPage');
  
  // 5. NETTOYER LES LIGNES VIDES MULTIPLES
  fixed = fixed.replace(/\n\s*\n\s*\n/g, '\n\n');
  
  return { fixed, hasChanges };
}

function processFiles(dir) {
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
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          const { fixed, hasChanges } = fixReactImports(content, filePath);
          
          if (hasChanges) {
            fs.writeFileSync(filePath, fixed, 'utf8');
            console.log(`✅ Corrigé: ${path.relative(SRC_DIR, filePath)}`);
            totalFixed++;
          }
        } catch (error) {
          console.log(`❌ Erreur: ${filePath} - ${error.message}`);
        }
      }
    }
  }
  
  walkDir(dir);
}

// DÉMARRER LE PROCESSING
processFiles(SRC_DIR);

console.log(`\n🎉 FIX TERMINÉ!`);
console.log(`📊 ${totalFixed} fichiers corrigés`);
console.log(`\n🚀 Maintenant teste: npm run dev`);
