# Configure GitHub Actions secrets/variables for Yandex deploy.
# Usage: .\scripts\setup-github-secrets.ps1

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $root

function Find-Gh {
  $paths = @(
    "$env:ProgramFiles\GitHub CLI\gh.exe",
    "$env:LOCALAPPDATA\Programs\GitHub CLI\gh.exe"
  )
  foreach ($p in $paths) {
    if (Test-Path $p) {
      $ghDir = Split-Path $p -Parent
      if ($env:Path -notlike "*$ghDir*") {
        $env:Path = "$ghDir;$env:Path"
      }
      return $p
    }
  }
  if (Get-Command gh -ErrorAction SilentlyContinue) { return 'gh' }
  return $null
}

if (-not $env:GITHUB_TOKEN -and -not $env:GH_TOKEN) {
  $gh = Find-Gh
  if ($gh) {
    Write-Host ''
    Write-Host 'GitHub CLI detecte - connexion navigateur...'
    & $gh auth status *> $null
    if ($LASTEXITCODE -ne 0) {
      & $gh auth login --hostname github.com --git-protocol https --scopes repo,workflow --web
    }
    $env:GITHUB_TOKEN = & $gh auth token
  } else {
    Write-Host ''
    Write-Host 'GitHub CLI non installe.'
    Write-Host 'Installez: https://cli.github.com/  (recommande, connexion auto)'
    Write-Host 'Ou PAT manuel: https://github.com/settings/tokens'
    Write-Host ''
    $secure = Read-Host 'Collez le PAT (ou Ctrl+C pour installer gh)' -AsSecureString
    $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
    try {
      $env:GITHUB_TOKEN = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
    } finally {
      [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
    }
  }
}

if (-not (Test-Path 'scripts\github-deploy-sa.json')) {
  Write-Host 'scripts\github-deploy-sa.json introuvable - lancement setup:github-yandex...'
  npm run setup:github-yandex
}

npm run setup:github-secrets
