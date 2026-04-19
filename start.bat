@echo off
title Streamwave Equipment Dashboard
echo Starting Streamwave Equipment Dashboard...
start "" http://localhost:8080
node "%~dp0server.js"
pause
