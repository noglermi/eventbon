[CmdletBinding()]
param(
  [string] $RootCertificatePath = (Join-Path $PSScriptRoot "generated\eventbon-root-ca.crt"),
  [string] $QzTrayDirectory = "",
  [switch] $NoRestart
)

$ErrorActionPreference = "Stop"

function Test-IsAdministrator {
  $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
  $principal = New-Object Security.Principal.WindowsPrincipal($identity)
  return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Find-QzTrayDirectory {
  $candidates = @()
  if ($env:ProgramFiles) {
    $candidates += Join-Path $env:ProgramFiles "QZ Tray"
  }

  $programFilesX86 = [Environment]::GetEnvironmentVariable("ProgramFiles(x86)")
  if ($programFilesX86) {
    $candidates += Join-Path $programFilesX86 "QZ Tray"
  }

  $candidates = $candidates | Where-Object { $_ -and (Test-Path -LiteralPath $_) }

  if ($candidates.Count -eq 0) {
    throw "QZ Tray installation directory was not found. Install QZ Tray first or pass -QzTrayDirectory."
  }

  return $candidates[0]
}

function Backup-IfExists {
  param(
    [string] $Path,
    [string] $BackupDirectory
  )

  if (Test-Path -LiteralPath $Path) {
    Copy-Item -LiteralPath $Path -Destination (Join-Path $BackupDirectory (Split-Path $Path -Leaf)) -Force
  }
}

function Set-AuthCertOverride {
  param(
    [string] $PropertiesPath,
    [string] $OverrideCertificatePath
  )

  $line = "authcert.override=$OverrideCertificatePath"

  if (Test-Path -LiteralPath $PropertiesPath) {
    $content = Get-Content -LiteralPath $PropertiesPath
    $updated = $false
    $content = $content | ForEach-Object {
      if ($_ -match "^\s*authcert\.override\s*=") {
        $updated = $true
        $line
      } else {
        $_
      }
    }
    if (-not $updated) {
      $content += $line
    }
    Set-Content -LiteralPath $PropertiesPath -Value $content -Encoding utf8
  } else {
    Set-Content -LiteralPath $PropertiesPath -Value @($line) -Encoding utf8
  }
}

function Stop-QzTray {
  Get-Process -ErrorAction SilentlyContinue |
    Where-Object { $_.ProcessName -match "qz" -and $_.Path -like "*QZ Tray*" } |
    Stop-Process -Force -ErrorAction SilentlyContinue
}

function Start-QzTray {
  param([string] $InstallDirectory)

  $exe = @(
    (Join-Path $InstallDirectory "qz-tray.exe"),
    (Join-Path $InstallDirectory "QZ Tray.exe")
  ) | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1

  if (-not $exe) {
    $exe = Get-ChildItem -LiteralPath $InstallDirectory -Filter "*.exe" -File -ErrorAction SilentlyContinue |
      Where-Object { $_.Name -match "qz|tray" } |
      Select-Object -First 1 -ExpandProperty FullName
  }

  if (-not $exe) {
    Write-Warning "Could not find QZ Tray executable. Please start QZ Tray manually."
    return
  }

  Start-Process -FilePath $exe | Out-Null
}

if (-not (Test-IsAdministrator)) {
  throw "Administrator rights are required to modify the QZ Tray installation directory."
}

if (-not (Test-Path -LiteralPath $RootCertificatePath)) {
  throw "Root certificate not found: $RootCertificatePath"
}

if (-not $QzTrayDirectory) {
  $QzTrayDirectory = Find-QzTrayDirectory
}

if (-not (Test-Path -LiteralPath $QzTrayDirectory)) {
  throw "QZ Tray directory does not exist: $QzTrayDirectory"
}

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupDirectory = Join-Path $PSScriptRoot "generated\qz-backup-$timestamp"
New-Item -ItemType Directory -Force -Path $backupDirectory | Out-Null

$overrideCertificatePath = Join-Path $QzTrayDirectory "override.crt"
$propertiesPath = Join-Path $QzTrayDirectory "qz-tray.properties"

Backup-IfExists -Path $overrideCertificatePath -BackupDirectory $backupDirectory
Backup-IfExists -Path $propertiesPath -BackupDirectory $backupDirectory

Copy-Item -LiteralPath $RootCertificatePath -Destination $overrideCertificatePath -Force
Set-AuthCertOverride -PropertiesPath $propertiesPath -OverrideCertificatePath $overrideCertificatePath

if (-not $NoRestart) {
  Stop-QzTray
  Start-Sleep -Seconds 2
  Start-QzTray -InstallDirectory $QzTrayDirectory
}

Write-Host "EventBon QZ trust installation complete."
Write-Host "QZ Tray directory: $QzTrayDirectory"
Write-Host "Installed public root certificate: $overrideCertificatePath"
Write-Host "Updated properties: $propertiesPath"
Write-Host "Backup directory: $backupDirectory"
Write-Host ""
Write-Host "No private keys were installed on this computer."
Write-Host ""
Write-Host "Rollback:"
Write-Host "1. Stop QZ Tray."
Write-Host "2. Restore files from: $backupDirectory"
Write-Host "3. Or remove '$overrideCertificatePath' and remove the 'authcert.override=' line from '$propertiesPath'."
Write-Host "4. Start QZ Tray again."
