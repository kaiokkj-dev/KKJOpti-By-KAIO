@echo off
setlocal
set "FALHA=0"
ipconfig /flushdns || set "FALHA=1"
ipconfig /registerdns || set "FALHA=1"
exit /b %FALHA%
