@echo off
rem Starts the local preview of The Darknet District (nothing is published or uploaded).
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is needed for the preview. Install the LTS version from https://nodejs.org then run this file again.
  pause
  exit /b 1
)
start "" "http://127.0.0.1:5187/void-runner.html"
node tools\preview-server.cjs
pause
