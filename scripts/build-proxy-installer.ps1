param(
  [string]$Version = "1.0.0"
)

Write-Host "Building Print Proxy installer..."
$ErrorActionPreference = "Stop"

# 1) Build the proxy EXE first
try {
  & powershell -NoProfile -ExecutionPolicy Bypass -File "$(Resolve-Path ./scripts/build-proxy.ps1)"
} catch {
  Write-Host "build-proxy.ps1 failed. Proceeding with existing dist/proxy artifacts."
}

# 2) Locate ISCC (Inno Setup command line compiler)
function Find-ISCC {
  $cmd = (Get-Command ISCC -ErrorAction SilentlyContinue)
  if ($cmd) { return $cmd.Path }
  $paths = @(
    "C:\\Program Files (x86)\\Inno Setup 6\\ISCC.exe",
    "C:\\Program Files\\Inno Setup 6\\ISCC.exe",
    ($env:LOCALAPPDATA + "\\Programs\\Inno Setup 6\\ISCC.exe")
  )
  foreach ($p in $paths) { if (Test-Path $p) { return $p } }
  $roots = @($env:ProgramFiles, ${env:ProgramFiles(x86)}, $env:LOCALAPPDATA)
  foreach ($r in $roots) {
    if (-not $r) { continue }
    if (Test-Path $r) {
      $hit = Get-ChildItem -Path $r -Recurse -Filter ISCC.exe -ErrorAction SilentlyContinue | Select-Object -First 1
      if ($hit) { return $hit.FullName }
    }
  }
  return $null
}

$iscc = Find-ISCC
if (-not $iscc) {
  Write-Host "Inno Setup not found. Attempting to install via winget..."
  try {
    winget install --id JRSoftware.InnoSetup -e --source winget --accept-source-agreements --accept-package-agreements
  } catch {
    Write-Host "winget install failed. Please install Inno Setup manually from https://jrsoftware.org/isinfo.php"
    exit 1
  }
  $iscc = Find-ISCC
  if (-not $iscc) { Write-Host "ISCC still not found after installation."; exit 1 }
}

# 3) Compile installer
$iss = Resolve-Path "./scripts/proxy-installer.iss"
$outDir = Join-Path (Resolve-Path .) "dist/installer"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null
& "$iscc" "/DMyAppVersion=$Version" "/O$outDir" "$iss"

Write-Host "Proxy installer build complete. See dist\\installer for output."


