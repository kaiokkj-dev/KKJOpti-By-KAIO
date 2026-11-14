@echo off
rem Cache de shaders: os jogos recriam na proxima vez que abrirem.
for %%d in ("%LOCALAPPDATA%\D3DSCache" "%LOCALAPPDATA%\NVIDIA\DXCache" "%LOCALAPPDATA%\NVIDIA\GLCache" "%LOCALAPPDATA%\AMD\DxCache" "%LOCALAPPDATA%\AMD\GLCache") do (
  if exist "%%~d" (
    del /q /f /s "%%~d\*" >nul 2>&1
    for /d %%x in ("%%~d\*") do rd /s /q "%%x" >nul 2>&1
  )
)
exit /b 0
