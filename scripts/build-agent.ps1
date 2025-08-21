param()

# Configure here (baked into installer)
$IngestUrl = "https://printer-app-one.vercel.app/api/print-jobs/ingest"
$HmacSecret = "Nf1CAoSTMjKn0yAeAOWmrXCbqfJ9xv+G1xeksJQp7lbA/29RN27vow++bYLWQ07AygJt2dbeLv0kL33VsVBHYQ=="
$OutDir = "dist/agent"
$Python = "python"
$Version = "1.0.0"

Write-Host "Building agent executable..."

$ErrorActionPreference = "Stop"

function Resolve-Python {
  try { $py = & python -c "import sys; print(sys.executable)" 2>$null; if ($LASTEXITCODE -eq 0 -and $py) { return $py.Trim() } } catch {}
  try { $py3 = & py -3 -c "import sys; print(sys.executable)" 2>$null; if ($LASTEXITCODE -eq 0 -and $py3) { return $py3.Trim() } } catch {}
  # Search common install locations
  $candidates = @()
  $candidates += (Get-ChildItem -Path "$env:LOCALAPPDATA\Programs\Python" -Directory -ErrorAction SilentlyContinue | ForEach-Object { Join-Path $_.FullName 'python.exe' })
  $candidates += (Get-ChildItem -Path "$env:ProgramFiles\Python*" -Directory -ErrorAction SilentlyContinue | ForEach-Object { Join-Path $_.FullName 'python.exe' })
  $candidates += (Get-ChildItem -Path "$env:ProgramFiles(x86)\Python*" -Directory -ErrorAction SilentlyContinue | ForEach-Object { Join-Path $_.FullName 'python.exe' })
  foreach ($p in $candidates) { if (Test-Path $p) { return $p } }
  # Registry lookup
  foreach ($root in @('HKCU','HKLM')) {
    try {
      $keyPath = "$root:Software\Python\PythonCore"
      $vers = Get-ChildItem $keyPath -ErrorAction SilentlyContinue
      foreach ($v in $vers) {
        $ip = (Get-ItemProperty -Path (Join-Path $v.PSPath 'InstallPath') -ErrorAction SilentlyContinue).'(default)'
        if ($ip) {
          $exe = Join-Path $ip 'python.exe'
          if (Test-Path $exe) { return $exe }
        }
      }
    } catch {}
  }
  return $null
}

# Ensure output folder
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

# Ensure Python exists (install via winget if missing)
$PythonPath = Resolve-Python
if (-not $PythonPath) {
  Write-Host "Python not found. Installing Python 3 via winget..."
  try {
    winget install -e --id Python.Python.3 --source winget --accept-source-agreements --accept-package-agreements | Out-Null
  } catch {
    Write-Host "winget failed to install Python. Please install Python 3.x and re-run."
    throw
  }
  Start-Sleep -Seconds 10
  $PythonPath = Resolve-Python
}
if (-not $PythonPath) { throw "Python 3 not found after installation." }
$Python = $PythonPath

# Check PyInstaller
try {
  & $Python -m PyInstaller --version | Out-Null
} catch {
  Write-Host "Installing PyInstaller..."
  & $Python -m pip install pyinstaller | Out-Null
}

# Build single-file EXE
Push-Location (Resolve-Path "./python")
try {
  # If provided, generate a pre-configured agent.config.json into output dir
  if ($IngestUrl -and $HmacSecret) {
    $config = @{
      printIngestUrl = $IngestUrl
      hmacSecret = $HmacSecret
      # Built-in IP mapping is compiled into the agent; override here only if needed
      # ipToDeviceName = @{ "192.168.3.41" = "Canon B/W"; "192.168.3.42" = "Canon Color"; "192.168.3.43" = "Brother"; "192.168.6.41" = "Κυδωνιών"; default = "Canon Color" }
    } | ConvertTo-Json -Depth 5
    $outDirFull = Resolve-Path "../$OutDir"
    $outConfigPath = Join-Path $outDirFull "agent.config.json"
    # Write without BOM to avoid JSON decode issues
    $utf8NoBom = New-Object System.Text.UTF8Encoding $false
    [System.IO.File]::WriteAllText($outConfigPath, $config, $utf8NoBom)
    Write-Host "Wrote preconfigured agent.config.json"
  }

  # Use python -m PyInstaller so PATH isn't required
  & $Python -m PyInstaller --noconfirm --clean --onefile --windowed --name printer-agent --add-data "agent.config.sample.json;." agent.py

  $outDirFull = Resolve-Path "../$OutDir"
  Copy-Item -Force "dist/printer-agent.exe" (Join-Path $outDirFull "printer-agent.exe")
  Copy-Item -Force "agent.config.sample.json" (Join-Path $outDirFull "agent.config.sample.json")
  # Also provide default config as agent.config.json if not present
  $destDefaultConfig = Join-Path $outDirFull "agent.config.json"
  if (-Not (Test-Path $destDefaultConfig -ErrorAction SilentlyContinue)) {
    Copy-Item -Force "agent.config.sample.json" $destDefaultConfig
  }
  Write-Host "Agent built to $OutDir\printer-agent.exe"
} finally {
  Pop-Location
}

Write-Host "Done."


