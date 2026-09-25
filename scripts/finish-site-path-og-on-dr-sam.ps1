# Apply fix/site-path-og-crawlers on Dr_Sam Moxt-wt-cpd, push PR, deploy shield (no CDN cutover by default).
$ErrorActionPreference = 'Stop'
$Repo = if ($args[0]) { $args[0] } else { 'C:\Users\felic\Videos\Moxt-wt-cpd' }
Set-Location $Repo
git fetch origin main
git checkout main
git pull --ff-only origin main
# Prefer remote branch if already pushed from box; else expect local commits / bundle
git fetch origin fix/site-path-og-crawlers:fix/site-path-og-crawlers 2>$null
if ($LASTEXITCODE -ne 0) {
  Write-Host 'Remote branch missing — create from box push or apply bundle first.'
}
git checkout fix/site-path-og-crawlers
git push -u origin HEAD
gh pr create --base main --head fix/site-path-og-crawlers `
  --title "fix(og): crawler OG for moxtapp.ru entity paths (UA shield, no nuclear CDN)" `
  --body @"
## Summary
- ``parseAppEntityPath`` maps ``/parcels``, ``/marketplace``, ``/jobs``, ``/events``, ``/businesses``, ``/users``, ``/p2p``, ``/news``, ``/feed?item=`` → share kinds.
- ``share-preview`` accepts those site paths (deployed live).
- ``infra/site-og-shield``: crawler UA → share-preview HTML; browsers → SPA index.
- Cherry-picked CDN website-origin garde-fou (``MOXT_CDN_LOCK`` / ``assertCdnSpaGuard``).
- **Does not** enable nuclear CDN rewrite.

## Deploy (Dr_Sam)
``````powershell
cd infra\site-og-shield
.\deploy-on-drsam.ps1
# after gateway proof:
.\deploy-on-drsam.ps1 -CutoverCdnOrigin
``````

## Test plan
- [ ] WhatsApp UA on Edge ``…/share-preview/parcels/COL-…`` → real og:title, og:image ≠ X.png
- [ ] After cutover: WhatsApp UA on ``https://moxtapp.ru/parcels/…`` same
- [ ] Mozilla UA still gets SPA shell
- [ ] ``/assets/index-*.js`` → ``application/javascript``
"@
Write-Host 'Next: deploy shield'
Set-Location (Join-Path $Repo 'infra\site-og-shield')
.\deploy-on-drsam.ps1
