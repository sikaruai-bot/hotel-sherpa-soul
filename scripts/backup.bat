@echo off
setlocal
cd /d "%~dp0\.."

echo =======================================================
echo    HOTEL SHERPA SOUL - AUTOMATED SYSTEM BACKUP
echo =======================================================

:: Safe timestamp generation
for /f %%A in ('powershell -Command "Get-Date -Format 'yyyyMMdd_HHmmss'"') do set dt=%%A
if "%dt%"=="" set dt=manual

set BACKUP_DIR=backups\backup_%dt%
mkdir "%BACKUP_DIR%" 2>nul
mkdir "%BACKUP_DIR%\images" 2>nul

echo [*] Backing up SQLite Database...
if exist "prisma\dev.db" (
    copy "prisma\dev.db" "%BACKUP_DIR%\dev.db" /y >nul
    echo [OK] Database backed up to %BACKUP_DIR%\dev.db
) else if exist "dev.db" (
    copy "dev.db" "%BACKUP_DIR%\dev.db" /y >nul
    echo [OK] Database backed up to %BACKUP_DIR%\dev.db
) else (
    echo [WARN] dev.db not found!
)

echo [*] Backing up Environment Configuration...
if exist ".env" (
    copy ".env" "%BACKUP_DIR%\.env" /y >nul
    echo [OK] .env configuration backed up.
)

echo [*] Backing up Uploaded Hotel Assets...
if exist "public\images" (
    xcopy /E /I /Y "public\images" "%BACKUP_DIR%\images" >nul
    echo [OK] Uploaded images backed up.
)

echo.
echo =======================================================
echo [SUCCESS] Backup completed successfully!
echo Backup folder: %BACKUP_DIR%
echo =======================================================
