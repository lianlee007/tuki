@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"

title TukiTuki - Inicio completo

where pwsh >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    pwsh -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\iniciar-todo.ps1"
) else (
    powershell -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\iniciar-todo.ps1"
)

echo.
echo   La ventana se queda abierta para que tengas las credenciales a mano.
pause
