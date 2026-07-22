#!/usr/bin/env pwsh
# verify.ps1 - repo-real verification for Professional Portfolio.
# Runs ONLY commands defined in package.json. It does NOT install dependencies, deploy (GitHub Pages /
# Cloudflare), or start a dev server. Exit: 0 = passed, 1 = a required check failed, 2 = env not ready.
#
# Usage:  pwsh scripts/verify.ps1          # lint + test + build
#         pwsh scripts/verify.ps1 -Quick   # lint + test only (skips the heavier tsc+vite build)

[CmdletBinding()]
param([switch]$Quick)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location -Path $repoRoot

if (-not (Test-Path (Join-Path $repoRoot 'node_modules'))) {
    Write-Host "node_modules missing - run 'npm install' first (this script never installs)." -ForegroundColor Yellow
    exit 2
}

$script:failed = @()

function Invoke-Check {
    param([Parameter(Mandatory)][string]$Name, [Parameter(Mandatory)][string[]]$NpmArgs)
    Write-Host ""
    Write-Host "=== $Name ===" -ForegroundColor Cyan
    Write-Host "> npm $($NpmArgs -join ' ')" -ForegroundColor DarkGray
    & npm @NpmArgs
    if ($LASTEXITCODE -ne 0) { Write-Host "REQUIRED check '$Name' FAILED (exit $LASTEXITCODE)." -ForegroundColor Red; $script:failed += $Name }
    else { Write-Host "OK: $Name" -ForegroundColor Green }
}

Invoke-Check -Name 'lint' -NpmArgs @('run', 'lint')
Invoke-Check -Name 'test' -NpmArgs @('test')

if (-not $Quick) {
    Invoke-Check -Name 'build' -NpmArgs @('run', 'build')   # tsc -b && vite build (also typechecks)
} else {
    Write-Host ""
    Write-Host "=== build === SKIPPED (-Quick)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Note: the Ask Fredrik Worker (cloudflare/ask-fredrik-worker) has its own checks - run 'npm run check' and 'npm test' there when it changes." -ForegroundColor DarkGray

if ($script:failed.Count -gt 0) {
    Write-Host ""
    Write-Host "FAILED required checks: $($script:failed -join ', ')" -ForegroundColor Red
    exit 1
}
Write-Host ""
Write-Host "All required checks passed." -ForegroundColor Green
exit 0
