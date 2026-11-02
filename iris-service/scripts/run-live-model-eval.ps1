# Runs scripts\live-model-eval.mjs with your OpenAI key, without the key ever appearing in chat, the command line, a file in
# the repository, or a log.
#
#   One-time setup (type or paste the key into the hidden prompt; nothing is echoed):
#       powershell -ExecutionPolicy Bypass -File scripts\run-live-model-eval.ps1 -SetupKey
#   Run the evaluation:
#       powershell -ExecutionPolicy Bypass -File scripts\run-live-model-eval.ps1
#   Remove the saved key afterwards:
#       powershell -ExecutionPolicy Bypass -File scripts\run-live-model-eval.ps1 -ClearKey
#
# The key is stored in %USERPROFILE%\.darknet-iris-eval\openai-key.dpapi, encrypted with Windows DPAPI: only your Windows
# account on this PC can decrypt it. It is outside every repository. It is read into this process's environment for the
# evaluation only and removed again when the script ends. Use a restricted key (an OpenAI project key with its own monthly
# budget limit of a few dollars) and revoke it when you are done.
param([switch]$SetupKey, [switch]$ClearKey, [string]$Langs = '', [double]$Cap = 0.85)
$ErrorActionPreference = 'Stop'
$dir = Join-Path $env:USERPROFILE '.darknet-iris-eval'
$file = Join-Path $dir 'openai-key.dpapi'
if ($SetupKey) {
  New-Item -ItemType Directory -Force $dir | Out-Null
  $secure = Read-Host 'OpenAI API key (hidden)' -AsSecureString
  if ($secure.Length -lt 20) { throw 'That does not look like an API key.' }
  $secure | ConvertFrom-SecureString | Set-Content -Path $file -Encoding ASCII
  Write-Host "Saved, encrypted to your Windows account: $file"
  return
}
if ($ClearKey) { if (Test-Path $file) { Remove-Item $file -Force; Write-Host 'Saved key removed.' } else { Write-Host 'No saved key.' }; return }
if (-not (Test-Path $file)) { throw 'No saved key. Run this script once with -SetupKey first.' }
$secure = Get-Content $file | ConvertTo-SecureString
$bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
try { $env:OPENAI_API_KEY = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr) } finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr) }
try {
  Set-Location (Join-Path $PSScriptRoot '..')
  $nodeArgs = @('scripts/live-model-eval.mjs', '--cap', $Cap)
  if ($Langs) { $nodeArgs += @('--langs', $Langs) }
  & node @nodeArgs
  exit $LASTEXITCODE
} finally { Remove-Item Env:OPENAI_API_KEY -ErrorAction SilentlyContinue }
