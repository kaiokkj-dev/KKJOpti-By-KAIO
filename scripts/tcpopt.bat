@echo off
setlocal
set "FALHA=0"
netsh int tcp set global autotuninglevel=normal || set "FALHA=1"
netsh int tcp set global rss=enabled || set "FALHA=1"
exit /b %FALHA%
