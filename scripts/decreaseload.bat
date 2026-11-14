@echo off
setlocal
set "FALHA=0"
powercfg /setactive SCHEME_MIN || set "FALHA=1"
exit /b %FALHA%
