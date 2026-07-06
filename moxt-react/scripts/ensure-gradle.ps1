# Télécharge Gradle dans le cache wrapper (connexion lente / reprise BITS).
$ErrorActionPreference = 'Stop'

$studioJbr = 'C:\Program Files\Android\Android Studio\jbr'
if (Test-Path $studioJbr) {
  $env:JAVA_HOME = $studioJbr
  $env:Path = "$studioJbr\bin;$env:Path"
}

$version = '8.14.3'
$flavor = 'bin'
$zipName = "gradle-$version-$flavor.zip"
$url = "https://services.gradle.org/distributions/$zipName"
$cacheRoot = Join-Path $env:USERPROFILE '.gradle\wrapper\dists'
$flavorRoot = Join-Path $cacheRoot "gradle-$version-$flavor"
$androidDir = Join-Path $PSScriptRoot '..\android'

Write-Host ">> Gradle $zipName — verification du cache..."

Get-ChildItem $flavorRoot -Recurse -Filter '*.lck' -ErrorAction SilentlyContinue | Remove-Item -Force

$installed = Get-ChildItem $flavorRoot -Recurse -Filter 'gradle.bat' -ErrorAction SilentlyContinue |
  Where-Object { $_.FullName -match "\\gradle-$version\\bin\\gradle\.bat$" } |
  Select-Object -First 1

if ($installed) {
  Write-Host ">> Gradle deja installe : $($installed.FullName)"
  exit 0
}

Push-Location $androidDir
try {
  Write-Host ">> Telechargement via Gradle wrapper (timeout 10 min)..."
  & .\gradlew.bat --version
  if ($LASTEXITCODE -ne 0) {
    throw "gradlew --version a echoue (code $LASTEXITCODE)."
  }
  Write-Host ">> Gradle pret."
} finally {
  Pop-Location
}
