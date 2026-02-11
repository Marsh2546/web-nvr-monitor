@echo off
REM CCTV NVR Monitor - Google Sheets Daily Import Task
REM This batch file sets up and runs the daily import

set SCRIPT_DIR=%~dp0
set PROJECT_DIR=%~dp0
set LOG_FILE=C:\cctv-nvr-monitor\logs\google-sheets-daily-import.log
set DATE=%date% %time%

echo ======================================== >> "%LOG_FILE%"
echo 🚀 Google Sheets Daily Import - %DATE% >> "%LOG_FILE%"
echo ======================================== >> "%LOG_FILE%"

REM Change to project directory
cd /d "%SCRIPT_DIR%"

REM Check if Node.js is available
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js not found. Please install Node.js. >> "%LOG_FILE%"
    exit /b 1
)

REM Check if the import script exists
if not exist "scripts\import-google-sheets.cjs" (
    echo ❌ Import script not found: scripts\import-google-sheets.cjs >> "%LOG_FILE%"
    exit /b 1
)

REM Run the import script
echo 📊 Starting Google Sheets import... >> "%LOG_FILE%"

node scripts\import-google-sheets.cjs >> "%LOG_FILE%" 2>&1

if %ERRORLEVEL% EQU 0 (
    echo ✅ Google Sheets import completed successfully! >> "%LOG_FILE%"
) else (
    echo ❌ Google Sheets import failed with exit code %ERRORLEVEL% >> "%LOG_FILE%"
    exit /b %ERRORLEVEL%
)

echo 📊 Import process finished at %date% %time% >> "%LOG_FILE%"
echo ======================================== >> "%LOG_FILE%"
