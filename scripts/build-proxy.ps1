param()

$OutDir = "dist/proxy"
$Version = "1.0.0"

Write-Host "Building print proxy executable..."

$ErrorActionPreference = "Stop"

function Resolve-Python {
  try { $py = & python -c "import sys; print(sys.executable)" 2>$null; if ($LASTEXITCODE -eq 0 -and $py) { return $py.Trim() } } catch {}
  try { $py3 = & py -3 -c "import sys; print(sys.executable)" 2>$null; if ($LASTEXITCODE -eq 0 -and $py3) { return $py3.Trim() } } catch {}
  $candidates = @()
  $candidates += (Get-ChildItem -Path "$env:LOCALAPPDATA\Programs\Python" -Directory -ErrorAction SilentlyContinue | ForEach-Object { Join-Path $_.FullName 'python.exe' })
  $candidates += (Get-ChildItem -Path "$env:ProgramFiles\Python*" -Directory -ErrorAction SilentlyContinue | ForEach-Object { Join-Path $_.FullName 'python.exe' })
  $candidates += (Get-ChildItem -Path "$env:ProgramFiles(x86)\Python*" -Directory -ErrorAction SilentlyContinue | ForEach-Object { Join-Path $_.FullName 'python.exe' })
  foreach ($p in $candidates) { if (Test-Path $p) { return $p } }
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

New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

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

try { & $Python -m PyInstaller --version | Out-Null } catch { Write-Host "Installing PyInstaller..."; & $Python -m pip install pyinstaller | Out-Null }

Push-Location (Resolve-Path "./python")
try {
  & $Python -m PyInstaller --noconfirm --clean --onefile --windowed --name print-proxy --add-data "print_proxy.config.sample.json;." print_proxy.py
  $outDirFull = Resolve-Path "../$OutDir"
  Copy-Item -Force "dist/print-proxy.exe" (Join-Path $outDirFull "print-proxy.exe")
  Copy-Item -Force "print_proxy.config.sample.json" (Join-Path $outDirFull "print_proxy.config.sample.json")
  $destDefaultConfig = Join-Path $outDirFull "print_proxy.config.json"
  if (-Not (Test-Path $destDefaultConfig -ErrorAction SilentlyContinue)) { Copy-Item -Force "print_proxy.config.sample.json" $destDefaultConfig }
  Write-Host "Proxy built to $OutDir\print-proxy.exe"
} finally { Pop-Location }

Write-Host "Done."


