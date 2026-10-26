@echo off
cd /d "%~dp0"
echo ScadaWatt V141 - tipografi stilleri
call npm.cmd run build
if errorlevel 1 (pause & exit /b 1)
call npm.cmd start
pause
