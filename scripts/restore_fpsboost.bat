@echo off
setlocal
set "FALHA=0"
powercfg /setactive SCHEME_BALANCED || set "FALHA=1"
bcdedit /set disabledynamictick no || set "FALHA=1"
exit /b %FALHA%
