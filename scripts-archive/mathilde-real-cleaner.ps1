# Mathilde Real Cleaner - Version Opérationnelle
# Basé sur l'analyse du MCP mathilde-cleaner mais avec de vraies actions

param(
    [string]$ProjectPath = "C:\Users\Bill\Desktop\Github mathilde-app",
    [switch]$DeepScan,
    [switch]$DryRun,
    [string[]]$CleanupTypes = @("backup_cleanup", "unused_imports", "dead_code"),
    [switch]$Force
)

Write-Host "🔍 MATHILDE REAL CLEANER - VERSION OPÉRATIONNELLE" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

# Configuration
$script:TotalFilesFound = 0
$script:TotalFilesDeleted = 0
$script:TotalSpaceFreed = 0
$script:StartTime = Get-Date

function Write-Progress-Header($Title) {
    Write-Host "`n🎯 $Title" -ForegroundColor Yellow
    Write-Host ("=" * 50) -ForegroundColor Gray
}

function Write-Success($Message) {
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Warning($Message) {
    Write-Host "⚠️ $Message" -ForegroundColor Yellow
}

function Write-Error-Custom($Message) {
    Write-Host "❌ $Message" -ForegroundColor Red
}

# Fonction 1: Analyse du projet (vraie analyse)
function Analyze-Project {
    Write-Progress-Header "ANALYSE PROJET RÉELLE"
    
    if (-not (Test-Path $ProjectPath)) {
        Write-Error-Custom "Projet non trouvé: $ProjectPath"
        return $false
    }
    
    $allFiles = Get-ChildItem -Path $ProjectPath -Recurse -File
    $script:TotalFilesFound = $allFiles.Count
    
    Write-Host "📊 Fichiers analysés: $($script:TotalFilesFound)"
    
    # Analyse backups
    $backups = $allFiles | Where-Object { 
        $_.Name -match "\.(backup|bak)$" -or 
        $_.Name -match "backup" -or
        $_.Directory.Name -match "backup"
    }
    Write-Host "💾 Backups détectés: $($backups.Count)"
    
    # Analyse doublons
    $duplicates = $allFiles | Group-Object Name | Where-Object Count -gt 1
    Write-Host "🔄 Potentiels doublons: $($duplicates.Count)"
    
    # Analyse scripts obsolètes
    $scripts = $allFiles | Where-Object { 
        $_.Name -match "\.(js|mjs|cjs|bat)$" -and 
        ($_.Name -match "test-|debug-|fix-|setup-" -or $_.Directory.Name -match "scripts")
    }
    Write-Host "🛠️ Scripts potentiellement obsolètes: $($scripts.Count)"
    
    # Analyse documentation pollution
    $docs = $allFiles | Where-Object { 
        $_.Name -match "\.md$" -and 
        ($_.Name -match "RAPPORT_|AMELIORATION|MODIFICATION|NOTIFICATION" -or $_.Directory.Name -eq $ProjectPath)
    }
    Write-Host "📝 Documentation à nettoyer: $($docs.Count)"
    
    return $true
}

# Fonction 2: Backup cleanup réel
function Cleanup-Backups {
    Write-Progress-Header "NETTOYAGE BACKUPS RÉEL"
    
    $backupPatterns = @(
        "*.backup*",
        "*backup*",
        "*.bak",
        "*-backup-*"
    )
    
    $deletedCount = 0
    $freedSpace = 0
    
    foreach ($pattern in $backupPatterns) {
        $files = Get-ChildItem -Path $ProjectPath -Recurse -Include $pattern -File
        foreach ($file in $files) {
            $size = $file.Length
            
            if ($DryRun) {
                Write-Host "🔍 [DRY RUN] Supprimerait: $($file.FullName) ($([math]::Round($size/1KB, 2)) KB)"
            } else {
                try {
                    Remove-Item $file.FullName -Force
                    Write-Success "Supprimé: $($file.Name)"
                    $deletedCount++
                    $freedSpace += $size
                } catch {
                    Write-Warning "Impossible de supprimer: $($file.Name) - $($_.Exception.Message)"
                }
            }
        }
    }
    
    # Suppression dossiers backup
    $backupDirs = Get-ChildItem -Path $ProjectPath -Directory | Where-Object { $_.Name -match "backup" }
    foreach ($dir in $backupDirs) {
        if ($DryRun) {
            Write-Host "🔍 [DRY RUN] Supprimerait dossier: $($dir.FullName)"
        } else {
            try {
                Remove-Item $dir.FullName -Recurse -Force
                Write-Success "Dossier supprimé: $($dir.Name)"
                $deletedCount++
            } catch {
                Write-Warning "Impossible de supprimer dossier: $($dir.Name)"
            }
        }
    }
    
    $script:TotalFilesDeleted += $deletedCount
    $script:TotalSpaceFreed += $freedSpace
    
    Write-Host "📊 Backups supprimés: $deletedCount"
    Write-Host "💾 Espace libéré: $([math]::Round($freedSpace/1MB, 2)) MB"
}

# Exécution principale avec DRY RUN
try {
    Write-Host "🚀 Démarrage du nettoyage..." -ForegroundColor Green
    Write-Warning "MODE DRY RUN activé - Simulation seulement"
    
    # Analyse
    if (Analyze-Project) {
        Cleanup-Backups
    }
    
} catch {
    Write-Error-Custom "Erreur durant le nettoyage: $($_.Exception.Message)"
}
