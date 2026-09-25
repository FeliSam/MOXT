# Deploy moxt-site-og-shield on Dr_Sam (PowerShell). Uses `;` not `&&`.
# Does NOT change CDN origin by default — set -CutoverCdnOrigin to point CDN at the gateway (risky; has rollback).
param(
  [switch]$CutoverCdnOrigin,
  [switch]$RollbackCdnOrigin
)
$ErrorActionPreference = 'Stop'
$env:YC_CLI_INITIALIZATION_SILENCE = 'true'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path

if ($RollbackCdnOrigin) {
  Write-Host '▸ Rollback CDN to locked website origin (garde-fou PR #25)'
  yc cdn origin-group update --id 1003723678346200311 --name s3-moxtapp-web-website --origin "source=moxtapp-web.website.yandexcloud.net,enabled=true,meta.website.name=moxtapp-web"
  if ($LASTEXITCODE -ne 0) {
    yc cdn origin-group update --id 1003723678346200311 --name s3-moxtapp-web-website --origin "source=moxtapp-web.website.yandexcloud.net,enabled=true,meta-website-name=moxtapp-web"
  }
  yc cdn resource update bc8rz327qbtedt3vbafl --host-header moxtapp-web.website.yandexcloud.net
  yc cdn resource update bc8rz327qbtedt3vbafl --clear-rewrite
  yc cdn cache purge --resource-id=bc8rz327qbtedt3vbafl --all
  Write-Host 'Rollback done. Verify https://moxtapp.ru/ and JS content-type.'
  exit 0
}

$zip = Join-Path $env:TEMP 'moxt-site-og-shield.zip'
if (Test-Path $zip) { Remove-Item $zip -Force }
Compress-Archive -Path (Join-Path $here 'index.js'), (Join-Path $here 'package.json') -DestinationPath $zip -Force

$fn = yc serverless function get --name=moxt-site-og-shield --format json 2>$null
if (-not $fn) {
  yc serverless function create --name=moxt-site-og-shield --description='Crawler OG for moxtapp.ru entity paths' | Out-Null
}

yc serverless function version create `
  --function-name=moxt-site-og-shield `
  --runtime=nodejs18 `
  --entrypoint=index.handler `
  --memory=128m `
  --execution-timeout=15s `
  --source-path=$zip `
  --environment "SHARE_PREVIEW_UPSTREAM=https://rbvqfkccbkwjxkvpnwqn.supabase.co/functions/v1/share-preview,SPA_WEBSITE_ORIGIN=https://moxtapp-web.website.yandexcloud.net,MOXT_SITE_URL=https://moxtapp.ru"

yc serverless function allow-unauthenticated-invoke moxt-site-og-shield

$fnJson = yc serverless function get --name=moxt-site-og-shield --format json | ConvertFrom-Json
$fid = $fnJson.id
Write-Host "Function id: $fid"

$spec = Get-Content (Join-Path $here 'openapi-fragment.yaml') -Raw
$spec = $spec.Replace('FUNCTION_ID', $fid)
$specPath = Join-Path $env:TEMP 'moxt-site-og-openapi.yaml'
Set-Content -Path $specPath -Value $spec -Encoding utf8

$gw = yc serverless api-gateway get --name=moxt-site-og --format json 2>$null
if (-not $gw) {
  Write-Host '▸ Creating API Gateway moxt-site-og'
  yc serverless api-gateway create --name=moxt-site-og --spec=$specPath
} else {
  Write-Host '▸ Updating API Gateway moxt-site-og'
  yc serverless api-gateway update --name=moxt-site-og --spec=$specPath
}

$gwJson = yc serverless api-gateway get --name=moxt-site-og --format json | ConvertFrom-Json
Write-Host "Gateway domain: $($gwJson.domain)"
Write-Host "Gateway id: $($gwJson.id)"

Write-Host @'

Manual proof (before CDN cutover):
  curl -s -A "WhatsApp/2.23" "https://<gateway-domain>/parcels/COL-..." | findstr og:title

Garde-fou — DO NOT:
  - yc cdn resource update … --rewrite-body "^/(.*)$ /index.html"
  - Point CDN origin at Storage API (*.storage.yandexcloud.net)

Safe CDN cutover (optional, -CutoverCdnOrigin):
  Sets CDN HTTP origin to this gateway so moxtapp.ru entity paths hit the shield.
  Rollback: re-run this script with -RollbackCdnOrigin

'@

if ($CutoverCdnOrigin) {
  $domain = $gwJson.domain
  if (-not $domain) { throw 'Gateway domain missing' }
  Write-Host "▸ Cutover CDN origin → HTTP $domain (keep rewrite CLEARED)"
  yc cdn origin-group update --id 1003723678346200311 --name moxt-site-og-gw --origin "source=$domain,enabled=true"
  yc cdn resource update bc8rz327qbtedt3vbafl --host-header $domain
  yc cdn resource update bc8rz327qbtedt3vbafl --clear-rewrite
  yc cdn cache purge --resource-id=bc8rz327qbtedt3vbafl --all
  Write-Host 'Verify crawler OG + browser SPA. Rollback with -RollbackCdnOrigin if broken.'
}
