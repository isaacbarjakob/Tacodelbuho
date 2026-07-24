$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$indexPath = Join-Path $root "index.html"
$headersPath = Join-Path $root "_headers"
$adapterPath = Join-Path $root "ll-admin-adapter.js"

if (-not (Test-Path $indexPath)) {
  Write-Host ""
  Write-Host "FEL: index.html hittades inte." -ForegroundColor Red
  Write-Host "Kopiera filerna i denna ZIP till roten av Taco del Buho-repot och kör igen."
  Read-Host "Tryck Enter för att stänga"
  exit 1
}

if (-not (Test-Path $adapterPath)) {
  Write-Host "FEL: ll-admin-adapter.js saknas." -ForegroundColor Red
  Read-Host "Tryck Enter för att stänga"
  exit 1
}

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
Copy-Item $indexPath "$indexPath.lladmin-backup-$timestamp"

$index = Get-Content $indexPath -Raw
if ($index -notmatch 'll-admin-adapter\.js') {
  $needle = '<script src="script.js"></script>'
  if ($index.Contains($needle)) {
    $replacement = '<script src="ll-admin-adapter.js"></script>' + [Environment]::NewLine + $needle
    $index = $index.Replace($needle, $replacement)
  } else {
    $index = $index.Replace('</body>', '<script src="ll-admin-adapter.js"></script>' + [Environment]::NewLine + '</body>')
  }
  Set-Content -Path $indexPath -Value $index -Encoding UTF8
}

$block = @"
# LL ADMIN PREVIEW START
/*
  ! X-Frame-Options
  Content-Security-Policy: frame-ancestors 'self' https://ll-admin.pages.dev
# LL ADMIN PREVIEW END
"@

if (Test-Path $headersPath) {
  Copy-Item $headersPath "$headersPath.lladmin-backup-$timestamp"
  $current = Get-Content $headersPath -Raw
  $current = [regex]::Replace(
    $current,
    '(?ms)^# LL ADMIN PREVIEW START.*?^# LL ADMIN PREVIEW END\s*',
    ''
  )
  $combined = $current.TrimEnd() + [Environment]::NewLine + [Environment]::NewLine + $block + [Environment]::NewLine
  Set-Content -Path $headersPath -Value $combined -Encoding UTF8
} else {
  Set-Content -Path $headersPath -Value ($block + [Environment]::NewLine) -Encoding UTF8
}

Write-Host ""
Write-Host "KLART: Taco-adaptern ar installerad." -ForegroundColor Green
Write-Host "GitHub Desktop ska nu visa index.html, _headers och ll-admin-adapter.js som andrade filer."
Write-Host ""
Read-Host "Tryck Enter för att stänga"
