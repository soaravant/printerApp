$ErrorActionPreference = "Stop"
$dir = Split-Path -Parent $MyInvocation.MyCommand.Path
$cfgPath = Join-Path $dir 'print_proxy.config.json'
if (-Not (Test-Path $cfgPath)) { $cfgPath = Join-Path $dir 'print_proxy.config.sample.json' }
Start-Process -FilePath (Join-Path $dir 'print-proxy.exe') -WindowStyle Hidden


