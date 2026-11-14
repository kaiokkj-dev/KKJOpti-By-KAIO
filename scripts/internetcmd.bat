@echo off
setlocal
set "FALHA=0"
ipconfig /flushdns || set "FALHA=1"
netsh winsock reset || set "FALHA=1"
netsh int ip reset || set "FALHA=1"
exit /b %FALHA%
