; Inno Setup script for Print Proxy installer
; Requires Inno Setup (https://jrsoftware.org/isinfo.php)

#define MyAppName "Print Proxy"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "Your Org"
#define MyAppExeName "print-proxy.exe"

[Setup]
AppId={{D2C6D52B-7F67-4EC4-9A61-44AC091E9B9F}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
DefaultDirName={autopf}\PrintProxy
DisableProgramGroupPage=yes
OutputBaseFilename=PrintProxySetup
OutputDir=..\dist\installer
Compression=lzma
SolidCompression=yes
WizardStyle=modern

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Files]
Source: "..\dist\proxy\print-proxy.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\dist\proxy\print_proxy.config.sample.json"; DestDir: "{app}"; Flags: onlyifdoesntexist
Source: "..\dist\proxy\print_proxy.config.json"; DestDir: "{app}"; Flags: onlyifdoesntexist
Source: "..\scripts\start-proxy.ps1"; DestDir: "{app}"; Flags: ignoreversion

[Run]
; Create a SYSTEM scheduled task that starts at boot for the proxy
Filename: "schtasks"; Parameters: "/Create /TN ""PrintProxy"" /SC ONSTART /RL HIGHEST /RU SYSTEM /TR """"powershell.exe"" -NoProfile -ExecutionPolicy Bypass -File """"""{app}\start-proxy.ps1"""""""" /F"; Flags: runhidden; StatusMsg: "Creating startup scheduled task..."
; Start it immediately after install
Filename: "schtasks"; Parameters: "/Run /TN ""PrintProxy"""; Flags: runhidden; StatusMsg: "Starting proxy..."

[UninstallRun]
Filename: "schtasks"; Parameters: "/Delete /TN ""PrintProxy"" /F"; Flags: runhidden; RunOnceId: PrintProxy


