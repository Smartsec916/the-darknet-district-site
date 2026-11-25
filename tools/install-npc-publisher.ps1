# Install the fixed-action Windows URL handler for the current user.
$ErrorActionPreference = 'Stop'
$source = Split-Path $PSScriptRoot -Parent
$install = Join-Path $env:LOCALAPPDATA 'Void Runner\NPC Publisher'
$node = (Get-Command node.exe -CommandType Application).Source
foreach ($relative in @('tools/npc-publisher.cjs', 'tools/assets/pack-model.cjs', 'void-runner/npc-paths.js')) {
    $destination = Join-Path $install $relative
    New-Item -ItemType Directory -Force -Path (Split-Path $destination) | Out-Null
    Copy-Item -LiteralPath (Join-Path $source $relative) -Destination $destination -Force
}
# Windows may launch this protocol from any browser. Ignore all URL arguments.
# Only the fixed, installed local publisher can be started.
$scriptFile = Join-Path $install 'open.vbs'
$entry = Join-Path $install 'tools\npc-publisher.cjs'
$launcher = @"
Set shell = CreateObject("WScript.Shell")
If Not shell.AppActivate("Void Runner NPC Publisher") Then
    shell.Run Chr(34) & "$node" & Chr(34) & " " & Chr(34) & "$entry" & Chr(34), 1, False
End If
"@
Set-Content -LiteralPath $scriptFile -Value $launcher -Encoding Unicode
$key = 'HKCU:\Software\Classes\voidrunner-publisher'
if (Test-Path $key) {
    if ((Get-Item $key).GetValue('') -ne 'URL:Void Runner NPC Publisher') {
        throw 'The voidrunner-publisher protocol already belongs to another application.'
    }
}
New-Item -Path $key -Force | Out-Null
Set-Item -Path $key -Value 'URL:Void Runner NPC Publisher'
New-ItemProperty -Path $key -Name 'URL Protocol' -Value '' -PropertyType String -Force | Out-Null
$command = Join-Path $key 'shell\open\command'
New-Item -Path $command -Force | Out-Null
$wscript = Join-Path $env:SystemRoot 'System32\wscript.exe'
Set-Item -Path $command -Value ('"{0}" "{1}"' -f $wscript, $scriptFile)
Write-Output 'Open PC Publisher is installed for this Windows user.'
