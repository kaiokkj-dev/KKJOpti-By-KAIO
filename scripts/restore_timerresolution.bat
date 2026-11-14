@echo off
setlocal
set "FALHA=0"
bcdedit /deletevalue disabledynamictick || set "FALHA=1"
exit /b %FALHA%
