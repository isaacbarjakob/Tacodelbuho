@echo off
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0install-ll-admin-adapter.ps1"
if errorlevel 1 exit /b 1
del /q "%~dp0install-ll-admin-adapter.ps1" 2>nul
del /q "%~dp0README-FÖRST.md" 2>nul
del /q "%~f0" 2>nul
