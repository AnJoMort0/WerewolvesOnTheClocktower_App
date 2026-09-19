param([Parameter(Mandatory=$true)][string]$KitPath, [Parameter(Mandatory=$true)][string]$Destination)
$ErrorActionPreference = 'Stop'
try {
  $kit = [IO.Path]::GetFullPath($KitPath)
  if (Test-Path -LiteralPath (Join-Path $kit '.lan')) { throw 'Cannot distribute a kit containing saved games.' }
  # An explicit list excludes caches, personal files, and any unrelated kit contents.
  $files = @('dist', 'server', 'scripts', 'docs', 'licenses', '.nvmrc', 'node.exe', 'Start LAN Game.cmd', 'README.md') |
    ForEach-Object {
      $path = Join-Path $kit $_
      if (-not (Test-Path -LiteralPath $path)) { throw "Package file missing: $_" }
      $path
    }
  Compress-Archive -LiteralPath $files -DestinationPath $Destination -CompressionLevel Optimal -Force
} catch { Write-Error $_; exit 1 }
