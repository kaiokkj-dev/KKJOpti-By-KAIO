@echo off
setlocal
set "FALHA=0"
bcdedit /set disabledynamictick no || set "FALHA=1"
exit /b %FALHA%
