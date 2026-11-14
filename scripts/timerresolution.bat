@echo off
setlocal
set "FALHA=0"
bcdedit /set disabledynamictick yes || set "FALHA=1"
exit /b %FALHA%
