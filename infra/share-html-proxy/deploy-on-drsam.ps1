$ErrorActionPreference = 'Stop'
$env:YC_CLI_INITIALIZATION_SILENCE = 'true'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$zip = Join-Path $env:TEMP 'moxt-share-html-proxy.zip'
if (Test-Path $zip) { Remove-Item $zip -Force }
Compress-Archive -Path (Join-Path $here 'index.js'), (Join-Path $here 'package.json') -DestinationPath $zip -Force

$fn = yc serverless function get --name=moxt-share-html-proxy --format json 2>$null
if (-not $fn) {
  yc serverless function create --name=moxt-share-html-proxy --description='OG HTML+PNG proxy for share.moxtapp.ru' | Out-Null
}

yc serverless function version create `
  --function-name=moxt-share-html-proxy `
  --runtime=nodejs18 `
  --entrypoint=index.handler `
  --memory=128m `
  --execution-timeout=15s `
  --source-path=$zip `
  --environment SHARE_PREVIEW_UPSTREAM=https://rbvqfkccbkwjxkvpnwqn.supabase.co/functions/v1/share-preview

yc serverless function allow-unauthenticated-invoke moxt-share-html-proxy
Write-Host 'Proxy version deployed. Gateway /share/{proxy+} already covers /share/og-card/*.'
