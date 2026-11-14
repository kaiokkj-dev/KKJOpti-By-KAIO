@echo off
rem Cortana / Seu Telefone (Windows 10) e Vincular ao Celular (Windows 11).
rem Se nenhum estiver aberto, nao ha nada para encerrar.
taskkill /f /im Cortana.exe >nul 2>&1
taskkill /f /im YourPhone.exe >nul 2>&1
taskkill /f /im PhoneExperienceHost.exe >nul 2>&1
exit /b 0
