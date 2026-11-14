@echo off
setlocal
set "FALHA=0"
rem Conserta o limite da configuracao (a versao antiga do KKJOpti gravava ValueMax=0,
rem o que travava o valor em 0%% e impedia qualquer ajuste).
reg add "HKLM\SYSTEM\CurrentControlSet\Control\Power\PowerSettings\54533251-82be-4824-96c1-47b60b740d00\0cc5b647-c1df-4637-891a-dec35c318583" /v ValueMax /t REG_DWORD /d 100 /f >nul || set "FALHA=1"
reg add "HKLM\SYSTEM\CurrentControlSet\Control\Power\PowerSettings\54533251-82be-4824-96c1-47b60b740d00\0cc5b647-c1df-4637-891a-dec35c318583" /v ValueMin /t REG_DWORD /d 0 /f >nul || set "FALHA=1"
powercfg /setacvalueindex scheme_current sub_processor CPMINCORES 100 || set "FALHA=1"
powercfg /setdcvalueindex scheme_current sub_processor CPMINCORES 100 || set "FALHA=1"
powercfg /setactive scheme_current || set "FALHA=1"
exit /b %FALHA%
