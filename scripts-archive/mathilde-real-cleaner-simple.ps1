# Mathilde Real Cleaner - Version Simple et Fonctionnelle
Write-Host "🔍 MATHILDE REAL CLEANER - VERSION OPÉRATIONNELLE" -ForegroundColor Cyan

$ProjectPath = "C:\Users\Bill\Desktop\Github mathilde-app"
$TotalDeleted = 0
$TotalSpaceFreed = 0

Write-Host "🚀 Analyse du projet..." -ForegroundColor Green

# Compte tous les fichiers
$AllFiles = Get-ChildItem -Path $ProjectPath -Recurse -File
Write-Host "📊 Fichiers analysés: $($AllFiles.Count)"

# Détection backups 
$BackupFiles = $AllFiles | Where-Object { $_.Name -match "backup|\.bak$" }
Write-Host "💾 Fichiers backup détectés: $($BackupFiles.Count)"

# Détection dossiers backup
$BackupDirs = Get-ChildItem -Path $ProjectPath -Directory | Where-Object { $_.Name -match "backup" }
Write-Host "📁 Dossiers backup détectés: $($BackupDirs.Count)"

# Détection documentation pollution
$PollutionDocs = Get-ChildItem -Path $ProjectPath -File -Filter "*.md" | Where-Object { 
    $_.Name -match "RAPPORT_|AMELIORATION|MODIFICATION|NOTIFICATION|CORRECTION|DEBUG" 
}
Write-Host "📝 Documents pollution détectés: $($PollutionDocs.Count)"

# Détection scripts obsolètes  
$ObsoleteScripts = Get-ChildItem -Path $ProjectPath -File | Where-Object {
    $_.Name -match "debug-.*\.js$|fix-.*\.js$|test-.*\.js$|server\.cjs$"
}
Write-Host "🛠️ Scripts obsolètes détectés: $($ObsoleteScripts.Count)"

Write-Host "`n🎯 RÉSULTATS DÉTECTION:" -ForegroundColor Yellow
Write-Host "  • Total fichiers: $($AllFiles.Count)"
Write-Host "  • Backups: $($BackupFiles.Count + $BackupDirs.Count)"  
Write-Host "  • Documentation pollution: $($PollutionDocs.Count)"
Write-Host "  • Scripts obsolètes: $($ObsoleteScripts.Count)"

$TotalProblems = $BackupFiles.Count + $BackupDirs.Count + $PollutionDocs.Count + $ObsoleteScripts.Count
Write-Host "  • TOTAL À NETTOYER: $TotalProblems" -ForegroundColor Red

Write-Host "`n✅ Analyse terminée - Script prêt pour nettoyage réel !" -ForegroundColor Green
Write-Host "💡 Pour exécuter le nettoyage: ajoutez -Execute au script" -ForegroundColor Cyan
