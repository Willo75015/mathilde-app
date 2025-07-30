# Script de nettoyage des console.log pour Mathilde App
# Remplace tous les console.log par des commentaires

$projectPath = "C:\Users\Bill\Desktop\Github mathilde-app\src"

Write-Host "🧹 NETTOYAGE CONSOLE.LOG - MATHILDE APP" -ForegroundColor Yellow
Write-Host "Chemin: $projectPath" -ForegroundColor Gray

# Compter les fichiers avant
$beforeCount = (Get-ChildItem -Path $projectPath -Recurse -Include "*.ts", "*.tsx" | ForEach-Object {
    (Get-Content $_.FullName | Select-String "console\.log").Count
} | Measure-Object -Sum).Sum

Write-Host "📊 Console.log détectés: $beforeCount" -ForegroundColor Red

# Fonction de nettoyage
function Clean-ConsoleLogs {
    param($FilePath)
    
    $content = Get-Content $FilePath -Raw
    if ($content -match "console\.log") {
        # Remplacer console.log(...) par // Debug: ...
        $cleaned = $content -replace 'console\.log\([^)]*\);?', '// Debug: removed console.log'
        
        # Sauvegarder
        Set-Content -Path $FilePath -Value $cleaned -NoNewline
        return $true
    }
    return $false
}

# Traitement
$cleanedFiles = 0
Get-ChildItem -Path $projectPath -Recurse -Include "*.ts", "*.tsx" | ForEach-Object {
    if (Clean-ConsoleLogs $_.FullName) {
        $cleanedFiles++
        Write-Host "✅ Nettoyé: $($_.Name)" -ForegroundColor Green
    }
}

Write-Host "🎯 RÉSULTAT: $cleanedFiles fichiers nettoyés" -ForegroundColor Green

# Compter après
$afterCount = (Get-ChildItem -Path $projectPath -Recurse -Include "*.ts", "*.tsx" | ForEach-Object {
    (Get-Content $_.FullName | Select-String "console\.log").Count
} | Measure-Object -Sum).Sum

Write-Host "📈 Console.log restants: $afterCount" -ForegroundColor Blue
Write-Host "🚀 Gain: $($beforeCount - $afterCount) console.log supprimés" -ForegroundColor Magenta
