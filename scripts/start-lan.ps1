param([switch]$PrepareOnly)

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$launchArguments = $args
$gameRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))

function Test-CompatibleNode([string]$Candidate) {
  if (-not $Candidate -or -not (Test-Path -LiteralPath $Candidate -PathType Leaf)) { return $false }
  try {
    $version = & $Candidate --version 2>$null
    return $LASTEXITCODE -eq 0 -and $version -match '^v(20|22)\.'
  } catch { return $false }
}

try {
  # A source ZIP may already contain a prepared kit. Its own launcher uses the same helper.
  $preparedKit = Join-Path $gameRoot '.build/lan-kit'
  if ((Test-Path -LiteralPath (Join-Path $preparedKit 'dist/index.html')) -and
      (Test-Path -LiteralPath (Join-Path $preparedKit 'scripts/start-lan.ps1'))) {
    $gameRoot = $preparedKit
  }
  Set-Location -LiteralPath $gameRoot
  $versionFile = Join-Path $gameRoot '.nvmrc'
  if (-not (Test-Path -LiteralPath $versionFile)) { throw 'The game package is incomplete. Extract the entire ZIP and try again.' }
  $downloadVersion = (Get-Content -LiteralPath $versionFile -Raw).Trim()
  if ($downloadVersion -notmatch '^22\.\d+\.\d+$') { throw 'The game specifies an unsupported Node download version.' }
  $architecture = 'x64'
  if ($env:PROCESSOR_ARCHITECTURE -eq 'ARM64' -or $env:PROCESSOR_ARCHITEW6432 -eq 'ARM64') { $architecture = 'arm64' }
  elseif (-not [Environment]::Is64BitOperatingSystem) { throw 'This launcher requires 64-bit Windows.' }
  $sourceTree = Test-Path -LiteralPath (Join-Path $gameRoot 'package-lock.json')
  $runtimeRoot = Join-Path $gameRoot $(if ($sourceTree) { '.build/runtime' } else { '.lan-runtime' })
  $distIndex = Join-Path $gameRoot $(if ($sourceTree) { '.build/app/index.html' } else { 'dist/index.html' })
  $runtimeName = "node-v$downloadVersion-win-$architecture"
  $cachedNode = Join-Path $runtimeRoot "$runtimeName/node.exe"
  $installedNode = Get-Command node.exe -ErrorAction SilentlyContinue
  $nodeExecutable = $null
  $candidates = @((Join-Path $gameRoot 'node.exe'), $cachedNode)
  if ($installedNode) { $candidates += $installedNode.Source }
  foreach ($candidate in $candidates) {
    if (Test-CompatibleNode $candidate) { $nodeExecutable = $candidate; break }
  }

  if (-not $nodeExecutable) {
    Write-Host "Preparing Node.js $downloadVersion. This first download needs internet; later games run offline."
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    New-Item -ItemType Directory -Path $runtimeRoot -Force | Out-Null
    $archiveName = "$runtimeName.zip"
    $archivePath = Join-Path $runtimeRoot $archiveName
    $downloadBase = "https://nodejs.org/dist/v$downloadVersion"
    $checksums = (Invoke-WebRequest -UseBasicParsing -Uri "$downloadBase/SHASUMS256.txt").Content
    if ($checksums -is [byte[]]) { $checksums = [Text.Encoding]::UTF8.GetString($checksums) }
    $checksum = ($checksums -split "`n" | Where-Object { $_ -match "\s+$([regex]::Escape($archiveName))\s*$" } | Select-Object -First 1)
    if (-not $checksum) { throw 'The official Node.js download list does not include this Windows version.' }
    $expectedHash = ($checksum.Trim() -split '\s+')[0]
    if ($expectedHash -notmatch '^[a-fA-F0-9]{64}$') { throw 'Invalid checksum in the official Node.js download list.' }
    Invoke-WebRequest -UseBasicParsing -Uri "$downloadBase/$archiveName" -OutFile $archivePath
    if ((Get-FileHash -LiteralPath $archivePath -Algorithm SHA256).Hash -ne $expectedHash) {
      Remove-Item -LiteralPath $archivePath
      throw 'Node.js download verification failed. Reconnect internet and launch again.'
    }
    Expand-Archive -LiteralPath $archivePath -DestinationPath $runtimeRoot -Force
    Remove-Item -LiteralPath $archivePath
    if (-not (Test-CompatibleNode $cachedNode)) { throw 'The downloaded Node.js runtime could not start on this computer.' }
    $nodeExecutable = $cachedNode
  }

  $nodeDirectory = Split-Path -Parent $nodeExecutable
  $env:PATH = "$nodeDirectory;$env:PATH"
  Write-Host "Using Node.js $(& $nodeExecutable --version)."
  if (-not (Test-Path -LiteralPath $distIndex)) {
    if (-not (Test-Path -LiteralPath (Join-Path $gameRoot 'package-lock.json'))) {
      throw 'The prepared game files are missing. Extract the complete LAN release ZIP again.'
    }
    Write-Host 'Preparing the game for the first time. Keep internet connected and this window open.'
    $npmExecutable = Join-Path $nodeDirectory 'npm.cmd'
    if (-not (Test-Path -LiteralPath $npmExecutable)) {
      throw 'This Node installation has no npm. Use the ready-to-play release ZIP or install the official Node.js 22 Windows package.'
    }
    & $npmExecutable ci
    if ($LASTEXITCODE -ne 0) { throw 'Game setup did not finish. Check your internet connection and launch again.' }
    & $nodeExecutable (Join-Path $gameRoot 'scripts/build-lan.mjs')
    if ($LASTEXITCODE -ne 0) { throw 'The game could not be prepared. Keep the message above when asking for help.' }
  }
  if ($PrepareOnly) { Write-Host 'The game is ready for offline play.'; exit 0 }
  & $nodeExecutable (Join-Path $gameRoot 'scripts/lan.mjs') @launchArguments
  exit $LASTEXITCODE
} catch {
  Write-Host "`nUnable to start the LAN game: $($_.Exception.Message)" -ForegroundColor Red
  Write-Host 'Keep this message when asking for help. See docs/offline-lan.md for setup and recovery instructions.'
  exit 1
}
