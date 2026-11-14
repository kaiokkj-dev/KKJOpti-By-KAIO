@echo off
setlocal
set "FALHA=0"
powershell.exe -NoProfile -NonInteractive -Command "Disable-MMAgent -MemoryCompression -ErrorAction Stop" || set "FALHA=1"
exit /b %FALHA%
