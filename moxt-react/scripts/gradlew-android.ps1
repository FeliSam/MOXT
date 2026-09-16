# Runs the Android Gradle wrapper with Android Studio JBR (JAVA_HOME often unset in npm scripts).
$ErrorActionPreference = 'Stop'
$studioJbr = 'C:\Program Files\Android\Android Studio\jbr'
if (Test-Path $studioJbr) {
  $env:JAVA_HOME = $studioJbr
  $env:Path = "$studioJbr\bin;$env:Path"
}
$androidDir = Join-Path $PSScriptRoot '..\android'
if (-not $args.Count) { throw 'Usage: gradlew-android.ps1 assembleRelease|bundleRelease' }
Push-Location $androidDir
try {
  & .\gradlew.bat @args
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
} finally {
  Pop-Location
}
