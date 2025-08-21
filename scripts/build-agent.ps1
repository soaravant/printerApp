param()

# Configure here (baked into installer)
$IngestUrl = "https://printer-app-one.vercel.app/api/print-jobs/ingest"
$HmacSecret = "Nf1CAoSTMjKn0yAeAOWmrXCbqfJ9xv+G1xeksJQp7lbA/29RN27vow++bYLWQ07AygJt2dbeLv0kL33VsVBHYQ=="
$OutDir = "dist/agent"
$Python = "python"
$Version = "1.0.0"

Write-Host "Building agent executable..."

$ErrorActionPreference = "Stop"

# Ensure output folder
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

# Check PyInstaller
try {
  pyinstaller --version | Out-Null
} catch {
  Write-Host "Installing PyInstaller..."
  & $Python -m pip install --user pyinstaller | Out-Null
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
    Set-Content -Path $outConfigPath -Encoding UTF8 -Value $config
    Write-Host "Wrote preconfigured agent.config.json"
  }

  # Use python -m PyInstaller so PATH isn't required
  & $Python -m PyInstaller --noconfirm --clean --onefile --name printer-agent --add-data "agent.config.sample.json;." agent.py

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


