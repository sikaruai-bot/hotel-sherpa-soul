@echo off
setlocal
echo =======================================================
echo    HOTEL SHERPA SOUL - SYSTEM RESTORE UTILITY
echo =======================================================
set /p BACKUP_PATH="Enter the full path to your backup directory (e.g. ..\backups\backup_XXXXX): "

if not exist "%BACKUP_PATH%" (
    echo [ERROR] Specified backup path does not exist!
    pause
    exit /b 1
)

echo [*] Restoring database...
if exist "%BACKUP_PATH%\dev.db" (
    copy "%BACKUP_PATH%\dev.db" "..\prisma\dev.db" /y
    echo [OK] Database restored.
)

echo [*] Restoring environment config...
if exist "%BACKUP_PATH%\.env" (
    copy "%BACKUP_PATH%\.env" "..\.env" /y
    echo [OK] .env restored.
)

echo [*] Restoring media images...
if exist "%BACKUP_PATH%\images" (
    xcopy /E /I /Y "%BACKUP_PATH%\images" "..\public\images" >nul
    echo [OK] Images restored.
)

echo.
echo =======================================================
echo [SUCCESS] System restored successfully from %BACKUP_PATH%!
echo =======================================================
pause
