@echo off
rem App Xbox (Windows 10) e Xbox Game Bar (Windows 11).
taskkill /f /im XboxAppServices.exe >nul 2>&1
taskkill /f /im GameBar.exe >nul 2>&1
taskkill /f /im GameBarFTServer.exe >nul 2>&1
exit /b 0
