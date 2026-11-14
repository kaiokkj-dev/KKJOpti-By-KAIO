@echo off
del /f /s /q "%TEMP%\*" >nul 2>&1
del /f /s /q "%SystemRoot%\Temp\*" >nul 2>&1
ipconfig /flushdns >nul 2>&1
exit /b 0
