@echo off
del /q /f /s "%SystemRoot%\Temp\*" >nul 2>&1
for /d %%x in ("%SystemRoot%\Temp\*") do rd /s /q "%%x" >nul 2>&1
del /q /f /s "%SystemRoot%\SoftwareDistribution\Download\*" >nul 2>&1
exit /b 0
