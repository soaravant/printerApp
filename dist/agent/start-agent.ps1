$ErrorActionPreference = "Stop"
$dir = Split-Path -Parent $MyInvocation.MyCommand.Path
$cfgPath = Join-Path $dir 'agent.config.json'
try {
  $cfgText = Get-Content -Raw -Encoding UTF8 $cfgPath
} catch {
  $cfgText = Get-Content -Raw -Encoding UTF8 (Join-Path $dir 'agent.config.sample.json')
}
try { $cfg = $cfgText | ConvertFrom-Json } catch { $cfg = $null }
if ($cfg -and $cfg.hmacSecret) { $env:PRINT_INGEST_HMAC_SECRET = [string]$cfg.hmacSecret }
Start-Process -FilePath (Join-Path $dir 'printer-agent.exe') -WindowStyle Hidden