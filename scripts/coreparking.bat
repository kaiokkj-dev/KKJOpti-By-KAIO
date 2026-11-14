@echo off
setlocal
set "FALHA=0"
powercfg /setacvalueindex scheme_current sub_processor CPMINCORES 100 || set "FALHA=1"
powercfg /setdcvalueindex scheme_current sub_processor CPMINCORES 100 || set "FALHA=1"
powercfg /setactive scheme_current || set "FALHA=1"
exit /b %FALHA%
