; Inno Setup script for Printer Agent installer
; Requires Inno Setup (https://jrsoftware.org/isinfo.php)

#define MyAppName "Printer Agent"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "Your Org"
#define MyAppExeName "printer-agent.exe"

[Setup]
AppId={{6A8C7C5D-2F3B-4D68-9B35-7B7F1E7B6B1B}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
DefaultDirName={autopf}\PrinterAgent
DisableProgramGroupPage=yes
OutputBaseFilename=PrinterAgentSetup
OutputDir=..\dist\installer
Compression=lzma
SolidCompression=yes
WizardStyle=modern

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Files]
Source: "..\dist\agent\printer-agent.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\dist\agent\agent.config.sample.json"; DestDir: "{app}"; Flags: onlyifdoesntexist
Source: "..\dist\agent\agent.config.json"; DestDir: "{app}"; Flags: onlyifdoesntexist
Source: "..\dist\agent\start-agent.ps1"; DestDir: "{app}"; Flags: ignoreversion

[Run]
Filename: "wevtutil"; Parameters: "sl Microsoft-Windows-PrintService/Operational /e:true"; Flags: runhidden; StatusMsg: "Enabling Windows PrintService log..."
; Create a SYSTEM scheduled task that starts at boot
; Use a bootstrap script that reads hmacSecret from agent.config.json and sets env var before launching the EXE
Filename: "schtasks"; Parameters: "/Create /TN ""PrinterAgent"" /SC ONSTART /RL HIGHEST /RU SYSTEM /TR """"powershell.exe"" -NoProfile -ExecutionPolicy Bypass -File """"""{app}\start-agent.ps1"""""""" /F"; Flags: runhidden; StatusMsg: "Creating startup scheduled task..."
; Start it immediately after install
Filename: "schtasks"; Parameters: "/Run /TN ""PrinterAgent"""; Flags: runhidden; StatusMsg: "Starting agent..."

[UninstallRun]
Filename: "schtasks"; Parameters: "/Delete /TN ""PrinterAgent"" /F"; Flags: runhidden; RunOnceId: PrinterAgent


