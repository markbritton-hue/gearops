@echo off
title GearOps Update
cd /d "%~dp0"

echo ── Pulling latest from GitHub ─────────────────────────────
git pull
if errorlevel 1 (
  echo.
  echo git pull failed - resolve the problem above, then run this again.
  pause
  exit /b 1
)

echo.
echo ── Installing dependencies ────────────────────────────────
call npm install
if errorlevel 1 (
  echo.
  echo npm install failed - see the error above.
  pause
  exit /b 1
)

echo.
echo ── Restarting server ──────────────────────────────────────
taskkill /F /IM node.exe >nul 2>&1
timeout /t 1 /nobreak >nul
start "GearOps" node "%~dp0server.js"
start "" http://localhost:8080

echo.
echo GearOps updated and restarted.
timeout /t 3 /nobreak >nul
